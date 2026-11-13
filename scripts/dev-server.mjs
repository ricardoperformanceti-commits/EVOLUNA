import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {extname,join,normalize} from 'node:path';

const args=process.argv.slice(2),value=flag=>args[args.indexOf(flag)+1];
const port=Number(value('--port')||process.env.PORT||3001),host=value('--host')||'127.0.0.1',root=join(process.cwd(),'dist');
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon','.pdf':'application/pdf'};

createServer(async(req,res)=>{try{const url=new URL(req.url,'http://preview.local'),raw=decodeURIComponent(url.pathname),safe=normalize(raw).replace(/^(\.\.(\/|\\|$))+/,''),requested=join(root,safe),info=await stat(requested).catch(()=>null);let file=info?.isDirectory()?join(requested,'index.html'):requested;if(!info&&!extname(file))file+='.html';const body=await readFile(file);res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream','cache-control':'no-store'});res.end(body)}catch{res.writeHead(404,{'content-type':'text/plain; charset=utf-8'});res.end('Página não encontrada')}}).listen(port,host,()=>console.log(`Preview em http://${host}:${port}`));
