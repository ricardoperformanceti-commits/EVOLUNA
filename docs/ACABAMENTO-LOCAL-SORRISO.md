# Acabamento local do sorriso

Processamento da foto no navegador, sem API paga e sem upload da imagem a terceiros. MediaPipe localiza a abertura do sorriso; o algoritmo de cor seleciona superfícies compatíveis com esmalte, preservando as regiões vermelhas e escuras.

A seleção mantém componentes separados das duas arcadas e das laterais. Sementes claras e superfícies mais sombreadas são selecionadas com critérios diferentes; a intensidade final não depende da confiança de cada pixel. Isso reduz manchas de aplicação. Pequenos vazios cercados por esmalte são fechados com barreira de cor, e as bordas são suavizadas para dentro da seleção.

O brilho usa uma referência estatística dos pixels selecionados e uma curva contínua que conserva diferenças de luminosidade. BL1, BL2 e A1 produzem acabamentos distintos. O modo de lentes de contato tem acabamento mais branco e suavização discreta das variações internas do esmalte; o clareamento mantém maior contraste.

Esta implementação **não gera anatomia nem reposiciona dentes**. Não equivale à edição generativa produzida no chat. A cor/iluminação e a nitidez da imagem influenciam a seleção; sem dentes identificáveis, a interface retorna erro em vez de exibir um depois falso. Nenhum resultado clínico é previsto.

Verificações: testes sintéticos com duas arcadas, esmalte quente, sombras, frestas e tecido vermelho; contraste e ordem das tonalidades; preservação dos pixels fora da seleção; fluxo real de upload, comparação, três cores, salvamento, reabertura e cancelamento; atualização de prévias antigas para maskVersion 10. Uma referência de duas arcadas gerada anteriormente no chat foi usada apenas em QA local, sem ser publicada como imagem do site. Não foi possível executar o arquivo original enviado pelo usuário, que está anexado à conversa sem caminho de arquivo local.

Backup anterior: `/workspace/backups/antes-acabamento-local-67ec2b9/source.tar`, commit `67ec2b9e2419cfb65f1156a2937aaea6d6ab879a` (versão 66).
