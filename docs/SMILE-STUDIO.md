# Estúdio Sorriso com IA — implantação de 04/11/2026

A página principal usa o fluxo aprovado na cópia de validação. O estúdio é servido no mesmo domínio em `smile-studio/index.html`, com a sessão Supabase já aberta no Evoluna. A cópia de validação continua com armazenamento e login próprios.

## Regras

1. Selecionar paciente antes da foto. A troca limpa a foto e a seleção anterior.
2. Clareamento e Lentes começam desmarcados. Clicar na opção marcada a desmarca. Gerar sem seleção mostra a orientação, sem enviar a foto.
3. Cada nova geração explícita usa o prompt aprovado do tratamento em BL1. Os textos completos ficam em `magic-hour/prompts.mjs`; o servidor não recebe prompts livres.
4. Depois da geração, BL1/BL2/A1 são alterações locais apenas no esmalte. Sem controle de intensidade e sem nova chamada paga.
5. Uma geração cria uma prévia; ajustes locais atualizam a mesma prévia e o mesmo documento PNG.
6. A imagem original e a base da IA ficam preservadas. Arquivos em bucket privado e referências pequenas no prontuário, sem duplicar imagens em Base64 no workspace.
7. As abas do painel esquerdo e a busca em destaque foram retiradas. O ícone de setas circulares no rodapé tem a indicação Trocar de cliente.
8. Documentos do paciente continuam disponíveis no perfil, para visualizar, baixar e preparar envio pelo chat ou WhatsApp. Nenhuma mensagem é enviada automaticamente.

## Dados

`supabase/smile-studio-schema.sql` cria a tabela `evoluna_smile_generations`, o bucket privado `evoluna-smile`, políticas por conta e controle de revisão. A infraestrutura de validação continua em `evoluna_smile_trial_generations` e `evoluna-smile-trial`; dados de teste não são promovidos automaticamente.

Prévias antigas continuam na galeria. Ao editar ou salvar uma antiga, o arquivo é copiado para o armazenamento privado e o documento mantém a associação com o paciente. Se a sincronização do prontuário falhar, a geração permanece salva e Salvar PNG permite tentar novamente, sem gerar outra imagem.

## Verificação

- Worker: prompts diferentes por tratamento, ambos BL1, recusa de tratamento ausente, autenticação, limite de requisições e propriedade dos resultados.
- Navegador: seleção/desmarcação, geração simulada, PNG privado no perfil, atualização do mesmo documento, exportação PNG, revisão de envio, importação de prévia antiga sem API, resoluções 1920×838 até 320×420.
- Esmalte: dimensões preservadas e zero pixels alterados fora da máscara nas fotos de rosto e recorte de boca verificadas.
- Banco local: RLS entre contas, base da IA imutável, conflitos de revisão e vínculos do paciente.

Os testes usam serviços simulados e pacientes fictícios; não fazem gerações pagas nem enviam mensagens reais.

## Vínculo entre tratamento e prompt

Clareamento usa exclusivamente `clareamento-bl1-v1`; Lentes usa exclusivamente `lentes-bl1-v1`. A seleção é capturada na confirmação e não pode mudar durante aquela requisição. A API bloqueia identificadores incompatíveis antes do envio de imagens, utiliza o texto fixo aprovado e nomeia as tarefas como Evoluna - Clareamento BL1 ou Evoluna - Lentes BL1, acompanhadas do identificador da geração. O ticket assinado e as respostas de criação/consulta carregam o mesmo tratamento, prompt e requisição. A página rejeita respostas incompatíveis. Tickets antigos continuam consultáveis sem criar outra imagem.

O teste de navegador `tests/smile-studio.browser.cjs` passa do botão pelo handler real do Worker até um editor simulado e compara o prompt completo em sequência Clareamento, Lentes, Clareamento. Também muda a seleção com uma confirmação aberta e verifica que nenhuma geração seja enviada. Nenhum crédito real é usado.
