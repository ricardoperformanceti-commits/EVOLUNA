import { build } from 'esbuild';
import { mkdir, copyFile } from 'node:fs/promises';
await mkdir('dist/server',{recursive:true});
await mkdir('dist/.openai',{recursive:true});
await build({ entryPoints:['worker/index.js'], bundle:true, format:'esm', platform:'browser', target:'es2022', outfile:'dist/server/index.js', minify:true, loader:{'.css':'text'} });
await copyFile('.openai/hosting.json','dist/.openai/hosting.json');
