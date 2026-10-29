import { build } from 'esbuild';
import {rm,mkdir,cp,copyFile} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});
await mkdir('dist/.openai',{recursive:true});
await cp('public','dist',{recursive:true});
await mkdir('dist/vendor/face-mesh',{recursive:true});
for(const name of ['face_mesh.js','face_mesh.binarypb','face_mesh_solution_packed_assets.data','face_mesh_solution_packed_assets_loader.js','face_mesh_solution_simd_wasm_bin.data','face_mesh_solution_simd_wasm_bin.js','face_mesh_solution_simd_wasm_bin.wasm','face_mesh_solution_wasm_bin.js','face_mesh_solution_wasm_bin.wasm'])await copyFile('node_modules/@mediapipe/face_mesh/'+name,'dist/vendor/face-mesh/'+name);
await copyFile('.openai/hosting.json','dist/.openai/hosting.json');
console.log('Demonstração frontend preparada em dist/.');

await build({entryPoints:['pdf/record-export.js'],bundle:true,format:'iife',platform:'browser',target:'es2022',outfile:'dist/record-pdf.js',minify:true});
