# Sorriso com IA — versão hospedada

Adaptação do aplicativo Next.js para a hospedagem Sites (Cloudflare Worker ESM). As telas mantêm o mesmo visual. O projeto Next.js original permanece em /workspace/sorriso-com-ia.

`npm ci && npm run build` produz dist/server/index.js e dist/.openai/hosting.json. O Worker implementa cadastro, login, logout, callback PKCE, confirmação de e-mail e painel protegido com validação de usuário no servidor. Cookies Secure/HttpOnly/SameSite=Lax, verificação de Origin em POST, respostas sem cache e escape de texto dinâmico.

Configure SUPABASE_URL e SUPABASE_PUBLISHABLE_KEY nas variáveis de ambiente do Sites; nenhuma chave privilegiada é necessária.

Antes de usar os e-mails em produção, configure no Supabase, Authentication > URL Configuration:
- Site URL: https://sorriso-com-ia-clinica.balmygnat129.chatgpt.site
- Redirect URLs: https://sorriso-com-ia-clinica.balmygnat129.chatgpt.site/auth/callback

Essa configuração de Auth não é exposta pelas ferramentas Supabase disponíveis nesta sessão. A confirmação por e-mail precisa ser verificada após esse ajuste. Não há tabelas de dados clínicos nem usuários de teste criados.

## Acesso direto

A página inicial abre sem login. A rota /login redireciona para /. O site permite visitantes sem autenticação na hospedagem. Rotas com dados de conta continuam exigindo validação de usuário no servidor.
