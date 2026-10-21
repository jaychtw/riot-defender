// Screen coordinates run clockwise. All distances and gate widths use arena units.
export const CENTER = Object.freeze({x:450,y:380});
export const wrap = (n, length) => (n % length + length) % length;
const EPS = 1e-8;
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const dot = (a,b) => a.x*b.x+a.y*b.y;
const sub = (a,b) => ({x:a.x-b.x,y:a.y-b.y});

export const PERIMETER_IDS = Object.freeze(['square','rectangle','octagon','irregular','circle']);
const definitions = {
 square:{vertices:[[205,135],[695,135],[695,625],[205,625]],artBox:{x:215,y:240,width:470,height:280}},
 rectangle:{vertices:[[145,185],[755,185],[755,575],[145,575]],artBox:{x:175,y:240,width:550,height:280}},
 octagon:{vertices:[[310,135],[590,135],[695,275],[695,485],[590,625],[310,625],[205,485],[205,275]],artBox:{x:240,y:260,width:420,height:240}},
 irregular:{vertices:[[260,135],[590,135],[590,180],[695,180],[695,500],[660,500],[660,625],[245,625],[245,570],[205,570],[205,245],[260,245]],artBox:{x:225,y:255,width:450,height:240}},
 circle:{radius:245,artBox:{x:240,y:260,width:420,height:240}},
};

function circleEntry(a,b,center,radius) {
 const d=sub(b,a),v=sub(a,center),A=dot(d,d),B=2*dot(v,d),C=dot(v,v)-radius*radius;
 const discriminant=B*B-4*A*C;
 if(A<EPS || discriminant < -EPS) return null;
 const t=(-B-Math.sqrt(Math.max(0,discriminant)))/(2*A);
 if(t < -EPS || t > 1+EPS) return null;
 const time=clamp(t,0,1),p={x:a.x+d.x*time,y:a.y+d.y*time};
 return dot(sub(p,center),d)<EPS ? {t:time,p} : null;
}

