# Evoluna Odonto · Sorriso com IA

Código da versão oficial 78 do Evoluna Odonto, copiado do projeto em funcionamento.

## Recursos

Cadastro de pacientes, agenda, prontuário odontológico, documentos PDF, registros financeiros, teleconsulta e prévia local de clareamento. Login e dados privados por conta com Supabase e políticas RLS.

Esta cópia inclui as correções de revisão de atestados, fechamento do menu móvel e atualização da data. Não inclui a versão alternativa de colaboradores, dados de pacientes, backups privados ou credenciais de produção.

## Instalação

Requer Node.js 22 ou superior e npm. Para executar a prévia, o script atual usa Python 3.

```sh
npm ci
npm test
npm run test:cloud
npm run test:workflow
npm run build
npm run dev
```

Abra http://localhost:3001. O comando de build prepara `dist/`, que contém os arquivos para hospedagem estática.

## Configurar o Supabase

Edite `public/cloud-config.js` com a URL e a chave **publicável** do seu projeto. Esses dois valores são usados pelo navegador; nunca use `service_role` ou outra chave secreta. A configuração de produção foi substituída por marcadores nesta cópia.

O esquema de referência está em `supabase/workspace-schema.sql`. Ele já está aplicado no projeto original; **não o execute novamente na base existente**. Para uma base nova, confira o esquema e as políticas antes de aplicá-los. A pasta `cloud/` contém o cliente e o salvamento com controle de revisão.

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
As diferenças desta cópia são a documentação de instalação, os marcadores da configuração Supabase, a exclusão das propostas de equipe e o ajuste do relógio de teste para funcionar em qualquer fuso horário. Nenhum dado clínico foi transferido.

## Preparação da publicação pelo GitHub

O workflow **Verificar e preparar publicação** roda os testes e gera um pacote dos arquivos estáticos. Consulte [Hospedagem e domínio](docs/HOSPEDAGEM.md). Ele não publica no GitHub Pages nem altera o site oficial.

O GitHub Pages não permite hospedar serviços comerciais SaaS. O repositório pode guardar o código e preparar o pacote, mas a operação comercial precisa de hospedagem apropriada.

Para configurar a compilação, cadastre as variáveis públicas `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY` em **Settings → Secrets and variables → Actions → Variables**. O build usa essas variáveis quando fornecidas. Sem elas, permanece a configuração de exemplo; o pacote não está pronto para uso real.
