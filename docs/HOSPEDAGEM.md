# Hospedagem e domínio do Evoluna

## Integração existente

- Repositório: `ricardoperformanceti-commits/EVOLUNA`, branch `main`.
- Hospedagem: Cloudflare Pages, projeto `evoluna-odonto`.
- Endereço: https://evoluna-odonto.pages.dev/
- Node.js 22; comando `npm test && npm run test:cloud && npm run test:workflow && npm run build`; saída `dist`.
- Atualizações automáticas em main; previews e comentários automáticos em PR desabilitados.
- Supabase existente preservado. Não houve migração de contas nem registros.
- A instalação anterior no Sites continua disponível.

## Configuração pública

A URL e a chave publicável do Supabase existente estão em `public/cloud-config.js` e nas variáveis de build do Pages. O build permite substituir ambas por `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY`. Somente chave `sb_publishable_` é aceita por esse mecanismo. A chave publicável não é senha nem substitui autenticação/RLS.

Fonte: https://supabase.com/docs/guides/getting-started/api-keys

Para uma instalação com banco independente, substitua a configuração antes de publicar. Não executar novamente o SQL de criação na base existente.

## Domínio externo pendente

O domínio `app.smilesimulator.com.br` foi associado ao Pages. A Cloudflare informa `CNAME record not set`. A zona não é administrada nesta conta Cloudflare; não houve alteração de DNS.

No DNS autoritativo utilizado pelo Registro.br, adicionar somente:

| Tipo | Nome | Destino |
| --- | --- | --- |
| CNAME | app | evoluna-odonto.pages.dev |

Após propagação, conferir domínio ativo e certificado HTTPS no Pages. Preservar os demais registros do domínio, inclusive e-mail. Não trocar nameservers para concluir este subdomínio.

## Endereços do Supabase Auth pendentes de configuração/validação

Painel: https://supabase.com/dashboard/project/frviuoafenrqnueglwnq/auth/url-configuration

Enquanto o domínio próprio está pendente, usar como Site URL `https://evoluna-odonto.pages.dev`. Na lista de Redirect URLs, permitir explicitamente:

- `https://evoluna-odonto.pages.dev/`
- `https://app.smilesimulator.com.br/`
- `https://sorriso-com-ia-clinica.ricardo-performancet.chatgpt.site/`

Depois de ativar e testar o domínio próprio, ele pode se tornar o Site URL principal. Manter o endereço anterior durante a migração. Não utilizar curingas amplos para resolver o redirecionamento.

O conjunto de ferramentas conectado permite consultar banco/logs, mas não editar as configurações Auth do projeto. Esses valores não foram alterados por esta integração e precisam ser conferidos no painel. Não modificar tabelas internas do Auth para tentar configurar esses endereços.

Fonte: https://supabase.com/docs/guides/auth/redirect-urls

## Entrega de e-mails pendente de validação

Painel: https://supabase.com/dashboard/project/frviuoafenrqnueglwnq/auth/smtp

O serviço SMTP padrão do Supabase é destinado a testes e restringe os destinatários. Para atender usuários externos, verificar e configurar um provedor SMTP de produção ou Send Email Auth Hook, com domínio/remetente verificado e DNS correspondente. Nenhum provedor foi contratado ou credencial SMTP configurada por esta integração. Não desativar confirmação de e-mail como contorno.

Um evento `mail.send` ou HTTP 200 não comprova chegada à caixa de entrada. Testar confirmação e recuperação com o e-mail do responsável e depois um endereço externo, mediante autorização do titular, antes de liberar cadastros de clientes.

Fonte: https://supabase.com/docs/guides/auth/auth-smtp

## Verificações

O Pages registra build e publicação bem-sucedidos. Os testes automatizados verificam salvamento/conflitos, revisão de documentos, navegação e virada do dia. Acesso HTTP a este endereço é bloqueado pelo proxy do ambiente de trabalho, portanto não foi feita uma validação visual ou de login no navegador nesta integração. É necessário conferir login, recuperação, PDF e chamadas no endereço final.

O GitHub Actions também gera um pacote `evoluna-publicacao` por sete dias. Esse pacote agora contém a configuração pública do banco existente quando não há substituição por variáveis.

GitHub Pages não é utilizado para hospedar o aplicativo comercial: https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
