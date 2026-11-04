import {publicConfigFromEnvironment} from './public-config.mjs';
import {createHash} from 'node:crypto';
import { build } from 'esbuild';
import {rm,mkdir,cp,copyFile,readFile,writeFile} from 'node:fs/promises';
const publicConfig=publicConfigFromEnvironment(process.env);
await rm('dist',{recursive:true,force:true});
await mkdir('dist/.openai',{recursive:true});
await cp('public','dist',{recursive:true});
if(publicConfig)await writeFile('dist/cloud-config.js','window.EVOLUNA_SUPABASE='+JSON.stringify(publicConfig)+';\n');
await mkdir('dist/vendor/face-mesh',{recursive:true});
for(const name of ['face_mesh.js','face_mesh.binarypb','face_mesh_solution_packed_assets.data','face_mesh_solution_packed_assets_loader.js','face_mesh_solution_simd_wasm_bin.data','face_mesh_solution_simd_wasm_bin.js','face_mesh_solution_simd_wasm_bin.wasm','face_mesh_solution_wasm_bin.js','face_mesh_solution_wasm_bin.wasm'])await copyFile('node_modules/@mediapipe/face_mesh/'+name,'dist/vendor/face-mesh/'+name);
await copyFile('.openai/hosting.json','dist/.openai/hosting.json');
console.log('Demonstração frontend preparada em dist/.');

await build({entryPoints:['pdf/record-export.js'],bundle:true,format:'iife',platform:'browser',target:'es2022',outfile:'dist/record-pdf.js',minify:true});

await mkdir('dist/licenses',{recursive:true});
await copyFile('node_modules/peerjs/LICENSE','dist/licenses/peerjs-MIT.txt');
await build({entryPoints:['rtc/engine.js'],bundle:true,format:'iife',platform:'browser',target:'es2022',outfile:'dist/rtc-engine.js',minify:true});

await build({entryPoints:['cloud/client.js'],bundle:true,format:'iife',platform:'browser',target:'es2022',outfile:'dist/cloud-client.js',minify:true});
await build({entryPoints:['smile-studio/src/app.js'],bundle:true,format:'esm',platform:'browser',target:'es2022',outfile:'dist/smile-studio/app.js',minify:true});
// Cada versão pede os arquivos novos, sem reutilizar JavaScript ou CSS antigo do navegador.
for(const page of ['smile-studio/index.html','index.html','teleconsulta.html']){
let html=await readFile('dist/'+page,'utf8');
for(const match of [...html.matchAll(/(?:src|href)="(\/[^"?]+\.(?:js|css))"/g)]){const path=match[1],hash=createHash('sha256').update(await readFile('dist'+path)).digest('hex').slice(0,12);html=html.replaceAll('"'+path+'"','"'+path+'?v='+hash+'"')}
await writeFile('dist/'+page,html);
if(page==='smile-studio/index.html'){const revision=createHash('sha256').update(html).digest('hex').slice(0,12),host=await readFile('dist/smile-studio-host.js','utf8');await writeFile('dist/smile-studio-host.js',host.replace('/smile-studio/index.html','/smile-studio/index.html?v='+revision))}
}
