import fs from 'node:fs/promises';
import {CHAPTERS} from '../src/chapters/index.js';
await fs.mkdir('dist/artwork',{recursive:true});
for(const chapter of Object.values(CHAPTERS))await fs.writeFile('dist/artwork/'+chapter.id+'.svg',chapter.artwork());
console.log('Exported five original standalone SVG illustrations.');
