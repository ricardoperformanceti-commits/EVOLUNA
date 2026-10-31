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
