# Sorriso IA — comandos livres

1. Ao abrir, digitar nome e telefone; o cadastro é salvo ou reutilizado por nome e telefone.
2. Carregar uma foto JPG/PNG de até 4 MB.
3. Escolher serviço (Lentes ou Clareamento) e tonalidade (BL1, BL2 ou A1).
4. Digitar um comando livre. Não existem mais os seis prompts fixos ou geração automática em lote.
5. Executar comando abre a confirmação de envio e uso de créditos para uma edição pelo MCP.
6. O comando é enviado literalmente em style.prompt. Serviço e tonalidade são obrigatórios e acompanham o pedido como metadados assinados; não acrescentamos um texto de edição predefinido ao comando.
7. A edição usa qwen-image-2.1, 640px, uma imagem. O resultado é salvo em Documentos.
8. Consultas e recuperação usam o ticket do mesmo projeto; falhas de criação ambíguas não provocam reenvio automático.

As imagens antigas continuam no histórico. Ajustes locais das imagens já salvas continuam disponíveis.

Verificação: npm test, npm run test:magic-hour, npm run test:smile-command, npm run test:cloud e npm run test:workflow. Os antigos roteiros de navegador dependiam da geração por prompts fixos e foram substituídos pelos testes do fluxo de comando/MCP. A validação visual em navegador continua pendente.

Ao concluir um comando, o estúdio recebe a foto original e o PNG salvo, fecha o modal e abre o painel de comparação com a régua ao centro. Edições concluídas também aparecem no histórico; abrir, ajustar tonalidade, salvar e compartilhar continuam usando o mesmo documento privado e preservam a base original da IA, sem nova geração. Falhas de salvamento mantêm o modal disponível para tentar salvar o mesmo resultado.

As tonalidades após a geração são prévias locais, inclusive ao clicar na opção inicialmente escolhida. Cada BL1/BL2/A1 é calculada sobre a base imutável da IA, com máscara dos dentes. As variantes ficam em memória por imagem para alternar sem recalcular nem chamar a API. Só Aplicar ajustes ou Salvar PNG persiste a prévia selecionada.
