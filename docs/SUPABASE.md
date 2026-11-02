# Persistência Supabase — Evoluna IA

Projeto: `frviuoafenrqnueglwnq` (região São Paulo).

A aplicação estática usa `@supabase/supabase-js` 2.118.0. O arquivo público
`cloud-config.js` contém somente URL e chave publicável; nenhuma chave de serviço.
O convite de teleconsulta continua independente do login da clínica.

## Dados e isolamento

`public.evoluna_workspaces`: uma linha privada por usuário do Supabase Auth.
`state` guarda o estado dos módulos existentes (pacientes, agenda, prontuários,
documentos, financeiro, imagens/prévias e configurações) em JSONB, atomicamente.
É uma primeira integração por conta, sem compartilhamento entre profissionais.
A separação em tabelas por entidade e imagens em Storage pode ser feita depois,
conforme o volume. O limite atual do estado é 16 MiB por conta.

RLS habilitada; `anon` sem acesso; usuários autenticados só podem selecionar,
inserir e atualizar a própria linha. Usuários anônimos do Auth também são negados.
Não há DELETE concedido ao cliente. O banco preserva proprietário/data de criação
nas atualizações e incrementa `revision` por trigger invoker.

A atualização compara a revisão carregada. Uma segunda aba com revisão antiga
recebe conflito e não sobrescreve a versão remota. A interface mantém o formulário,
oferece baixar as alterações e permite carregar a versão salva explicitamente.
Falhas de rede não mostram confirmação de salvamento. Tentativas de cadastro que
falham restauram o estado em memória para não duplicar o registro no retry.

Rascunhos têm salvamento após 1,2 s de pausa e cópia de recuperação local,
separada pelo UUID da conta. Nenhum rascunho é enviado a outra conta. O logout
limpa o estado em memória, a foto da simulação e a chamada.

## Primeiro acesso e importação

Crie uma conta com e-mail e senha (mínimo 12 caracteres), confirme o e-mail se o
Supabase solicitar e entre. As contas começam vazias. Em Configurações, o botão
**Importar dados deste navegador** permite confirmar a migração da base antiga
`sorriso-demo-v3` para a conta autenticada, somente se ela estiver sem pacientes.
A base antiga não é apagada nem enviada automaticamente.

A entrega de e-mails e as URLs permitidas dependem de Auth no Supabase. A URL de
produção deve estar em Authentication > URL Configuration (Site URL e Redirect
URLs): `https://sorriso-com-ia-clinica.ricardo-performancet.chatgpt.site/`.
Não alteramos configurações de SMTP ou de confirmação de e-mail nesta integração.

## Validação

- SQL real com rollback: inserção/salvamento do proprietário, incremento de revisão,
  rejeição de revisão antiga, leitura/escrita/inserção entre contas bloqueadas e
  ausência de permissão de `anon`. Nenhum usuário de teste foi mantido.
- Advisors de segurança e desempenho do projeto: nenhum alerta.
- `npm run test:cloud`: conflitos, retry de rede e separação por usuário.
- Navegador com respostas HTTP simuladas: cadastro com confirmação, login, nove
  rotas vazias, paciente, configurações, agenda, anotação, logout, quatro larguras,
  conflito entre abas, falha de rede sem mensagem de sucesso e retry de cadastro sem duplicação.
- Conexão direta aos endpoints HTTP do Supabase não pôde ser validada deste
  ambiente (proxy do ambiente respondeu 403 para o domínio do projeto); cadastro/login com e-mail real não foi executado.

Histórico remoto: `20261031083447_evoluna_private_workspaces` e
`20261031084119_evoluna_cache_auth_policy_claims`.
A definição SQL está em `supabase/workspace-schema.sql`.

## Correções de acesso e salvamento

A seleção de paciente é preservada por editor ao restaurar o estado depois de uma
falha de salvamento. Uma nova tentativa não muda o destinatário do documento ou
da simulação. O caso com dois pacientes foi reproduzido em navegador com dados
fictícios antes da correção e validado novamente após ela.

O login oferece recuperação de senha por e-mail. O retorno PASSWORD_RECOVERY abre
um formulário com confirmação da nova senha, mínimo de 12 caracteres, e retorna
ao login depois da alteração. Links expirados recebem mensagem específica. O fluxo
HTTP foi validado com respostas simuladas, sem enviar e-mails reais nem alterar
a senha de usuários existentes.

A proteção nativa contra senhas vazadas continua pendente: a organização está no
plano gratuito e o recurso exige Pro ou superior. Nenhuma assinatura foi contratada.
O TURN de produção continua pendente de um serviço/servidor apropriado; o Jitsi
segue disponível como alternativa.

O compartilhamento entre profissionais ainda não está habilitado: a migração foi
rejeitada pela revisão automática por ampliar o acesso a dados clínicos. A proposta
está em `docs/PROPOSTA-ACESSO-EQUIPE.md`, aguardando autorização explícita.
