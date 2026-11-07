# Integração Magic Hour

A integração usa POST /v1/files/upload-urls, PUT no endereço assinado, POST /v1/ai-image-editor e GET /v1/image-projects/{id}. Modelo fixo flux-2-klein, resolução 640px, uma imagem por pedido. O texto de edição é definido no servidor com base em clareamento, lentes ou facetas e tonalidades BL1, BL2 e A1. Não aceita prompts arbitrários nem modelos mais caros enviados pelo navegador.

## Ativação

Worker publicado: evoluna-smile-api, na conta Cloudflare existente. Endpoint público de configuração do aplicativo: https://evoluna-smile-api.appevoluna.workers.dev. Em Configurações → Variáveis e segredos, adicione MAGIC_HOUR_API_KEY como Segredo e implante. Nunca use essa chave em public/, GitHub ou variáveis de build públicas. JOB_SIGNING_KEY já foi criado como segredo independente e deve ser preservado em atualizações. ALLOW_ALL_AUTHENTICATED=true libera todas as contas Evoluna autenticadas, não anônimas e com e-mail confirmado, atuais e futuras. ALLOWED_EMAILS é a lista privada usada somente quando a liberação geral está desativada.

O código do Worker está em magic-hour/worker.mjs. É um módulo JavaScript independente; alterações no frontend não reimplantam automaticamente esse Worker. Preserve os segredos, as variáveis SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, ALLOWED_ORIGINS, ALLOW_ALL_AUTHENTICATED e ALLOWED_EMAILS e o binding GENERATE_LIMITER ao atualizar o código. A chave Supabase é somente publicável; nenhuma service_role é usada. Limite configurado: três novas gerações por minuto e usuário, aproximadamente por localidade Cloudflare, não uma cota financeira global.

## Funcionamento

Adicionar uma foto não gera cobrança: ela fica pronta para o botão Gerar com IA. O profissional confirma o envio externo da imagem e o consumo de créditos antes de cada nova geração. O navegador envia sua sessão Evoluna ao Worker; o Worker valida a conta no Supabase e valida se a conta atende ao modo de autorização configurado no servidor. Na liberação geral, não é necessário cadastrar cada e-mail; os créditos da mesma chave Magic Hour são compartilhados entre essas contas. Somente os bytes da foto, tratamento e tonalidade seguem à Magic Hour; nomes, CPF e prontuário não são enviados nos campos do pedido. A foto pode, por si só, identificar a pessoa.

A consulta de status e o download exigem sessão válida e comprovante assinado vinculado ao dono da geração. A chave Magic Hour nunca chega ao navegador. Endereços de arquivos do provedor são restritos a videos.magichour.ai, com HTTPS e sem redirecionamentos. Fotos de entrada: JPEG/PNG até 4 MB; resultados: JPEG/PNG/WebP até 8 MB. Respostas privadas usam no-store. Imagens não são publicadas no GitHub nem em arquivos do site.

O retorno vai ao comparador antes/depois e pode ser salvo no planejamento privado existente. O ajuste local e a seleção assistida continuam disponíveis. Após a primeira geração, a imagem da IA fica guardada como base. Tonalidade, intensidade e seleção assistida são aplicadas localmente sobre essa base, mantendo o original no Antes. A estrutura criada pela IA é mantida; mudar o tratamento não cria outra geometria localmente. Cada ajuste recomeça da base, sem acumular clareamento. Somente Gerar outra imagem com IA abre uma nova solicitação paga, com confirmação. Ao salvar, a base também é preservada no planejamento privado. Falhas de consulta com um pedido já identificado permitem Consultar geração em andamento sem reenviar a criação. Não há repetição automática de POST de geração. Em caso de perda de conexão durante a criação, confira também o histórico Magic Hour antes de repetir.

Trocar foto, conta ou sair da tela interrompe a incorporação de resultados antigos. Isso não cancela uma geração já aceita pelo provedor nem garante reembolso de créditos. A simulação de lentes/facetas é ilustrativa: o modelo pode modificar outros detalhes da foto; o profissional precisa revisar o resultado.

## Verificação

Execute npm run test:magic-hour. Os testes simulam o provedor, autenticam os pedidos, validam o titular da geração, rejeitam consentimento ausente/formatos indevidos/origens não permitidas e verificam o comparador, a confirmação e a troca de foto. Não usam créditos reais nem fotos de pacientes. A geração real e a aparência do resultado dependem da chave ativa e de uma conferência no navegador.

Documentação oficial: https://docs.magichour.ai/api-reference/files/generate-asset-upload-urls e https://docs.magichour.ai/api-reference/image-projects/ai-image-editor e https://docs.magichour.ai/api-reference/image-projects/get-image-details.

## Compatibilidade de rede no Workers

As requisições ao Supabase, à Magic Hour e ao armazenamento usam redirect: manual. Cloudflare Workers não implementa redirect: error; esse valor interrompe a chamada com TypeError antes do envio. Respostas 3xx são recusadas por status, sem seguir Location nem encaminhar Authorization a outro destino. Os testes simulam essa restrição do runtime e verificam a rejeição de redirecionamentos no upload.


## Consulta de acesso e alternativa local
A foto consulta primeiro `GET /v1/smile/access`, autenticado. O Worker valida a sessão e responde apenas `enabled`; não envia imagens à Magic Hour, não cria projetos e não consome o limitador de gerações nessa consulta. A autorização é definida no servidor: `ALLOW_ALL_AUTHENTICATED=true` habilita qualquer conta autenticada com e-mail confirmado; quando esse modo está desativado, vale a lista privada `ALLOWED_EMAILS`. Usuários anônimos e pedidos sem sessão continuam bloqueados. O dono da geração continua sendo validado, mesmo quando outras contas podem criar suas próprias imagens.

Sem permissão (ou se a consulta não estiver disponível), a foto segue automaticamente para a prévia local, usando a máscara de esmalte e preservando a anatomia original. O botão Gerar com IA permanece identificável; a geração só avança se o servidor autorizar. Falhas de consulta mostram uma mensagem e permitem nova tentativa, sem trocar um pedido explícito de IA por uma edição local. A seleção assistida do sorriso continua disponível. Salvar em PNG nos documentos do paciente e enviar continuam usando o mesmo fluxo. O tratamento local uniformiza a tonalidade; não reconstrói dentes.

A permissão também é conferida antes da confirmação e antes de enviar uma geração. Mudanças de conta invalidam a permissão visual e resultados antigos. A autorização definitiva de qualquer geração continua no Worker.

## Prompts aprovados em 07/11/2026

Os textos em magic-hour/prompts.mjs são enviados literalmente, sem prefixos ou complementos. Lentes: Apply the best veneers to the upper and lower teeth in shade white. Clareamento: referência #FFF8F0 e preservação da anatomia, conforme o texto aprovado. A geração continua explícita, uma imagem por solicitação; consultar ou ajustar tonalidade não gera outro pedido pago. Aplicar ajustes sem alterações não reenvia o PNG. Sincronizar novamente o mesmo documento e caminho não repete o salvamento do prontuário. O salvamento compacto do workspace permanece ativo.
