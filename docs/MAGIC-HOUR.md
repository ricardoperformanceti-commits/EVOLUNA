# Magic Hour MCP no Evoluna

O caminho ativo de criação é POST /v1/smile/free-edit. O antigo POST /v1/smile foi desativado. GET /v1/smile e GET /v1/smile/result consultam somente tickets assinados do fluxo MCP.

O Worker autentica a conta no Supabase, exige foto, serviço, tonalidade, comando e consentimento. A chamada MCP usa initialize, notifications/initialized e tools/call. São permitidas apenas get_account_info, get_upload_urls, edit_image e get_image_project. O upload recebe os bytes da foto sem a chave de API.

O texto de style.prompt é exatamente o comando digitado. Serviço e tonalidade acompanham o ticket como metadados vinculados à solicitação. Não há mais os seis prompts predefinidos nem geração de três variações por clique.

Pool de credenciais: MAGIC_HOUR_MCP_API_KEY (ou MAGIC_HOUR_API_KEY para compatibilidade), MAGIC_HOUR_MCP_API_KEY_2 e MAGIC_HOUR_MCP_API_KEY_3. Antes de qualquer upload ou criação, consultas somente de leitura verificam saldo e tier em paralelo. Contas inválidas, indisponíveis ou com menos de 10 créditos são ignoradas; escolhe-se o maior saldo elegível. Dez é o mínimo inicial documentado para o modelo, não uma cotação nem garantia de saldo após pedidos concorrentes. Não há nova tentativa de edit_image em outra conta após seu envio, mesmo em erro ou timeout. O ticket assinado inclui uma referência SHA-256 opaca à credencial escolhida; status e download usam somente essa credencial. Tickets antigos sem referência continuam na credencial principal. Remover/trocar uma credencial interrompe a consulta de seus pedidos ainda em andamento. Nenhuma conta, saldo ou referência é exibida na interface. As seis credenciais MAGIC_HOUR_LENTES_{BL1,BL2,A1}_API_KEY e MAGIC_HOUR_CLAREAMENTO_{BL1,BL2,A1}_API_KEY foram removidas. Nenhuma chave fica no navegador ou repositório.

Preservar JOB_SIGNING_KEY, autenticação, ALLOWED_ORIGINS, configuração de acesso e GENERATE_LIMITER em deploys. Fotos: JPEG/PNG até 4 MB. Resultado: até 8 MB. Modelo qwen-image-2.1, 640px e image_count=1. O acesso ao resultado exige sessão e ticket do mesmo usuário. HTTPS, host de mídia permitido, limites de resposta e redirecionamentos restritos permanecem ativos.

O projeto e seu ticket são guardados nos documentos privados do usuário. Não repetir criação quando o recebimento ficar incerto; consultar o projeto ou conferir a Magic Hour. Testes usam respostas simuladas, sem gerações pagas.
