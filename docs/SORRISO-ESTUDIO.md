# Estúdio do sorriso

A rota Sorriso com IA segue o espaço de atendimento: menu lateral oculto, cabeçalho com retorno e três painéis. Paciente, busca paginada e abas Prévias/Documentos/Histórico ficam à esquerda; o comparador e a seleção assistida ficam no centro; tratamento, tonalidade, intensidade e envio ficam à direita. As listas mostram somente o paciente selecionado. Prévias antigas podem ser abertas e salvas em PNG para envio.

O layout ocupa a altura disponível. Abaixo de 1100 px de largura ou 650 px de altura, os painéis viram abas, sem reconstruir a imagem ao trocar de painel. Listas usam paginação. A seleção assistida mantém a proporção da foto e do contorno ao redimensionar. Depois de gerar com IA ou aplicar manualmente, a aba do comparador aparece.

O botão Aplicar ajustes locais usa o processamento existente no navegador. O botão Magic Hour continua condicionado à permissão da conta e à confirmação de uso de créditos. As fotos de apresentação de cada hospedagem foram preservadas. Nenhuma foto de paciente foi adicionada ao código ou publicada.

Salvar prévia mantém o PNG, documento privado e planejamento vinculado. Chat e WhatsApp abrem a revisão do envio, criando o PNG antes se necessário. O chat exige que o paciente esteja conectado no atendimento; WhatsApp exige anexar o arquivo e confirmar o envio. Não há envio automático de mensagens.

Os testes cobrem isolamento por paciente, paginação e busca, troca de painel, ajuste sem API, envio do documento correto, mudança de paciente durante salvamento e preservação da prévia original da galeria. A verificação visual em navegador autenticado deve ser feita no dispositivo de uso.
