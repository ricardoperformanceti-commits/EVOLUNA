# Evoluna Odonto · Sorriso com IA

Código da versão oficial 78 do Evoluna Odonto, copiado do projeto em funcionamento.

## Recursos

Cadastro de pacientes, agenda, prontuário odontológico, documentos PDF, registros financeiros, teleconsulta e prévia local de clareamento. Login e dados privados por conta com Supabase e políticas RLS.

Esta cópia inclui as correções de revisão de atestados, fechamento do menu móvel e atualização da data. Não inclui a versão alternativa de colaboradores, dados de pacientes, backups privados ou credenciais secretas. A URL e a chave publicável do Supabase são configurações públicas da aplicação.

## Instalação

Requer Node.js 22 ou superior e npm. Para executar a prévia, o script atual usa Python 3.

```sh
npm ci
npm test
npm run test:cloud
npm run test:database
npm run test:workflow
npm run build
npm run dev
```

Abra http://localhost:3001. O comando de build prepara `dist/`, que contém os arquivos para hospedagem estática.

## Configurar o Supabase

`public/cloud-config.js` está configurado com a URL e a chave **publicável** do Supabase existente do Evoluna. Esses valores são públicos e não concedem acesso aos registros sem autenticação e RLS. Nunca use `service_role`, senha ou chave secreta. Para uma instalação independente, substitua ambos pelos valores do novo projeto.

O esquema inicial está em `supabase/workspace-schema.sql` e a separação dos módulos está na migração `supabase/migrations/*_normalize_clinical_modules.sql`. Na base original, o esquema inicial já existe e não deve ser repetido. Em uma base nova, aplique ambos nessa ordem. Veja o [mapa das tabelas e o fluxo de salvamento](docs/BANCO-DE-DADOS.md). A pasta `cloud/` contém o cliente com funções RPC e controle de revisão.

Na mudança de domínio/hospedagem, ajuste no Supabase o Site URL e a lista de redirecionamentos de confirmação de cadastro e recuperação de senha. O GitHub não contém os usuários ou os registros do Supabase.

## Hospedar

1. Configure o Supabase e execute `npm ci` e `npm run build`.
2. Publique o **conteúdo de `dist/`** na hospedagem estática, com HTTPS.
3. Mantenha `/teleconsulta.html` e os arquivos de `vendor/` acessíveis.
4. Teste login, recuperação de senha, salvamento, câmera/microfone e PDF no novo endereço antes de mudar o domínio dos clientes.

A pasta `.openai/` registra a hospedagem atual no Sites; não é necessária para servir os arquivos em outra hospedagem. Este envio ao GitHub não muda a publicação oficial nem o banco. `worker/` é uma implementação anterior e não participa do build estático atual.

## Limites atuais

- Teleconsulta usa WebRTC/PeerJS; TURN de produção ainda não configurado.
- Documentos não possuem assinatura digital. Compartilhamento depende do dispositivo.
- Sorriso faz ajuste local da cor; não gera facetas por IA.
- Lembretes e parte dos gráficos financeiros são demonstrativos.
- Colaboradores e validação profissional do CRO não estão implementados na versão oficial.
- A cópia dos dados pode ser exportada pela interface; a restauração ainda precisa de validação isolada.

Consulte também `docs/SUPABASE.md`, `docs/TELECONSULTA-WEBRTC.md` e `THIRD_PARTY_NOTICES.md`. Documentos antigos podem descrever etapas anteriores; este README descreve a exportação atual.

## Origem

Versão oficial: **78**. Commit de origem: `52d6287e6ec49bc2bcd5ce678b7de227a2a6fd34`.
As diferenças desta cópia são a documentação de instalação, a exclusão das propostas de equipe e o ajuste do relógio de teste para funcionar em qualquer fuso horário. A configuração pública foi alinhada com a implantação na Cloudflare. Nenhum dado clínico foi transferido.

## Preparação da publicação pelo GitHub

O workflow **Verificar e preparar publicação** roda os testes e gera um pacote dos arquivos estáticos. Consulte [Hospedagem e domínio](docs/HOSPEDAGEM.md). Ele não publica no GitHub Pages nem altera o site oficial.

O GitHub Pages não permite hospedar serviços comerciais SaaS. O repositório pode guardar o código e preparar o pacote, mas a operação comercial precisa de hospedagem apropriada.

O build aceita as variáveis públicas `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY` para substituir a configuração padrão. Na Cloudflare, elas já estão configuradas no projeto Pages `evoluna-odonto`. Sem variáveis, os builds e pacotes utilizam o mesmo Supabase existente configurado em `public/cloud-config.js`.

## Instalação Cloudflare

Endereço publicado: https://evoluna-odonto.pages.dev/

O projeto Pages `evoluna-odonto` está conectado à branch `main`. Novos commits disparam testes, build e publicação. O domínio `app.smilesimulator.com.br` está associado e aguarda o registro DNS no Registro.br. A ativação do domínio e os fluxos de e-mail ainda precisam de validação. Consulte [o roteiro de integração](docs/HOSPEDAGEM.md).


## Atendimento com chat

O atendimento usa três colunas: paciente, anotações e documentos à esquerda; vídeo no centro; conversa com o paciente à direita. O menu fica oculto e a área ocupa a janela sem barra de rolagem da página. Listas longas são paginadas e, em telas pequenas, as áreas são alternadas por abas. O paciente entra pelo convite e pode conversar sem câmera. O envio pelo WhatsApp abre a conversa para confirmação manual; PDFs podem ser compartilhados pelo dispositivo ou baixados para anexar. Consulte [CHAT-ATENDIMENTO.md](docs/CHAT-ATENDIMENTO.md) para limites, privacidade e testes.
