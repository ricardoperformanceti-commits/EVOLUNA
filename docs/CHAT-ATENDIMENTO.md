# Chat e envio de documentos no atendimento

Na tela de atendimento/teleconsulta, o menu lateral e a barra geral ficam ocultos. O layout aprovado tem três colunas: paciente, anotações e documentos à esquerda; vídeo sempre visível no centro; conversa com o paciente à direita. O cabeçalho apresenta Evoluna Odonto, Atendimento e Voltar à agenda.

A área ocupa a altura da janela, sem barra de rolagem da página. Históricos e documentos têm paginação; mensagens longas oferecem leitura completa em uma janela. Os campos de texto mantêm a edição de conteúdo longo com as barras visuais ocultas. Em janelas pequenas, abas alternam entre Anotações, Teleconsulta e Mensagens, preservando os elementos da chamada e o texto em edição. Em alturas muito reduzidas, os documentos continuam acessíveis na aba Documentos em vez de ocupar a área de edição.

Os botões da chamada continuam sendo o meio de ativar e encerrar câmera e microfone. A indicação de conexão e o vídeo mostram o estado real do atendimento; a imagem de referência não é usada como um vídeo ou uma conversa simulados.

## Conversa pelo link

O dentista abre o atendimento e copia o convite pelo painel de mensagens. O paciente abre o link e escolhe **Entrar no chat sem câmera**. A câmera é opcional e só é solicitada ao entrar no vídeo. O chat usa uma conexão de dados WebRTC independente da chamada; na alternativa Jitsi, o vídeo abre em outra aba e o chat permanece no aplicativo.

O convite é exclusivo, expira em até quatro horas e não dá acesso ao cadastro, ao prontuário ou às tabelas do banco. Somente um participante é aceito por vez. O canal de mensagens verifica os dois lados com assinaturas HMAC derivadas do segredo do convite; o segredo não é transmitido nos metadados desse canal. A transmissão usa os servidores de sinalização/ICE já configurados na aplicação. Redes que bloqueiam conexões WebRTC podem impedir a conversa; nesse caso, use o WhatsApp ou ajuste a infraestrutura de conexão.

Cada lado pode enviar texto de até 4.000 caracteres. O dentista pode enviar PDFs de até 5 MB, com transferência em partes e conferência de integridade. A indicação **Recebido no chat** só aparece depois da confirmação do outro navegador; não é uma confirmação de leitura pela pessoa. Interrupções e ausência de confirmação deixam o envio marcado como não confirmado, sem simular entrega.

Nada do prontuário é transmitido automaticamente. É necessário escolher e enviar cada documento ou um conjunto de documentos do mesmo paciente. Trocar o paciente ou sair do atendimento encerra o canal anterior; um envio em andamento não é redirecionado à próxima pessoa.

## Documentos e WhatsApp

Os documentos gerados na sessão, inclusive receitas, atestados, declarações, planos e orientações, têm opção **Enviar ao paciente**. O modal confirma paciente e telefone e oferece:

- Enviar pelo chat, quando o paciente daquele documento estiver conectado no atendimento correspondente.
- Abrir o WhatsApp e baixar o PDF para anexar manualmente. O dentista confere o contato e confirma o envio no WhatsApp.
- Compartilhar o PDF pelo sistema do dispositivo, quando o navegador suporta arquivos. O usuário pode escolher o WhatsApp e o contato nessa etapa.
- Baixar o PDF.

O seletor de canal do painel esquerdo também abre uma conversa no WhatsApp com a mensagem preparada. Essa ação não usa a API do WhatsApp Business, não dispara mensagens automaticamente e não fornece confirmação de entrega do WhatsApp. O aplicativo registra apenas que a conversa foi preparada.

O documento deve ser revisado e validado pelo profissional. O fluxo de envio não adiciona assinatura digital a documentos sem assinatura.

## Histórico e privacidade

As mensagens e as referências dos documentos ficam no registro privado do atendimento, em `evoluna_consultation_sessions.data.messages`, vinculadas à conta. A migração para uma tabela individual `evoluna_session_messages` está preparada e ainda não foi aplicada. A compatibilidade do chat com o esquema atual foi verificada em testes; a migração futura preserva os registros e não exige mudança no cliente. O salvamento usa a transação e o controle de revisão existentes. O convidado não consulta essa tabela e não recebe o histórico completo da clínica.

Os bytes dos PDFs não são gravados em links públicos nem adicionados à conversa no banco. Os documentos originais permanecem nos módulos clínicos existentes. O paciente deve baixar o PDF durante o atendimento: os arquivos recebidos ficam na memória da página e não são recuperados pelo link depois de fechá-la. São mantidos até 10 arquivos recebidos e 20 MB em memória; arquivos mais antigos podem exigir novo envio. O limite anterior de 16 MiB para o estado da conta permanece.

## Verificação

`npm run test:chat` verifica autenticação do convite, recusa de outro participante, expiração, texto, confirmação, deduplicação, integridade e limites dos PDFs, interrupção, telefone do WhatsApp e a troca de paciente durante um envio. Os testes usam conexões simuladas e registros fictícios. `npm run test:database` verifica a migração do histórico de mensagens e o isolamento por RLS junto aos demais módulos.

Os testes automatizados não substituem uma conferência real em dois aparelhos/navegadores, incluindo as condições de rede e o aplicativo WhatsApp. Não houve envio de mensagens ou documentos a pacientes reais durante a implementação.

## Documentos e retorno na consulta

A aba Documentos mostra somente os arquivos vinculados à sessão atual; o arquivo permanente continua em Documentos no prontuário do paciente. A aba Histórico reúne os agendamentos presenciais e de teleconsulta e as sessões antigas sem agendamento vinculado. Agendar retorno abre data, horário, modalidade, duração, motivo e profissional, valida sobreposição, salva o agendamento e um comprovante no mesmo salvamento. Falhas desfazem ambos. O comprovante fica na sessão e nos documentos do paciente, com envio pelos canais existentes mediante ação do profissional. A chamada e a anotação em edição continuam abertas.
