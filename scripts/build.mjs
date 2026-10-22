import {rm,mkdir,cp,copyFile} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});
await mkdir('dist/.openai',{recursive:true});
await cp('public','dist',{recursive:true});
await copyFile('.openai/hosting.json','dist/.openai/hosting.json');
console.log('Demonstração frontend preparada em dist/.');
