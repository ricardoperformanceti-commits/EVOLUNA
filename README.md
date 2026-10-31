# Evoluna IA — Sorriso com IA Odonto

Aplicação em HTML, CSS e JavaScript com Supabase Auth e persistência privada por conta.
A hospedagem continua pública; dados da clínica exigem autenticação e são protegidos por RLS.

Consulte [a documentação da integração Supabase](docs/SUPABASE.md) para configuração,
primeiro acesso, importação da base antiga, estrutura do banco e limites da validação.
A chave em `public/cloud-config.js` é publicável. Nunca adicione uma chave de serviço.

## Módulos

- Pacientes, agenda, prontuários, documentos, financeiro, configurações e prévias salvos na conta.
- Salvamento com revisão: alterações de outra aba ou dispositivo não são sobrescritas silenciosamente.
- Teleconsulta por WebRTC/PeerJS, com Jitsi como alternativa. TURN de produção ainda não configurado.
- Sorriso IA: processamento fotográfico local de tonalidade, sem reconstrução generativa de facetas.
- PDFs para revisão e assinatura pelo profissional. Nenhuma cobrança financeira é processada.
- Importação explícita dos dados antigos do navegador, sem apagar a cópia original.

## Executar e verificar

`npm run build` prepara os arquivos em `dist/`; `npm run dev` inicia na porta 3001.
`npm test`, `npm run test:cloud`, `npm run test:enamel` e `npm run test:rtc` executam as verificações.
A pasta `worker/` contém uma implementação anterior que não é incluída na publicação estática.

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

## Responsividade e modelos de apresentação

Rolagem vertical da página e do menu lateral, barras estilizadas em áreas roláveis, formulários longos com corpo rolável e ações acessíveis, tabelas com rolagem horizontal própria e layout revisado em telas pequenas. Verificação dos dez módulos em 320, 390, 768, 834 e 1366px sem overflow horizontal da página.

A página /modelos.html permite alternar entre celular (390×844), tablet (834×1112) e computador (1440×1000). O sistema real é exibido em iframe navegável com tamanho interno fixo para cada formato, reduzido visualmente quando necessário. Prévia sem dados separados: usa a mesma origem e o mesmo armazenamento local do sistema.

## Ajustes de apresentação

Busca superior digitável com resultados abaixo, navegação por setas/Enter/Escape, filtro por nome/telefone/e-mail e abertura do perfil. O Dr. Help permanece separado.

Banner de teleconsulta com fotografia ilustrativa gerada para o projeto, ao lado da agenda em telas largas e abaixo dela em telas pequenas. Indicadores da teleconsulta: quantidade agendada, confirmadas, pacientes acompanhados e atendimentos concluídos; sem dados financeiros. A informação do provedor e dos requisitos de conexão aparece ao preparar a chamada.

Sorriso IA: selo do cabeçalho removido e mensagem comercial acolhedora; nota contextual de prévia ilustrativa permanece junto ao resultado para não apresentar filtros como IA ou previsão clínica. A foto de sorriso enviada no chat ainda não pôde ser incorporada por indisponibilidade do arquivo; o banner principal mantém a ilustração anterior até o reenvio.

Documentos: modelo de atestado odontológico, com data de início, duração informada pelo profissional e CRO/UF. Sem prazo clínico ou diagnóstico automático. Exige preenchimento para salvar e permanece identificado como modelo sujeito à revisão e assinatura.

## PDF, pesquisa clínica e apresentação estética

O botão Exportar PDF gera download A4 diretamente no navegador com jsPDF 4.2.1, sem envio dos registros a servidores. Inclui identificação/CPF, anamnese, evoluções estruturadas, odontograma vetorial e registros por elemento, plano clínico sem valores financeiros e referências de documentos. Cabeçalho, rodapé e paginação em todas as folhas. Mantém a indicação de registro local sem assinatura digital. Verificado em arquivos de 3 e 10 páginas, com extração de texto/acentuação e inspeção visual da primeira página.

O acesso Sorriso IA ocupa agora o cartão superior do menu; não fica duplicado entre os itens. O cadastro do paciente possui CPF opcional; a seleção de prontuário usa uma pesquisa por CPF, nome ou telefone, aceitando números sem pontuação.

Apresentação antes/depois: caso fotográfico sintético gerado para o projeto, com painel superior original e inferior planejamento ilustrativo, usado em um comparador com slider. Exemplo de estética natural, sem inferir um diagnóstico ou resultado individual. Alternância para desenho interativo mantém os controles de tonalidade/alinhamento. Fotos enviadas pelo usuário são apenas referências e não recebem modificação de tratamento automática. O envio de imagem fica imediatamente abaixo do comparador. Botão Apresentar caso abre a comparação ampliada.

Os links Sua clínica / página atual do cabeçalho agora são navegáveis. Os controles de pesquisa, o PDF, a apresentação e o envio abaixo da imagem foram verificados no navegador, incluindo 390px.

## Facetas na foto enviada

A foto enviada agora permite montagem manual de 6, 8 ou 10 facetas superiores sobre o lado Depois, sem alterar o lado Antes. Ajustes de posição horizontal/vertical, largura, altura, inclinação e tonalidade. O usuário pode desenhar uma região com o ponteiro ou arrastar a moldura. Aplicar facetas ativa a sobreposição e esconde o ajuste para apresentação; o comparador e a apresentação ampliada usam a mesma montagem.

Esse recurso é um ensaio gráfico, sem segmentação dental automática, avaliação clínica ou processamento de IA. A forma das facetas é uma representação vetorial; o posicionamento depende de ajuste manual. Não prevê resultado, preparo, viabilidade ou conduta de tratamento.

Salvar a prévia preserva foto e ajustes no armazenamento local; insuficiência de espaço impede a confirmação de salvamento. Nenhuma imagem é enviada para servidores. Verificação: sobreposição somente no Depois, cor, reabertura da foto e ajustes, arraste e tela de 390px.

## Revisão da prévia fotográfica

A montagem vetorial opaca de dentes foi removida. A marcação da área fica visível somente quando solicitada e desaparece ao concluir o ajuste/aplicar. O texto flutuante sobre a foto foi removido.

A foto enviada recebe agora um ajuste gráfico localizado de tonalidade na área marcada, preservando textura. O filtro usa características simples de cor/luminosidade dentro da seleção e não constitui segmentação odontológica; deve ser revisado visualmente. Não reconstrói anatomia, fecha espaços ou produz previsão de facetas reais. A interface mantém essa limitação explícita. O nome do tratamento é usado apenas no caso sintético demonstrativo e no fluxo de apresentação, sem alegar transformação anatômica personalizada.

Aplicar exige área calibrada; alterações invalidam o resultado anterior. O modo de apresentação fica livre de caixas e blocos. O atalho Caso pronto de facetas abre a imagem sintética comparativa pronta, separada da foto enviada. Verificado: exigência de marcação, diferença entre imagens, ausência de blocos e caixas, apresentação ampliada e caso pronto.
