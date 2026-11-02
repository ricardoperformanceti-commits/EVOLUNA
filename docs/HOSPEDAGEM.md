# Hospedagem e domínio do Evoluna

O código está neste repositório. O site oficial atual e o Supabase continuam onde
estão. Este preparo não publica uma segunda instalação nem altera o DNS.

## Restrição do GitHub Pages

O GitHub Pages não permite hospedar serviços comerciais SaaS. Por isso, ele não é
o destino de produção deste aplicativo, que será oferecido a clientes.

Fonte oficial: https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits

O GitHub pode manter o código, executar os testes e gerar a publicação. Para servir
o aplicativo comercial, escolha uma hospedagem que permita esse uso, inclusive a
hospedagem que já foi contratada, caso tenha suporte a arquivos estáticos e HTTPS.

## O que está automatizado

Em Actions, o workflow **Verificar e preparar publicação** executa as verificações,
compila o aplicativo e disponibiliza o artefato **evoluna-publicacao** por sete dias.
Ele roda quando main recebe código e pode ser acionado manualmente. Não usa
permissão de administração nem publica em nenhum provedor.

## Configuração do aplicativo

Em Settings → Secrets and variables → Actions → Variables, configure:

- `SUPABASE_URL`: URL HTTPS do projeto.
- `SUPABASE_PUBLISHABLE_KEY`: chave pública iniciada por `sb_publishable_`.

Esses valores entram no código entregue ao navegador e não são segredos. Nunca
use senha, `sb_secret_`, `service_role` ou credenciais administrativas. A proteção
dos dados exige login e as políticas de RLS existentes no Supabase.

Sem essas variáveis, a compilação preserva a configuração de exemplo. Nesse caso,
o pacote serve para preparar a hospedagem, mas não está conectado ao banco real.

## Conectar o domínio quando a hospedagem for escolhida

1. Definir o nome exato do endereço do aplicativo e quem administra o DNS.
2. Configurar esse endereço no provedor de hospedagem antes de apontar o DNS.
3. Usar os registros DNS fornecidos por esse provedor, sem substituir registros
   de e-mail ou outros serviços do domínio.
4. Ativar e validar HTTPS, necessário também para câmera e microfone.
5. Publicar o conteúdo do pacote na raiz desse endereço. Os caminhos atuais do
   aplicativo pressupõem a raiz do domínio ou subdomínio, e não uma subpasta.
6. Atualizar Site URL e os redirecionamentos de autenticação no Supabase para o
   endereço definitivo; manter o endereço atual enquanto a migração é testada.
7. Testar login, confirmação/recuperação por e-mail, dados, PDFs e chamadas antes
   de encaminhar clientes à nova instalação.

Nenhum domínio, DNS ou serviço de hospedagem foi escolhido ou contratado por este
workflow. Não executar novamente o SQL de criação na base de produção existente.
