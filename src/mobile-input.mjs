// Pure input math, shared by mouse/touch adapters and deterministic tests.
export function stickVector(dx, dy, radius=58, deadzone=.12) {
  const length=Math.hypot(dx,dy), magnitude=Math.min(1,length/radius);
  if(magnitude<=deadzone)return {x:0,y:0};
  const scaled=(magnitude-deadzone)/(1-deadzone);
  return {x:dx/length*scaled,y:(-dy/length*scaled)||0};
}
export function lookDelta(dx,dy,sensitivity=1) {
  const gain=Math.max(.4,Math.min(2,Number(sensitivity)||1));
  return {yaw:-dx*.005*gain,pitch:-dy*.004*gain};
}
export function pixelRatio(quality,dpr,touch) {
  return Math.min(dpr,quality==='battery'?1:quality==='high'?1.75:touch?1.25:1.6);
}
