import {createHash} from 'node:crypto';
import { build } from 'esbuild';
import {rm,mkdir,cp,copyFile,readFile,writeFile} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});
await mkdir('dist/.openai',{recursive:true});
await cp('public','dist',{recursive:true});
await mkdir('dist/vendor/face-mesh',{recursive:true});
for(const name of ['face_mesh.js','face_mesh.binarypb','face_mesh_solution_packed_assets.data','face_mesh_solution_packed_assets_loader.js','face_mesh_solution_simd_wasm_bin.data','face_mesh_solution_simd_wasm_bin.js','face_mesh_solution_simd_wasm_bin.wasm','face_mesh_solution_wasm_bin.js','face_mesh_solution_wasm_bin.wasm'])await copyFile('node_modules/@mediapipe/face_mesh/'+name,'dist/vendor/face-mesh/'+name);
await copyFile('.openai/hosting.json','dist/.openai/hosting.json');
console.log('Demonstração frontend preparada em dist/.');

await build({entryPoints:['pdf/record-export.js'],bundle:true,format:'iife',platform:'browser',target:'es2022',outfile:'dist/record-pdf.js',minify:true});

await mkdir('dist/licenses',{recursive:true});
await copyFile('node_modules/peerjs/LICENSE','dist/licenses/peerjs-MIT.txt');
await build({entryPoints:['rtc/engine.js'],bundle:true,format:'iife',platform:'browser',target:'es2022',outfile:'dist/rtc-engine.js',minify:true});

await build({entryPoints:['cloud/client.js'],bundle:true,format:'iife',platform:'browser',target:'es2022',outfile:'dist/cloud-client.js',minify:true});
// Cada versão pede os arquivos novos, sem reutilizar JavaScript ou CSS antigo do navegador.
for(const page of ['index.html','teleconsulta.html']){
let html=await readFile('dist/'+page,'utf8');
for(const match of [...html.matchAll(/(?:src|href)="(\/[^"?]+\.(?:js|css))"/g)]){const path=match[1],hash=createHash('sha256').update(await readFile('dist'+path)).digest('hex').slice(0,12);html=html.replaceAll('"'+path+'"','"'+path+'?v='+hash+'"')}
await writeFile('dist/'+page,html);
}