export class ClosedPerimeter {
 constructor(id) {
  const definition=Object.hasOwn(definitions,id)?definitions[id]:null;
  if(!definition)throw new Error('Unsupported perimeter: '+id);
  this.id=id;this.center=CENTER;this.radius=definition.radius;
  this.artBox=Object.freeze(definition.artBox);
  this.vertices=definition.vertices?.map(([x,y])=>Object.freeze({x,y}));
  this.edges=[];let length=0;
  if(this.vertices)for(let i=0;i<this.vertices.length;i++){
   const a=this.vertices[i],b=this.vertices[(i+1)%this.vertices.length],dx=b.x-a.x,dy=b.y-a.y,l=Math.hypot(dx,dy);
   this.edges.push({a,b,dx,dy,length:l,start:length,normal:{x:dy/l,y:-dx/l}});length+=l;
  }
  this.length=this.radius ? Math.PI*2*this.radius : length;
  this.concave=this.edges.some((edge,i)=>{const next=this.edges[(i+1)%this.edges.length];return edge.dx*next.dy-edge.dy*next.dx<0;});
  this.initialS=this.project({x:450,y:760}).s;
 }
 normalize(s){return wrap(s,this.length);}
 at(s){
  s=this.normalize(s);
  if(this.radius){const angle=s/this.radius-Math.PI/2;const normal={x:Math.cos(angle),y:Math.sin(angle)};return {x:CENTER.x+normal.x*this.radius,y:CENTER.y+normal.y*this.radius,normal};}
  const edge=this.edges.find(e=>s<e.start+e.length)??this.edges[0],t=(s-edge.start)/edge.length;
  return {x:edge.a.x+edge.dx*t,y:edge.a.y+edge.dy*t,normal:edge.normal};
 }
 pointAt(s,offset=0){
  const q=this.at(s),p={x:q.x+q.normal.x*offset,y:q.y+q.normal.y*offset};
  // The outside offset trims re-entrant corners. Never put a following/spawned
  // dot through an adjacent step; keep its arc progress independent of projection.
  if(offset>0 && this.concave)for(let i=0;i<8;i++){
   const contact=this.project(p);
   if(!this.contains(p)&&contact.distance>=offset-EPS)break;
   const sign=this.contains(p)?-1:1;
   const dx=p.x-contact.x,dy=p.y-contact.y,l=Math.hypot(dx,dy);
   const n=l>EPS?{x:dx/l*sign,y:dy/l*sign}:contact.normal;
   p.x=contact.x+n.x*(offset+EPS);p.y=contact.y+n.y*(offset+EPS);
  }
  return p;
 }
 segmentProjection(p,edge){
  const t=clamp(((p.x-edge.a.x)*edge.dx+(p.y-edge.a.y)*edge.dy)/(edge.length*edge.length),0,1);
  const x=edge.a.x+t*edge.dx,y=edge.a.y+t*edge.dy;
  return {x,y,s:this.normalize(edge.start+t*edge.length),distance:Math.hypot(p.x-x,p.y-y),normal:edge.normal};
 }
 project(p){
  if(this.radius){const dx=p.x-CENTER.x,dy=p.y-CENTER.y,angle=Math.atan2(dy,dx),normal={x:Math.cos(angle),y:Math.sin(angle)};
   return {x:CENTER.x+normal.x*this.radius,y:CENTER.y+normal.y*this.radius,s:this.normalize((angle+Math.PI/2)*this.radius),distance:Math.abs(Math.hypot(dx,dy)-this.radius),normal};}
  let best=null;
  for(const edge of this.edges){const candidate=this.segmentProjection(p,edge);if(!best||candidate.distance<best.distance-EPS)best=candidate;}
  return best;
 }
 distance(p){return this.project(p).distance;}
 contains(p){
  if(this.radius)return Math.hypot(p.x-CENTER.x,p.y-CENTER.y)<=this.radius+EPS;
  let inside=false;
  for(const {a,b} of this.edges)if((a.y>p.y)!==(b.y>p.y) && p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)inside=!inside;
  return inside;
 }
 contacts(p,radius=5){
  if(this.radius){const q=this.project(p);return q.distance<=radius+1e-6?[q]:[];}
  return this.edges.map(edge=>this.segmentProjection(p,edge)).filter(q=>q.distance<=radius+1e-6);
 }
 isOpen(s,gate,width=98){return Math.abs(this.normalize(s-gate+this.length/2)-this.length/2)<=width/2+EPS;}
 sweptOpen(s,start,delta,width=98){
  if(delta<0){start+=delta;delta=-delta;}
  return delta>=this.length-width || this.normalize(s-(start-width/2))<=delta+width+EPS;
 }
 contact(a,b,radius=5){
  if(this.radius){const hit=circleEntry(a,b,CENTER,this.radius+radius);return hit?{t:hit.t,s:this.project(hit.p).s}:null;}
  const d=sub(b,a),hits=[];
  for(const edge of this.edges){
   const da=dot(sub(a,edge.a),edge.normal),velocity=dot(d,edge.normal);
   if(da>=radius-EPS && velocity<-EPS){
    const t=(radius-da)/velocity;
    if(t>=-EPS&&t<=1+EPS){
     const p={x:a.x+d.x*t-edge.normal.x*radius,y:a.y+d.y*t-edge.normal.y*radius};
     const along=((p.x-edge.a.x)*edge.dx+(p.y-edge.a.y)*edge.dy)/edge.length;
     if(along>=-EPS&&along<=edge.length+EPS)hits.push({t:clamp(t,0,1),s:this.normalize(edge.start+clamp(along,0,edge.length))});
    }
   }
   const hit=circleEntry(a,b,edge.a,radius);
   if(hit&&!this.contains(hit.p))hits.push({t:hit.t,s:edge.start});
  }
  return hits.sort((a,b)=>a.t-b.t)[0]??null;
 }
 // Trace one continuous arc, including every intervening vertex and wrap.
 trace(ctx,from=0,to=this.length){
  const p=this.at(from);ctx.moveTo(p.x,p.y);
  if(this.radius){ctx.arc(CENTER.x,CENTER.y,this.radius,from/this.radius-Math.PI/2,to/this.radius-Math.PI/2);return;}
  for(let cycle=Math.floor(from/this.length);cycle<=Math.floor(to/this.length);cycle++)for(const edge of this.edges){
   const s=cycle*this.length+edge.start;
   if(s>from+EPS&&s<to-EPS)ctx.lineTo(edge.a.x,edge.a.y);
  }
  const q=this.at(to);ctx.lineTo(q.x,q.y);
 }
}
const instances=new Map();
export function getPerimeter(id='square'){
 if(!instances.has(id))instances.set(id,new ClosedPerimeter(id));
 return instances.get(id);
}
