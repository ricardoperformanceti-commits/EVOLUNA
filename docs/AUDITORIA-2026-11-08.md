# Revisão do Evoluna — 8 de novembro de 2026

Endereços: https://app.smilesimulator.com.br e https://sorriso-com-ia-clinica.ricardo-performancet.chatgpt.site/.

## Resultado

- 150 testes automatizados aprovados, sem falhas: acesso, isolamento entre contas, salvamento e recuperação, documentos, agenda, chat, protocolo de teleconsulta, comandos de IA, tonalidades, comparação, teclado e layout móvel.
- 48 verificações de renderização sem erros: 12 rotas × larguras de 390 e 1460 pixels × contas vazias e exemplos fictícios. Cobrem início, agenda, pacientes, prontuários, Sorriso IA, teleconsultas, documentos, financiamento, financeiro, relatórios, configurações e Mais.
- 137 verificações de arquivos públicos concluídas: 68 arquivos na hospedagem Cloudflare e 69 no Sites. Os inventários diferem pela foto de apresentação de cada variante. Nenhum arquivo esperado falhou ou retornou HTML no lugar de script/imagem; nenhum segredo Magic Hour foi encontrado nesses arquivos.
- As consultas sem login ao usuário autenticado, tabela de pacientes e RPC de carregamento do espaço foram bloqueadas com HTTP 401.
- RLS ativo nas 18 tabelas públicas. Os dois buckets de fotos são privados e têm limite de 8 MB. Políticas principais consultadas restringem os dados ao usuário autenticado.
- Serviço de imagens configurado e sem eventos de erro retornados na consulta da última hora realizada durante a revisão.
- Link externo da Parcelex respondeu com HTTP 200.

## Correção realizada

O carregamento de um espaço de dados não tinha cancelamento lógico para troca de sessão. Uma resposta atrasada poderia reconstruir a interface depois de sair, trocar de conta ou entrar no fluxo de recuperação de senha. A correção vincula cada carregamento à versão da sessão e à instância do espaço. Respostas antigas são descartadas antes de criar ou exibir dados. Falhas de validação antigas também deixam de substituir uma sessão mais recente por uma tela de erro.

O teste antigo de autenticação importava um servidor SSR removido do projeto. Foi substituído por testes do cliente Supabase efetivamente utilizado, incluindo saída durante carregamento, troca de conta, recuperação de senha, expiração de sessão e escape de mensagens. `npm run test:all` executa a suíte completa.

## Pendências e limites

1. **Proteção contra senhas vazadas desativada no Supabase Auth.** A configuração administrativa não foi alterada. [Orientação oficial](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
2. **Quatro avisos de desempenho nas políticas de geração.** As chamadas a `auth.jwt()` das políticas INSERT/UPDATE de `evoluna_smile_generations` e `evoluna_smile_trial_generations` podem ser avaliadas por linha. [Orientação oficial](https://supabase.com/docs/guides/database/database-linter?lint=0003_auth_rls_initplan). Nenhuma política de produção foi modificada nesta revisão. Os índices indicados como não utilizados foram preservados.
3. **Teleconsulta direta sem TURN no arquivo publicado.** O cliente usa STUN e sinalização padrão PeerJS. Redes restritivas podem exigir relay TURN; a interface oferece Jitsi como alternativa. A chamada real com câmera, microfone e dois participantes em redes distintas precisa de validação operacional.
4. **Verificação visual e autenticada no navegador pendente.** O ambiente informa desktop habilitado com estado `unknown`, mas não disponibiliza `cua_repl.js` nem outra ferramenta de controle do desktop. Ambiente: `ccarenv_b64_Y2NhcmVudl8wYzI4ZDYwMzk2NmM4MTkxYjVlZmZiMzYxNjMxMjE2Nw`. As verificações de renderização são executadas em ambiente de testes e não substituem screenshots nem gestos num aparelho físico. Geração paga de imagens e entregas externas não foram executadas.

A revisão usou dados fictícios nos testes. Nenhum registro de paciente foi alterado, nenhum convite foi enviado e nenhuma geração paga foi solicitada.
