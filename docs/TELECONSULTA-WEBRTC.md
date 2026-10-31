# Teleconsulta WebRTC — variante de teste

Base: https://github.com/WebDevSimplified/Zoom-Clone-With-WebRTC
Revisão consultada: `6312ec74addbf00ec006ef9e0e085723660db9aa`.

A adaptação reaproveita o fluxo PeerJS do exemplo (`getUserMedia`, `peer.call`, `call.answer` e recepção de streams). A descoberta de participantes por Socket.IO foi substituída por convite e conexão de dados PeerJS. Isso permite testar na hospedagem estática existente. O ExpressPeerServer opcional substitui o PeerServer separado da porta 3001 do exemplo; nenhuma porta local está fixa no cliente publicado.

## Como testar

1. Teleconsulta → preparar um atendimento → **Nova chamada · teste**.
2. **Abrir sala de teste** e permitir câmera/microfone.
3. Copiar convite e abrir em outro aparelho/navegador. O convidado clica em entrar e autoriza seus dispositivos.
4. Testar áudio, vídeo, microfone, câmera, compartilhamento de tela e encerramento. Os registros de sessão permanecem no painel existente.
5. Voltar ao Jitsi somente após sair da chamada de teste. O Jitsi permanece como opção inicial.

O convidado acessa `/teleconsulta.html`; essa página não importa o aplicativo clínico, não lê localStorage e não recebe nome, CPF, anotações ou documentos pelo sinalizador.

## Conexão publicada

A variante estática utiliza a sinalização pública PeerJS Cloud e STUN do Google. O serviço público ajuda os participantes a trocarem informações de conexão; não foi implantado um servidor privado nesta publicação. Áudio e vídeo usam a conexão WebRTC entre os aparelhos, sem gravação pelo app.

**TURN ainda não está configurado.** Redes restritivas ou NATs incompatíveis podem impedir a chamada. Não considerar esta variante pronta para atendimento ou validar confiabilidade entre redes diferentes apenas com os testes locais. Não há garantia/SLA do sinalizador público. A variante está explicitamente identificada como teste e o Jitsi foi preservado.

Não foram feitas chamadas para pacientes reais. Os testes locais usam contextos independentes de navegador, mídia sintética, sinalizador PeerJS local real e relay TURN local TCP para respeitar a política de rede do ambiente; não simulam a conexão PeerJS nem RTCPeerConnection. O relay local é apenas um recurso de QA e não será publicado nem usado pelos visitantes. Estes testes não comprovam qualidade de câmera/microfone físicos, internet móvel ou dispositivos diferentes.

## Servidor Node opcional

```
npm ci
npm run build
npm run dev:rtc
```

Abre o app e o PeerServer em `http://127.0.0.1:3033`. O arquivo `rtc-config.js` servido por esse processo aponta automaticamente para o próprio servidor. Para hospedar, usar Node moderno, HTTPS/WSS no proxy e encaminhar upgrades de WebSocket. `PORT` define a porta; `RTC_PUBLIC_ORIGIN` define a origem HTTPS autorizada; `RTC_TRUST_PROXY=1` só deve ser usado quando o processo estiver isolado atrás de um proxy confiável.

Esse processo Node não é executado pela hospedagem estática Sites. Para servidor próprio em outro domínio, hospedar o Node e apontar `public/rtc-config.js` para essa origem; liberar somente as origens utilizadas. Nunca usar um processo temporário do ambiente de desenvolvimento como servidor publicado.

Para produção: escolher um serviço TURN e integrar emissão de credenciais temporárias em backend autorizado, com limites de uso. Não colocar segredo de provedor ou credencial TURN permanente em `rtc-config.js` ou no Git. Não há credenciais TURN ou endpoint de emissão pública ilimitada nesta versão.

## Convites e encerramento

Cada abertura gera identificador aleatório e segredo de 256 bits; o segredo fica no fragmento do convite, não na URL enviada ao servidor HTTP. O host verifica o segredo e a validade de até 4 horas antes de aceitar, limita a um participante e recusa chamadas de mídia não solicitadas. Isso é acesso por posse do convite, sem autenticação da identidade clínica. Não compartilhar o link publicamente.

Sair libera as tracks locais e destrói o Peer; o outro participante recebe o encerramento/queda. Finalizar registro só encerra a chamada depois de salvar com sucesso, conforme o fluxo já existente. Recarregar a página ou fechar a aba desconecta; uma nova sala exige novo convite. Os dados clínicos continuam locais ao navegador, sem sincronização com o participante.

## Retorno à versão anterior

Última versão antes desta adaptação: 55, commit `17376ffe964ea2c264c2d46b9a7bbacb98371eb9`.
Backup de código local: `/workspace/backups/antes-teleconsulta-webrtc-17376ff/source.tar`.
O backup não inclui dados locais dos usuários. Para desativar o teste sem rollback, remover a opção WebRTC em `VideoRoom.providerChoice()`; o fluxo Jitsi original foi mantido.

## Verificação desta implementação

- Build e verificações de sintaxe passaram.
- Servidor Node local: configuração, página de convidado, geração de identificadores e bloqueio de enumeração de peers passaram.
- Dois navegadores com mídia sintética e TURN local TCP receberam áudio e vídeo reais (estatísticas RTP e quadros decodificados).
- Microfone, câmera, compartilhamento por substituição de track, retorno à câmera e reconexão do sinalizador passaram.
- Convite inválido, expirado e terceiro participante foram recusados; troca de convite na mesma aba foi verificada.
- Saída/reentrada do convidado e finalização com salvamento da anotação pendente passaram; mídia local foi liberada.
- Fluxo Jitsi com provedor simulado: seis tipos de registros, PDFs, revisão/compartilhamento, recuperação de rascunho e falha de armazenamento passaram.
- Layout verificado em 320, 390, 834 e 1340px na nova chamada; sem erros de JavaScript no teste final.
- O sinalizador público e chamadas entre dois aparelhos em redes externas não foram validados neste ambiente. TURN de produção continua pendente; o usuário informou não possuir serviço ou hospedagem.
