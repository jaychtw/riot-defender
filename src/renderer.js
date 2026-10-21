import {CHAPTER,CENTER,P,mod,pointAt} from './simulation.js';
export class Renderer{
 constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;}
 perimeterPath(from,to){const c=this.ctx;c.beginPath();let q=pointAt(from);c.moveTo(q.x,q.y);for(let s=(Math.floor(from/CHAPTER.side)+1)*CHAPTER.side;s<to;s+=CHAPTER.side){q=pointAt(s);c.lineTo(q.x,q.y);}q=pointAt(to);c.lineTo(q.x,q.y);}
 draw(game){
 const c=this.ctx,{x,y,side:L,gateWidth:g}=CHAPTER;
 c.clearRect(0,0,900,760);c.fillStyle='#e7e9df';c.fillRect(0,0,900,760);
 c.strokeStyle='#d7dbcf';c.lineWidth=.7;
 c.beginPath();for(let i=0;i<900;i+=30){c.moveTo(i,0);c.lineTo(i,760);}for(let i=10;i<760;i+=30){c.moveTo(0,i);c.lineTo(900,i);}c.stroke();
 c.fillStyle='#53674710';c.fillRect(x-6,y-6,L+12,L+12);
 c.fillStyle='#f2efe3';c.fillRect(x,y,L,L);
 c.strokeStyle='#d9dac9';c.lineWidth=.8;c.strokeRect(x+13,y+13,L-26,L-26);
 // Four modest approach markers, outside the collision geometry.
 c.strokeStyle='#a9b49a';c.lineWidth=1;
 for(const s of [L*.5,L*1.5,L*2.5,L*3.5]){const p=pointAt(s,24),q=pointAt(s,35);c.beginPath();c.moveTo(p.x,p.y);c.lineTo(q.x,q.y);c.stroke();}
 const gate=game?.gate??2.5*L;
 const begin=mod(gate+g/2),end=begin+P-g;
 c.lineCap='butt';c.strokeStyle='#71816b';c.lineWidth=3;this.perimeterPath(begin,end);c.stroke();
 c.strokeStyle='#faf9ee';c.lineWidth=1;this.perimeterPath(begin,end);c.stroke();
 c.strokeStyle='#9cbd76';c.lineWidth=9;c.globalAlpha=.19;this.perimeterPath(gate-g/2,gate+g/2);c.stroke();c.globalAlpha=1;
 c.strokeStyle='#7fa154';c.lineWidth=3;c.setLineDash([4,6]);this.perimeterPath(gate-g/2+4,gate+g/2-4);c.stroke();c.setLineDash([]);
 for(const s of [gate-g/2,gate+g/2]){const p=pointAt(s);c.fillStyle='#759a51';c.fillRect(p.x-4,p.y-4,8,8);c.strokeStyle='#eaf0dc';c.lineWidth=1;c.strokeRect(p.x-4,p.y-4,8,8);}
 const gateLabel=pointAt(gate,28);c.font='600 7px Arial';c.textAlign='center';c.fillStyle='#718164';c.fillText('G A T E',gateLabel.x,gateLabel.y+3);
 if(!game){
  const samples=[['blue',L*2.49,40],['blue',L*2.68,90],['blue',L*.6,45],['blue',L*1.7,68],['red',L*.33,79],['red',L*1.34,61],['red',L*3.5,88],['red',L*3.73,30]];
  for(const [type,s,d]of samples)this.unit({type,...pointAt(s,d),state:'approach'});
  return;
 }
 for(const u of game.units)this.unit(u);
 for(const b of game.beams){c.globalAlpha=this.reduced?.35:b.life/b.maxLife;c.strokeStyle=game.phase==='finale'?'#d8b250':'#98af76';c.lineWidth=game.phase==='finale'?1.8:1;c.beginPath();c.moveTo(CENTER.x,CENTER.y);c.lineTo(b.x,b.y);c.stroke();}
 c.globalAlpha=1;
 for(const e of game.effects){
  if(this.reduced)continue;
  const t=1-e.life/e.maxLife;c.globalAlpha=1-t;c.strokeStyle=e.kind==='hit'?'#c88b70':e.kind==='recruit'?'#72a6bf':'#8daa69';c.lineWidth=1.3;c.beginPath();c.arc(e.x,e.y,4+t*(e.kind==='recruit'?26:15),0,Math.PI*2);c.stroke();
 }c.globalAlpha=1;
 if(game.breach){const p=pointAt(game.breach.s);c.fillStyle='#c65d4a';c.beginPath();c.arc(p.x,p.y,10,0,Math.PI*2);c.fill();c.strokeStyle='#c65d4a';c.lineWidth=2;c.beginPath();c.arc(p.x,p.y,19,0,Math.PI*2);c.stroke();c.fillStyle='#fff6e3';c.font='bold 14px Arial';c.fillText('!',p.x,p.y+5);}
 if(game.phase==='finale')this.cavalry(game.finaleTime);
 }
 unit(u){const c=this.ctx;c.fillStyle='#30483519';c.beginPath();c.ellipse(u.x+1,u.y+4,6,3,0,0,Math.PI*2);c.fill();c.beginPath();c.arc(u.x,u.y,5,0,Math.PI*2);c.fillStyle=u.type==='blue'?'#5a94b7':'#c26452';c.fill();c.lineWidth=u.type==='blue'?1.7:1;c.strokeStyle=u.type==='blue'?'#f6fbf8':'#a84f41';c.stroke();if(u.type==='blue'){c.fillStyle='#e2f0f3';c.beginPath();c.arc(u.x,u.y,1.2,0,Math.PI*2);c.fill();}if(u.state==='waiting'){c.strokeStyle='#6795a17a';c.lineWidth=1;c.beginPath();c.arc(u.x,u.y,8,0,Math.PI*2);c.stroke();}}
 cavalry(t){const c=this.ctx;const progress=Math.min(1,t/2.6);c.save();
  c.fillStyle='#9f945d';c.font='600 12px Arial';c.textAlign='center';c.fillText('R E I N F O R C E M E N T S   A R R I V I N G',450,77);
  for(let i=0;i<3;i++){
   const px=this.reduced?360+i*90:-120+progress*1150-i*85,py=94+(i%2)*30;c.save();c.translate(px,py);c.fillStyle='#53664c';c.beginPath();c.ellipse(0,0,16,7,0,0,Math.PI*2);c.fill();c.fillRect(-33,-2,23,3);c.fillRect(-34,-8,3,10);c.strokeStyle='#53664c';c.lineWidth=2;c.beginPath();c.moveTo(-10,11);c.lineTo(13,11);c.moveTo(-7,8);c.lineTo(-7,11);c.moveTo(9,7);c.lineTo(9,11);c.moveTo(0,-6);c.lineTo(0,-11);c.moveTo(-23,-11);c.lineTo(23,-11);c.stroke();c.fillStyle='#b6c9ac';c.fillRect(4,-4,8,5);c.restore();
  }c.restore();
 }
}
