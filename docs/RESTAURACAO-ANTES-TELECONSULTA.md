# Ponto de restauração antes do novo fluxo de teleconsulta

- Site: `appgprj_6ad9fef04a64819198357efc2b7fd8b0`
- Versão publicada anterior: **24**
- Versão salva: `appgprj_6ad9fef04a64819198357efc2b7fd8b0~appgver_8859cad7424c81918a3aaaa710436a97`
- Commit anterior: `5580c5ee6943bd10cdfa1884f36d9473913d718f`
- Acesso a preservar: público, conforme autorizado pelo proprietário.

## Restaurar a aplicação

Republicar a versão salva 24 usando a operação de publicação de versão existente do Sites. Não criar outro projeto e não sobrescrever os dados locais dos navegadores. A versão anterior permanece salva no Sites, independente do checkout atual.

Uma cópia adicional, fora dos arquivos públicos, está em `/workspace/backups/evolluna-antes-teleconsulta-5580c5e/`: código, build de publicação anterior, hashes SHA-256 e instruções. O código foi extraído em pasta separada, passou nas verificações de sintaxe e reconstruiu app.js, video-room.js e index.html iguais aos da publicação anterior.

## Dados locais

O backup de código/publicação não inclui os dados privados existentes em cada navegador. Não houve migração destrutiva: os pacientes, históricos e documentos anteriores são mantidos. A nova versão acrescenta sessões e planos clínicos sem remover os campos existentes. O botão **Baixar backup dos dados locais**, em Configurações e na sessão, exporta um JSON com os dados daquele navegador, incluindo rascunhos em memória. Guardar esse arquivo em local apropriado; ele pode conter informações pessoais. Não publicar o JSON junto aos arquivos estáticos.

## Verificação do novo fluxo

Foram verificados: seis tipos e respectivos destinos; trava da lista e desbloqueio após salvar; rascunhos após recarregar; descarte com confirmação; não duplicação; tratamento de falta de espaço; falha na etapa final sem encerrar a chamada; PDF A4 com paginação e metadados preservados; revisão do compartilhamento; alternativa por download; documentos vinculados ao paciente e sessão; telas de 320, 390, 834 e 1440 px.

A persistência da chamada durante edição e salvamento foi testada com API Jitsi simulada. O compartilhamento nativo foi testado com API simulada, sem enviar arquivos a terceiros. Uma chamada real entre dois participantes e a entrega em aplicativos externos não foram validadas neste ambiente. A chamada aberta em outra aba continua exigindo encerramento naquela aba.
