export const GRID=80, COLS=7, ROWS=8, ROAD=28, LIMIT=100;
export const DEST={x:(COLS-1)*GRID,z:(ROWS-1)*GRID};
export const district=z=>z<160?'DOCKSIDE':z<320?'OLD TOWN':z<480?'MARKET DISTRICT':'RIVERSIDE';
export const GATE={x:80,z:360};
export const gateState=t=>{const phase=t%16;return {closed:phase<5,wait:phase<5?5-phase:0};};
// Roadworks block complete road segments. The GPS routes around them.
export const CLOSURES=[{a:[1,0],b:[2,0]},{a:[1,2],b:[1,3]},{a:[2,3],b:[3,3]}];
// Three construction corridors leave staggered crossings, requiring real detours.
for(const [row,gap]of [[2,3],[4,1],[6,5]])for(let x=0;x<COLS;x++)if(x!==gap)CLOSURES.push({a:[x,row],b:[x,row+1]});
const id=([x,z])=>`${x},${z}`;
export function blocked(a,b){return CLOSURES.some(e=>id(e.a)===id(a)&&id(e.b)===id(b)||id(e.a)===id(b)&&id(e.b)===id(a));}
function routeFrom(x,z){
 const start=[Math.max(0,Math.min(COLS-1,Math.round(x/GRID))),Math.max(0,Math.min(ROWS-1,Math.round(z/GRID)))],goal=[COLS-1,ROWS-1];
 const q=[start],prev=new Map([[id(start),null]]);
 for(let n=0;n<q.length;n++){const p=q[n];if(id(p)===id(goal))break;for(const [dx,dz]of[[1,0],[0,1],[-1,0],[0,-1]]){const v=[p[0]+dx,p[1]+dz];if(v[0]<0||v[0]>=COLS||v[1]<0||v[1]>=ROWS||blocked(p,v)||prev.has(id(v)))continue;prev.set(id(v),p);q.push(v);}}
 const out=[];for(let p=goal;p;p=prev.get(id(p)))out.unshift({x:p[0]*GRID,z:p[1]*GRID});return out;
}
// Choose a reachable junction on the current road, then the shortest open route.
// This avoids asking the driver to turn into a city block between junctions.
export function route(x,z){
 const candidates=[];
 const gx=Math.round(x/GRID),gz=Math.round(z/GRID);
 if(Math.abs(x-gx*GRID)<ROAD/2)for(const k of [Math.floor(z/GRID),Math.ceil(z/GRID)])candidates.push([gx,k]);
 if(Math.abs(z-gz*GRID)<ROAD/2)for(const k of [Math.floor(x/GRID),Math.ceil(x/GRID)])candidates.push([k,gz]);
 let best=null,cost=Infinity;
 for(const [a,b]of candidates){if(a<0||a>=COLS||b<0||b>=ROWS)continue;
  const nx=a*GRID,nz=b*GRID;
  const crosses=CLOSURES.some(e=>{const cx=(e.a[0]+e.b[0])*GRID/2,cz=(e.a[1]+e.b[1])*GRID/2;return Math.abs(x-nx)<12?Math.abs(x-cx)<12&&cz>Math.min(z,nz)&&cz<Math.max(z,nz):Math.abs(z-cz)<12&&cx>Math.min(x,nx)&&cx<Math.max(x,nx);});
  if(crosses)continue;const path=routeFrom(nx,nz),length=Math.hypot(nx-x,nz-z)+(path.length-1)*GRID;
  if(length<cost){cost=length;best=path;}
 }
 return best??routeFrom(x,z);
}
// Cars stay on their road segments and alternate lanes. Positions are deterministic
// so the difficulty can be reproduced and the complete route tested.
const trafficSegments=[];
for(let x=0;x<COLS;x++)for(let z=1;z<ROWS;z++)for(const [dx,dz]of [[1,0],[0,1]]){const a=[x,z],b=[x+dx,z+dz];if(b[0]<COLS&&b[1]<ROWS&&!blocked(a,b)&&!(x===1&&z===4&&dz===1))trafficSegments.push({a,b});}
export function trafficAt(t){return Array.from({length:18},(_,i)=>{
 const {a,b}=trafficSegments[(i*13+7)%trafficSegments.length],phase=t*(.32+(i%3)*.06)+i*1.7,travel=27*Math.sin(phase),direction=Math.cos(phase)>=0?1:-1,vertical=a[0]===b[0];
 return {x:(a[0]+b[0])*GRID/2+(vertical?4*direction:travel),z:(a[1]+b[1])*GRID/2+(vertical?travel:-4*direction),angle:vertical?(direction>0?0:Math.PI):(direction>0?Math.PI/2:-Math.PI/2)};
});}
export function drivable(x,z){if(x < -(ROAD/2-2)||x>DEST.x+ROAD/2-2||z < -(ROAD/2-2)||z>DEST.z+ROAD/2-2)return false;const near=v=>Math.abs(v-Math.round(v/GRID)*GRID)<ROAD/2-2;return near(x)||near(z);}
export function collision(x,z,t){if(!drivable(x,z))return 'Building or kerb';for(const e of CLOSURES){const cx=(e.a[0]+e.b[0])*GRID/2,cz=(e.a[1]+e.b[1])*GRID/2;if(Math.abs(x-cx)<(e.a[0]===e.b[0]?ROAD/2+1:5)&&Math.abs(z-cz)<(e.a[0]===e.b[0]?5:ROAD/2+1))return 'Road closed — follow the GPS detour';}if(gateState(t).closed&&Math.abs(x-GATE.x)<ROAD/2+1&&Math.abs(z-GATE.z)<5)return 'Rail crossing closed — wait for green';if(trafficAt(t).some(c=>{const dx=x-c.x,dz=z-c.z;return Math.abs(dx*Math.sin(c.angle)+dz*Math.cos(c.angle))<7.5&&Math.abs(dx*Math.cos(c.angle)-dz*Math.sin(c.angle))<4.2;}))return 'Traffic collision — brake and steer clear';return null;}
export function createResponse(){return {x:0,z:0,angle:0,speed:0,time:LIMIT,elapsed:0,status:'station',collapse:0,hits:0,cooldown:0,warnings:[],message:'Station 04 · Night watch. Awaiting dispatch.',score:0};}
export function dispatch(s){if(s.status==='station'){s.status='briefing';s.message='STRUCTURE FIRE · Mariner House, 480 Riverside Avenue. Respond before structural failure.';}}
export function depart(s){if(s.status==='briefing'){s.time=LIMIT;s.elapsed=0;s.status='driving';s.message='Engine 04 responding. GPS has plotted a route around roadworks.';}}
export function stepResponse(s,k,dt){
 dt=Math.max(0,Math.min(.05,dt));if(s.status==='collapsing'){s.collapse+=dt;if(s.collapse>=5)s.status='lost';return;}if(s.status!=='driving')return;
 s.time=Math.max(0,s.time-dt);s.elapsed+=dt;for(const [at,note]of [[75,'Dispatch: traffic building through Old Town. Follow the cyan detour.'],[45,'Dispatch: roof weakening. Keep moving toward Riverside.'],[20,'Urgent: twenty seconds to structural failure.']])if(s.time<=at&&!s.warnings.includes(at)){s.warnings.push(at);s.message=note;}s.cooldown=Math.max(0,s.cooldown-dt);
 if(s.time<=0){s.status='collapsing';s.speed=0;s.message='STRUCTURAL FAILURE · Building collapsing';return;}
 const throttle=k.forward?1:k.reverse?-1:0;
 s.speed+=throttle*18*dt;if(!throttle)s.speed*=Math.exp(-1.5*dt);if(k.brake)s.speed*=Math.exp(-8*dt);
 s.speed=Math.max(-10,Math.min(32,s.speed));
 const steer=(k.right?1:0)-(k.left?1:0);
 s.angle+=steer*1.65*dt*Math.min(1,Math.abs(s.speed)/7)*Math.sign(s.speed);
 const x=s.x+Math.sin(s.angle)*s.speed*dt,z=s.z+Math.cos(s.angle)*s.speed*dt;
 const hit=collision(x,z,s.elapsed);
 if(hit){s.speed=-s.speed*.25;if(!s.cooldown){s.hits++;s.cooldown=1.4;s.message=hit+' · impact slows the truck';}}else{s.x=x;s.z=z;}
 if(Math.hypot(s.x-DEST.x,s.z-DEST.z)<12&&Math.abs(s.speed)<9){s.status='won';s.score=Math.max(100,Math.ceil(s.time)*20+1000-s.hits*75);s.message='Engine 04 on scene. Truck stopped in the response zone — deploy the rescue crew.';}
}
