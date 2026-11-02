# Tabelas do Evoluna

O aplicativo lê os registros de tabelas por entidade e salva as alterações em uma transação. O proprietário é obtido da sessão autenticada no servidor. A organização atual continua sendo por conta; este trabalho não habilita colaboradores ou compartilhamento entre profissionais.

## Resultado da varredura

| Tabela | Conteúdo e vínculo |
| --- | --- |
| `evoluna_workspaces` (existente) | Proprietário, revisão concorrente e cópia compatível do estado anterior. |
| `evoluna_patients` | Uma linha por paciente; ID, nome, CPF, telefone, e-mail, nascimento e status consultáveis em colunas. Foto e campos adicionais preservados no registro. |
| `evoluna_patient_records` | Um prontuário por paciente, com anamnese, odontograma e detalhes dentários. |
| `evoluna_clinical_entries` | Uma linha por evolução do prontuário, inclusive registros antigos sem ID. |
| `evoluna_treatments` | Uma linha por procedimento planejado do paciente. |
| `evoluna_care_plans` | Planos de atendimento registrados nas sessões/documentos. |
| `evoluna_appointments` | Uma linha por agendamento; paciente, data, horário, profissional e status. |
| `evoluna_documents` | Uma linha por documento; conteúdo, campos preenchidos e vínculo ao paciente. |
| `evoluna_financial_entries` | Uma linha por receita/despesa; valor numérico, tipo, status, data e paciente opcional. |
| `evoluna_smile_simulations` | Uma linha por simulação salva, com referência ao paciente e parâmetros da prévia. |
| `evoluna_consultation_sessions` | Uma linha por sessão de atendimento; paciente e agendamento vinculados. |
| `evoluna_session_entries` | Anotações/documentos vinculados a cada sessão. |
| `evoluna_session_drafts` | Rascunho ainda em edição em cada sessão. |
| `evoluna_clinic_settings` | Dados da clínica e preferências de cada conta. |
| `evoluna_activity_log` | Atividades recentes da conta. Não é uma trilha de auditoria imutável. |
| `evoluna_workspace_metadata` | Versão, campos adicionais e informação necessária para reconstruir fielmente os registros antigos. |

São 15 tabelas novas além de `evoluna_workspaces`. Todas usam chaves que incluem o proprietário. Os vínculos de pacientes e agendamentos também incluem o proprietário para impedir referências entre contas. As listas preservam a ordem original. Campos extensíveis do aplicativo permanecem em JSONB por registro; não há descarte de campos desconhecidos, rascunhos ou imagens existentes.

Não é necessário criar uma tabela para Relatórios, pois são consultas dos registros existentes. Documentos e PDFs são gerados dos dados salvos; o aplicativo não mantém um acervo separado de PDFs. Financiamento continua como recurso futuro. Contas e senhas continuam em `auth.users`, gerenciadas pelo Supabase Auth. Colaboradores, convites e permissões compartilhadas continuam fora desta etapa.

## Salvamento e compatibilidade

- `evoluna_load_workspace()` reconstrói a estrutura usada pelas telas a partir das tabelas novas, em uma leitura consistente.
- `evoluna_create_workspace(p_state)` cria o espaço da conta e retorna os registros que efetivamente existem; uma segunda criação não sobrescreve a primeira.
- `evoluna_save_workspace(p_state, p_expected_revision)` compara a revisão e salva todos os módulos atomicamente. Um erro de vínculo, validação ou conflito não deixa salvamento parcial.
- Um trigger interno sincroniza as tabelas por entidade, inclusive quando uma aba antiga salva em `evoluna_workspaces`. Registros existentes só são atualizados se seus valores ou posições mudaram; registros removidos deixam de aparecer nas tabelas.
- RLS permite a cada usuário ler somente suas linhas; `anon` e usuários anônimos do Auth não recebem acesso. As tabelas novas não concedem escrita direta ao cliente; as funções públicas de salvamento usam `security invoker`.
- O sincronizador usa `security definer` em um schema interno sem acesso dos clientes, com proprietário validado e `search_path` vazio. Ele é necessário para manter a escrita nas tabelas restrita ao salvamento transacional.

A cópia JSON antiga é mantida atualizada para compatibilidade e retorno à versão anterior. O envio ainda usa um estado completo da conta, com o limite existente de 16 MiB. A separação em tabelas não elimina esse limite nesta versão. Fotos existentes seguem no registro; não houve migração para buckets públicos ou contratação de armazenamento.

## Instalar e verificar

Em uma base nova, aplique primeiro `supabase/workspace-schema.sql` e depois a migração em `supabase/migrations/*_normalize_clinical_modules.sql`. Na base existente, não reaplique o esquema inicial: aplique somente a migração registrada. Não executar os rascunhos da pasta `supabase/proposals` como parte da instalação.

Os testes `npm run test:database` executam a migração em Postgres isolado (PGlite) e verificam preservação dos dados, criação, alteração, remoção, conflitos, compatibilidade, rollback e isolamento entre contas. Usam apenas registros fictícios. `npm run test:cloud` verifica a integração do cliente com as funções RPC.

O retorno à versão anterior do cliente pode continuar usando a tabela original, que é sincronizada com as novas. Não apagar as tabelas nem reimportar backups sobre dados mais recentes para fazer esse retorno. Credenciais e dados privados não fazem parte do código versionado.

## Verificação da migração aplicada

A migração `normalize_clinical_modules` foi aplicada no Supabase na versão `20261102124539`. O arquivo local usa a mesma versão registrada no banco. A conferência confirmou 16 tabelas do Evoluna, incluindo a tabela anterior, 2 pacientes e 2 prontuários preservados, com RLS em todas as tabelas. A reconstrução a partir das tabelas novas foi comparada ao estado anterior sem divergência. O salvamento e o conflito de revisão foram testados na base real em uma transação revertida; nenhum registro de teste ficou na conta. Também foram verificados o isolamento entre contas e o bloqueio de usuários anônimos.

Os advisors não apontaram problemas novos de segurança no esquema. Permanece um aviso anterior do Supabase Auth sobre [proteção contra senhas vazadas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). Os índices novos ainda sem uso se referem a módulos sem registros; foram mantidos para os vínculos e consultas previstos.
