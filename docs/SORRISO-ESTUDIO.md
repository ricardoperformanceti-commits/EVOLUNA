# Estúdio do sorriso

A rota Sorriso com IA segue o espaço de atendimento: menu lateral oculto, cabeçalho com retorno e três painéis. Paciente, busca paginada e abas Prévias/Documentos/Histórico ficam à esquerda; o comparador e a seleção assistida ficam no centro; tratamento, tonalidade, intensidade e envio ficam à direita. As listas mostram somente o paciente selecionado. Prévias antigas podem ser abertas e salvas em PNG para envio.

## Resolução e zoom
A grade usa largura, altura e deslocamentos reais da visualViewport, com fallback para a janela. Consultas ao contêiner dimensionam os controles pela área em que estão, inclusive no zoom por gesto. O layout mantém três colunas quando há mais de 1100 px de largura e pelo menos 520 px úteis de altura; tamanhos de fonte maiores elevam esses limites. Em áreas menores, os painéis ficam em abas.

Se faltar espaço para os controles, o painel direito apresenta Ajustes, IA (somente quando autorizada) e Enviar como seções acessíveis. O aviso de recuperação usa uma faixa inferior reservada na área visível. Abrir e fechar avisos, mudar o zoom, usar o teclado móvel ou redimensionar não gera imagens nem troca o paciente. A paginação só é reconstruída quando sua capacidade muda. A seleção assistida conserva a proporção e o alinhamento do contorno.

## Dados e permissões
Aplicar ajustes locais usa o processamento existente no navegador. Magic Hour continua condicionada à permissão da conta e à confirmação de uso de créditos. As fotos de apresentação de cada hospedagem foram preservadas. Nenhuma foto de paciente foi adicionada ao código ou publicada. Prévias da galeria são clonadas ao abrir, preservando o registro original.

Salvar prévia mantém o PNG, documento privado e planejamento vinculado. Chat e WhatsApp abrem a revisão do envio, criando o PNG antes se necessário. O chat exige paciente conectado no atendimento; WhatsApp exige anexar o arquivo e confirmar o envio. Não há envio automático de mensagens.

## Verificação
Os testes funcionais cobrem isolamento por paciente, paginação e busca, ajustes sem API, documento correto, troca de paciente durante salvamento, preservação da galeria e largura/deslocamento do viewport.

A reprodução em Chromium encontrou botões de envio cortados numa área de 683×325 CSS px e largura de 1351 px mantida enquanto o viewport visual tinha 910,67 px no gesto de zoom de 150%. A correção foi verificada em Chromium headless local com dados fictícios e serviços externos bloqueados: 1920×838, 1366×650, 1093×520, 911×433, 683×325, 390×640 e 320×420 CSS px. Todas as abas principais e as seções de ajuste foram verificadas contra a caixa real do painel, sem botões cortados nesses cenários. Também foram verificados o aviso sem sobreposição e o gesto de zoom de 150%, com o contêiner passando a 910,66 px.

As áreas CSS menores equivalem ao espaço que o zoom normal de página deixa disponível; o gesto foi exercitado por CDP. A sessão de teste não usou login real nem gravou dados em serviços externos.
