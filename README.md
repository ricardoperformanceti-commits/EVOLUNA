# Sorriso com IA — demonstração de apresentação

Aplicação completa de demonstração em HTML, CSS e JavaScript. Sem login do aplicativo, sem chamadas ao Supabase e sem dados reais. Os dados ficam em localStorage no navegador. O acesso da hospedagem Sites permanece privado.

## Módulos
- Painel com indicadores calculados a partir dos dados locais e gráfico histórico explicitamente ilustrativo.
- Pacientes: cadastro, edição, busca, filtros e visualização em cartões ou lista.
- Agenda: navegação por dia, cadastro, detecção de conflito de horário por profissional, confirmação, cancelamento e conclusão.
- Prontuários: perfil, evolução, odontograma de 32 dentes interativo e plano de tratamento com valores.
- Sorriso IA: ilustração comparativa, ajustes visuais, upload de referência local, geração simulada e galeria. Sem processamento de IA e sem previsão clínica.
- Teleconsultas: integração real com Jitsi Meet, sala aleatória por agendamento, link compartilhável, teste local de câmera/microfone e anotações locais. Requer permissão do navegador e login do organizador no provedor externo.
- Documentos: quatro modelos, edição, salvamento, impressão/PDF via navegador e download em texto. Sem validade clínica ou jurídica.
- Financeiro: lançamentos de receitas e despesas, recebimento simulado, filtros e exportação CSV. Sem cobrança real.
- Relatórios: indicadores locais, status dos agendamentos e exportações CSV.
- Configurações: dados fictícios da clínica, preferências locais, tour em seis etapas, tela cheia e restauração dos exemplos.

## Executar
`npm run build` copia a aplicação para dist. `npm run dev` abre servidor local na porta 3001.

Todos os exemplos usam nomes e contatos fictícios. Não use dados reais de pacientes. Os gráficos históricos são ilustrativos e rotulados. Os demais indicadores derivam da base local.

A identidade do Sites permanece em .openai/hosting.json. A pasta worker contém a implementação anterior com autenticação, que não é incluída na publicação estática atual. O projeto Next.js anterior continua separado em /workspace/sorriso-com-ia.

## Dr. Help

O botão superior e o atalho Ctrl/⌘ K abrem o Dr. Help. A pesquisa de pacientes permanece no módulo Pacientes.

Catálogo demonstrativo local com cinco princípios ativos: paracetamol, dipirona, ibuprofeno, amoxicilina e clindamicina. Pesquisa normalizada por marca, princípio ativo, nome técnico e sinônimos. Links externos reais para fontes de fabricantes e Bulário Anvisa. Não há busca remota, atualização automática de bula ou geração de prescrições.

Calculadora manual com distinção explícita entre mg/kg/dose e mg/kg/dia, administrações por dia, peso, limites por dose e por dia informados pelo profissional, e conversão opcional de concentração mg/volume para mL. Os campos de dose não são preenchidos pelo catálogo. Resultados excedentes são bloqueados, sem ajuste automático. Referência, apresentação e confirmação de conferência são obrigatórias. Nenhum resultado é salvo ou encaminhado ao paciente.

Validação: pesquisa pelos três tipos de nome; resultado vazio; cálculo por dose e por dia; conversão de volume; invalidação ao alterar entradas; bloqueio de limite; concentração incompleta; atalho e layout móvel.

## Videoconferência real

A sala usa a API oficial do Jitsi Meet (https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-iframe/). O script externo só é carregado após o clique em Conectar. Testar dispositivos usa getUserMedia local, sem transmissão; tracks são encerrados ao parar, trocar de tela ou conectar. As chamadas reais usam a infraestrutura meet.jit.si.

O organizador precisa autenticar-se no Jitsi (https://jitsi.org/blog/authentication-on-meet-jit-si/). A sala também pode ser aberta em outra aba para autenticação ou quando iframe/câmera forem bloqueados. O link do paciente aponta diretamente ao provedor, sem tornar o restante do Site público. Nenhum nome de paciente é usado no identificador da sala; ele é gerado com UUID criptográfico e salvo por agendamento no navegador. Compartilhe somente com os participantes previstos e use os controles de acesso do provedor.

A duração mostrada nesta página só começa no evento real videoConferenceJoined. Não é inferida para chamadas externas. Microfone/câmera/tela usam executeCommand. Sair libera iframe e recursos, sem afirmar expulsar outros participantes. Finalização do registro e conclusão na agenda são ações manuais. Anotações continuam em localStorage e não constituem infraestrutura clínica em servidor.

Limite do serviço público consultado: 95 minutos, anunciado em https://jitsi.org/blog/changes-coming/. Não há gravação de áudio/vídeo implementada pelo app.

Verificação: captura local e liberação de tracks com câmera/microfone sintéticos no navegador; links aleatórios; teste da integração da API com comandos/eventos simulados; preservação da sala ao salvar notas e persistência do link por agendamento. Uma chamada real entre duas pessoas, com autenticação no Jitsi e redes externas, não foi validada neste ambiente.

## Prontuário odontológico dedicado

A rota #prontuarios agora abre um espaço clínico, separado de #paciente (cadastro administrativo). Inclui seleção de paciente, resumo de alergias, anamnese e exame extra/intraoral, histórico de saúde e medicamentos, evoluções estruturadas por atendimento (queixa, achados, avaliação, procedimentos e conduta), profissional/data/hora, odontograma com condição/face/observação por elemento, plano de etapas sem valores financeiros e documentos vinculados. Exportação em texto sem assinatura digital.

Todos os registros continuam locais em localStorage. O usuário informa o conteúdo clínico; não há diagnóstico automático. Não foi implementado prontuário clínico com auditoria em servidor, assinatura digital ou armazenamento multiusuário.

Validação: preenchimento e persistência da anamnese, evolução estruturada, odontograma e plano; retorno entre cadastro e prontuário; exportação; layout em 390px sem overflow da página.

## Foto do paciente

No perfil, clicar no avatar ou em Adicionar/Trocar foto abre o editor. Aceita JPG, PNG e WebP até 5 MB, com recorte central e redução para JPEG de 320px. A foto pode ser trocada ou removida; aparece nas listas e demais avatares do paciente. Salvamento apenas em localStorage, com tratamento de falta de espaço e sem upload externo. Arquivo inválido não substitui a foto existente; Cancelar não altera o cadastro.

Verificado: upload e processamento de imagem de teste, persistência ao recarregar, exibição nos cartões, rejeição de arquivo inválido e remoção com retorno às iniciais.
