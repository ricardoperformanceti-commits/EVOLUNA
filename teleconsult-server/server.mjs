/* Servidor PeerJS opcional para a adaptação de Zoom-Clone-With-WebRTC.
   A hospedagem estática usa PeerJS Cloud; este processo é para servidor Node próprio. */
import express from 'express';
import {ExpressPeerServer} from 'peer';
import {createServer} from 'node:http';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
export function createRtcServer({assets=resolve('dist'),publicOrigin=process.env.RTC_PUBLIC_ORIGIN,iceServers=[{urls:'stun:stun.l.google.com:19302'}]}={}){
 const app=express(),server=createServer(app);app.disable('x-powered-by');
 app.use((req,res,next)=>{res.set({'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Permissions-Policy':'camera=(self), microphone=(self), display-capture=(self)'});next()});
 app.get('/health',(_req,res)=>res.json({ok:true}));
 app.get('/rtc-config.js',(_req,res)=>{res.set('Cache-Control','no-store');res.type('application/javascript').send(`window.RADIX_RTC_CONFIG=window.RADIX_RTC_CONFIG||{server:${publicOrigin?JSON.stringify(publicOrigin):'location.origin'},iceServers:${JSON.stringify(iceServers)}};`)});
 const peerServer=ExpressPeerServer(server,{path:'/',concurrent_limit:40,allow_discovery:false,alive_timeout:60000,expire_timeout:10000,proxied:process.env.RTC_TRUST_PROXY==='1',corsOptions:publicOrigin?{origin:publicOrigin}:{origin:false}});app.use('/peerjs',peerServer);
 app.use(express.static(assets,{index:'index.html',maxAge:0}));app.use((_req,res)=>res.status(404).json({error:'Not found'}));
 return {app,server,peerServer};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){const {server}=createRtcServer();const port=Number(process.env.PORT||3033);server.listen(port,'0.0.0.0',()=>console.log(`Radix RTC test server: http://127.0.0.1:${port}`));for(const signal of['SIGINT','SIGTERM'])process.on(signal,()=>{server.close(()=>process.exit(0));setTimeout(()=>process.exit(0),2000).unref()})}
