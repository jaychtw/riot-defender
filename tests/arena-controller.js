// A legal controller: reads state and emits only held direction / Switch inputs.
import {CHAPTER} from '../src/simulation.js';
export function chooseControl(g,path){
 const L=path.length,mod=s=>path.normalize(s),distance=s=>Math.abs(mod(s-g.gate+L/2)-L/2);
 const reds=g.units.filter(u=>u.type==='red'&&path.distance(u)<38);
 const safe=s=>!reds.some(u=>path.isOpen(path.project(u).s,s,CHAPTER.gateWidth+50));
 let target=g.gate;
 if(g.duration-g.remaining>6){const candidate=g.units.filter(u=>u.type==='blue'&&u.state!=='inside').map(u=>path.project(u).s).filter(safe).sort((a,b)=>distance(a)-distance(b))[0];if(candidate!==undefined)target=candidate;}
 if(!safe(g.gate)){
  if(safe(mod(g.gate+L/2)))return {teleport:true,direction:0};
  const s=Array.from({length:40},(_,i)=>i*L/40).find(safe);if(s!==undefined)target=s;
 }
 const diff=mod(target-g.gate+L/2)-L/2;
 let direction=Math.abs(diff)<4?0:Math.sign(diff);
 if(reds.some(u=>path.distance(u)<=CHAPTER.radius+.001&&path.sweptOpen(path.project(u).s,g.gate,direction*CHAPTER.gateSpeed*.05)))direction=0;
 return {teleport:false,direction};
}
