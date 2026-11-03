# Integração Magic Hour

A integração usa POST /v1/files/upload-urls, PUT no endereço assinado, POST /v1/ai-image-editor e GET /v1/image-projects/{id}. Modelo fixo flux-2-klein, resolução 640px, uma imagem por pedido. O texto de edição é definido no servidor com base em clareamento, lentes ou facetas e tonalidades BL1, BL2 e A1. Não aceita prompts arbitrários nem modelos mais caros enviados pelo navegador.

## Ativação

Worker publicado: evoluna-smile-api, na conta Cloudflare existente. Endpoint público de configuração do aplicativo: https://evoluna-smile-api.appevoluna.workers.dev. Em Configurações → Variáveis e segredos, adicione MAGIC_HOUR_API_KEY como Segredo e implante. Nunca use essa chave em public/, GitHub ou variáveis de build públicas. JOB_SIGNING_KEY já foi criado como segredo independente e deve ser preservado em atualizações. ALLOWED_EMAILS é a lista privada de contas da clínica habilitadas para usar créditos.

O código do Worker está em magic-hour/worker.mjs. É um módulo JavaScript independente; alterações no frontend não reimplantam automaticamente esse Worker. Preserve os segredos, as variáveis SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, ALLOWED_ORIGINS e ALLOWED_EMAILS e o binding GENERATE_LIMITER ao atualizar o código. A chave Supabase é somente publicável; nenhuma service_role é usada. Limite configurado: três novas gerações por minuto e usuário, aproximadamente por localidade Cloudflare, não uma cota financeira global.

## Funcionamento

Adicionar uma foto não gera cobrança: ela fica pronta para o botão Gerar com IA. O profissional confirma o envio externo da imagem e o consumo de créditos antes de cada nova geração. O navegador envia sua sessão Evoluna ao Worker; o Worker valida a conta no Supabase e confere a lista de e-mails permitidos. Somente os bytes da foto, tratamento e tonalidade seguem à Magic Hour; nomes, CPF e prontuário não são enviados nos campos do pedido. A foto pode, por si só, identificar a pessoa.

A consulta de status e o download exigem sessão válida e comprovante assinado vinculado ao dono da geração. A chave Magic Hour nunca chega ao navegador. Endereços de arquivos do provedor são restritos a videos.magichour.ai, com HTTPS e sem redirecionamentos. Fotos de entrada: JPEG/PNG até 4 MB; resultados: JPEG/PNG/WebP até 8 MB. Respostas privadas usam no-store. Imagens não são publicadas no GitHub nem em arquivos do site.

O retorno vai ao comparador antes/depois e pode ser salvo no planejamento privado existente. O ajuste local e a seleção assistida continuam disponíveis. Alterar tratamento ou tonalidade em um resultado de IA não cria uma nova cobrança automaticamente. Falhas de consulta com um pedido já identificado permitem Consultar geração em andamento sem reenviar a criação. Não há repetição automática de POST de geração. Em caso de perda de conexão durante a criação, confira também o histórico Magic Hour antes de repetir.

Trocar foto, conta ou sair da tela interrompe a incorporação de resultados antigos. Isso não cancela uma geração já aceita pelo provedor nem garante reembolso de créditos. A simulação de lentes/facetas é ilustrativa: o modelo pode modificar outros detalhes da foto; o profissional precisa revisar o resultado.

## Verificação

Execute npm run test:magic-hour. Os testes simulam o provedor, autenticam os pedidos, validam o titular da geração, rejeitam consentimento ausente/formatos indevidos/origens não permitidas e verificam o comparador, a confirmação e a troca de foto. Não usam créditos reais nem fotos de pacientes. A geração real e a aparência do resultado dependem da chave ativa e de uma conferência no navegador.

Documentação oficial: https://docs.magichour.ai/api-reference/files/generate-asset-upload-urls e https://docs.magichour.ai/api-reference/image-projects/ai-image-editor e https://docs.magichour.ai/api-reference/image-projects/get-image-details.
