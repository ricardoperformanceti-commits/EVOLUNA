# Proposta de acesso da equipe — aguardando autorização

Esta proposta não foi aplicada ao Supabase. A revisão automática rejeitou a
migração porque ela amplia o acesso a dados clínicos e requer autorização explícita
do usuário sobre esse alcance. A base atual continua privada por conta.

O responsável pela clínica poderá criar um convite destinado a um e-mail específico,
com validade de sete dias. O destinatário precisará entrar numa conta com esse
mesmo e-mail confirmado. Não haverá envio automático de mensagens: o responsável
copiará o convite e o compartilhará com a pessoa escolhida.

As permissões propostas são:

- **Visualizar:** consultar todos os dados da clínica, incluindo pacientes,
  prontuários, fotos, documentos, agenda e financeiro; sem alterar os registros.
- **Editar:** consultar e alterar esses mesmos dados; sem gerenciar a equipe.
- **Responsável:** manter o controle da equipe, definir permissões e revogar acessos.

Cada clínica continuará separada das demais. Aceitar um convite não apagará os dados
particulares já cadastrados pelo profissional. Pessoas sem convite não terão acesso.
A autorização será conferida pelo banco a cada leitura e gravação.

A definição SQL para revisão está em `supabase/proposals/team-invitations.sql`.
Ela ainda precisa ser validada e aplicada após autorização, junto da interface de equipe.

## Regras aprovadas para a próxima implementação

### Cadastro da equipe

- O dentista responsável poderá cadastrar usuários da clínica em
  **Configurações > Usuários**.
- O primeiro perfil operacional será **Recepcionista**.
- Cada usuário deverá ficar vinculado à clínica e ao dentista responsável que o
  cadastrou.
- O cadastro deverá registrar quem criou, quando criou, estado da conta e perfil
  de acesso.

### Níveis de acesso

#### Usuário N1 — acesso completo

- Tem acesso a todas as áreas e funções da clínica.
- Pode cadastrar e administrar usuários.
- Pode criar, consultar, alterar, gerar e enviar documentos.
- Pode administrar agenda, pacientes, prontuários, Sorriso IA e configurações.

#### Usuário N2 — operação restrita

- Corresponde ao perfil operacional da recepcionista.
- Pode acessar Visão geral, Agenda, Pacientes e Documentos.
- Pode criar agendamentos e cadastrar ou atualizar pacientes dentro das
  permissões da clínica.
- Em Documentos, pode consultar documentos existentes e usar a ação **Enviar**.
- Não pode gerar, criar, editar nem excluir documentos.
- Não pode administrar usuários ou configurações da clínica.

#### Permissões configuráveis do N2

O dentista N1 poderá abrir **Configurações > Usuários**, selecionar um usuário N2
e habilitar ou desabilitar permissões operacionais individualmente. A configuração
inicial terá:

- Visão geral: acessar;
- Agenda: visualizar, criar e alterar agendamentos;
- Pacientes: visualizar, cadastrar e atualizar dados básicos;
- Documentos: visualizar e enviar;
- Marketing digital: acessar.

Permissões como cancelar agendamentos, excluir pacientes, acessar prontuários,
Sorriso IA e financeiro começarão desabilitadas, mas poderão ser habilitadas pelo
N1 quando a política da clínica permitir.

Gerar, editar ou excluir documentos, gerenciar usuários e alterar configurações
administrativas da clínica permanecerão bloqueados para o N2 e identificados como
**Restrito ao N1**.

O N1 poderá desativar completamente o acesso do N2. Toda mudança de permissão ou
estado da conta deverá gerar um evento no histórico de auditoria, com autor, data,
hora e valores anteriores e novos.

### Permissões da recepcionista

A recepcionista poderá:

- consultar a visão geral;
- criar e administrar agendamentos;
- cadastrar e atualizar pacientes;
- consultar e enviar documentos já existentes dentro das permissões definidas
  para a clínica.

O menu da recepcionista deverá mostrar somente:

- Visão geral;
- Agenda;
- Pacientes;
- Documentos;
- Configurações da própria conta;
- Sair.

A recepcionista não poderá acessar configurações administrativas da clínica,
gerenciamento de usuários, dados exclusivos do dentista ou funções que não façam
parte do seu perfil.

### Marketing digital

- O menu terá um cartão de **Marketing digital**.
- O cartão será visível para a recepcionista e para o dentista.
- O conteúdo e a ação do cartão serão definidos na etapa de implementação.

### Auditoria

Agendamentos, pacientes e documentos deverão registrar o ID do usuário que criou
ou alterou cada item. O vínculo com a clínica deve permanecer mesmo se o usuário
for desativado.

Toda atividade do usuário N2 deverá gerar um registro de auditoria vinculado à
clínica, contendo:

- ID e nome do usuário N2;
- tipo da ação realizada;
- área do sistema;
- ID do registro envolvido, quando houver;
- data e hora;
- resultado da ação, incluindo sucesso, falha ou tentativa sem permissão;
- valores anteriores e novos somente nos campos alterados, quando aplicável.

Devem ser registrados, no mínimo: entrada e saída da conta, consulta de pacientes
e documentos, cadastro ou alteração de paciente, criação ou alteração de
agendamento, envio de documento e tentativas de executar ações bloqueadas.

Os registros de auditoria não poderão ser alterados pelo usuário N2. A
desativação do usuário não apagará o histórico.

### Sino de atividades para o dentista

- O dentista N1 terá um sino com as atividades realizadas pelos usuários N2 da
  clínica.
- Cada aviso mostrará quem realizou a ação, o que foi feito e quando ocorreu.
- Ao clicar, o dentista poderá abrir o registro relacionado e consultar os
  detalhes da auditoria.
- Os avisos terão estado lido e não lido.
- A interface poderá agrupar ações repetidas para evitar excesso visual, sem
  remover nenhum evento do histórico completo.

### Tela de Documentos

- A entrada da tela mostrará somente os **cinco documentos mais recentes** da
  clínica, ordenados do mais novo para o mais antigo.
- A busca principal será por paciente, aceitando pelo menos nome, telefone, CPF e
  ID do paciente.
- Os resultados da busca mostrarão pacientes, não uma lista misturada de
  documentos.
- Ao selecionar um paciente, a tela abrirá todos os documentos vinculados a ele,
  com ordenação por data e acesso aos detalhes de cada item.
- A tela deverá ter estado vazio claro quando o paciente ainda não possuir
  documentos e não poderá misturar documentos de pacientes diferentes.
- O acesso continuará respeitando a clínica e as permissões do usuário conectado.

## Referência visual aprovada

O layout móvel aprovado para a teleconsulta está salvo em
`docs/assets/teleconsulta-mobile-aprovada.png`. Ele prevê vídeo quadrado no topo,
controles de microfone, câmera e encerramento dentro da chamada, miniatura do
próprio usuário e chat abaixo.

A proposta visual da configuração de permissões do N2 está salva em
`docs/assets/permissoes-usuario-n2-aprovacao.png`.

## Padrão visual obrigatório

As novas telas de usuários, permissões, suporte, documentos e teleconsulta devem
seguir o sistema visual já utilizado pelo Evoluna Odonto. A implementação deverá
reutilizar as cores, tipografia, ícones, espaçamentos, cantos, sombras, botões,
campos, estados ativos e mensagens existentes no produto. As imagens de referência
definem a organização das telas, mas não substituem os componentes e tokens visuais
do site atual.
