// Keep every level accessible through the game's main URL.
if(new URLSearchParams(location.search).get('mission')==='first-response'){
 document.title='Unsung Heroes — Level 08: First Response';
 document.body.replaceChildren();
 Object.assign(document.body.style,{margin:'0',height:'100dvh',overflow:'hidden'});
 const frame=document.createElement('iframe');
 frame.title='Level 08 — First Response';
 frame.src='response.html?embedded=1&v=18';
 Object.assign(frame.style,{width:'100%',height:'100%',border:'0',display:'block'});
 document.body.append(frame);
}else{
 import('./interior.js?v=18');
}
