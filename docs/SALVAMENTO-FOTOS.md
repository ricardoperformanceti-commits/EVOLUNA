# Recuperação e desempenho do salvamento com fotos

Foram observados três cancelamentos por statement_timeout no banco. As funções de salvamento reenviam o snapshot e sincronizam os módulos em uma transação; o papel authenticated tem limite de 8 segundos. Os snapshots armazenados observados tinham aproximadamente 7,5 e 7,9 MiB. Nenhuma foto ou cadastro real foi exportado para o código.

A migração optimize_workspace_image_sync prepara cada coleção e os IDs uma vez e elimina a varredura repetida do JSON com imagens durante as exclusões. Ela modifica a versão instalada da função interna, preservando a compatibilidade com ou sem a migração de chat. Apenas os RPCs autenticados de salvar e criar ganham statement_timeout de 30 segundos, sem mudar a configuração global, RLS, permissões, revisão esperada, referências ou limite de 16 MiB. A migração não atualiza registros de pacientes.

No navegador, o erro de tempo limite ganha uma mensagem em português. O aviso permite baixar as alterações, baixar a prévia atual em PNG e tentar salvar o snapshot pendente. Uma tentativa bem-sucedida restaura exatamente o snapshot confirmado. Conflitos com outro dispositivo continuam exigindo recarregar a versão salva e não oferecem repetição automática. Nenhuma tentativa de salvar gera uma nova chamada à API de imagens.

Antes de recarregar a página, baixar as alterações preserva o snapshot que falhou; carregar a versão salva descarta alterações locais. Não há confirmação de salvamento se o RPC retornar erro.

Verificações: dados fictícios de 8 MiB, integridade de imagens e módulos, exclusões, conta sem acesso, anonimato, transações revertidas, revisão concorrente e recuperação após timeout. A implantação da migração exige a confirmação nativa do conector Supabase; o status real deve ser conferido em pg_proc.proconfig e na definição de sync_modules.
