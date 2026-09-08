const cursor=document.querySelector('.cursor');
const fine=matchMedia('(pointer:fine)').matches;
const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;

if(fine&&!reduced){
  let x=-40,y=-40,cx=x,cy=y;
  onmousemove=e=>{x=e.clientX;y=e.clientY};
  (function move(){cx+=(x-cx)*.16;cy+=(y-cy)*.16;cursor.style.transform=`translate(${cx-17}px,${cy-17}px)`;requestAnimationFrame(move)})();
  document.querySelectorAll('a,button,label').forEach(e=>{e.onmouseenter=()=>cursor.classList.add('active');e.onmouseleave=()=>cursor.classList.remove('active')});
  document.querySelector('.video').onmouseenter=()=>cursor.classList.add('play');
  document.querySelector('.video').onmouseleave=()=>cursor.classList.remove('play');
}

document.querySelectorAll('.service-toggle').forEach(toggle=>{
  toggle.addEventListener('click',()=>{
    const opening=toggle.getAttribute('aria-expanded')!=='true';
    document.querySelectorAll('.service-toggle').forEach(other=>{
      other.setAttribute('aria-expanded','false');
      document.getElementById(other.getAttribute('aria-controls')).classList.remove('open');
    });
    if(opening){
      toggle.setAttribute('aria-expanded','true');
      document.getElementById(toggle.getAttribute('aria-controls')).classList.add('open');
    }
  });
});

const FRAME_COUNT=66;
const frameCache={};
const frameUrl=(prefix,n)=>`media/sequence/${prefix}-${String(n).padStart(2,'0')}.webp`;
function imageFor(src){
  if(!frameCache[src]){const image=new Image();image.decoding='async';image.src=src;frameCache[src]=image}
  return frameCache[src];
}

const story=document.querySelector('.scrub-story');
if(story){
  const prefixes=story.dataset.prefixes.split(',');
  const canvasA=story.querySelector('.story-a'),canvasB=story.querySelector('.story-b');
  const ctxA=canvasA.getContext('2d',{alpha:false}),ctxB=canvasB.getContext('2d',{alpha:false});
  const copies=[...story.querySelectorAll('.story-copy')];
  const progress=story.querySelector('.story-progress span');
  let state={chapter:0,local:0,fade:0},queued=false,preloaded=false;

  function drawCover(ctx,canvas,image){
    if(!image.complete||!image.naturalWidth)return false;
    const scale=Math.max(canvas.width/image.naturalWidth,canvas.height/image.naturalHeight);
    const width=image.naturalWidth*scale,height=image.naturalHeight*scale;
    ctx.drawImage(image,(canvas.width-width)/2,(canvas.height-height)/2,width,height);
    return true;
  }
  function render(){
    const {chapter,local,fade}=state;
    const frame=Math.min(FRAME_COUNT,Math.max(1,Math.round(local*(FRAME_COUNT-1))+1));
    const current=imageFor(frameUrl(prefixes[chapter],frame));
    if(!drawCover(ctxA,canvasA,current))current.addEventListener('load',render,{once:true});
    if(chapter<prefixes.length-1){
      const next=imageFor(frameUrl(prefixes[chapter+1],1));
      if(!drawCover(ctxB,canvasB,next))next.addEventListener('load',render,{once:true});
      canvasB.style.opacity=fade.toFixed(3);
    }else canvasB.style.opacity='0';
  }
  function resize(){
    const ratio=Math.min(devicePixelRatio||1,1.5);
    [canvasA,canvasB].forEach(canvas=>{canvas.width=Math.round(innerWidth*ratio);canvas.height=Math.round(innerHeight*ratio)});
    render();
  }
  function update(){
    queued=false;
    const rect=story.getBoundingClientRect();
    const range=Math.max(1,story.offsetHeight-innerHeight);
    const total=Math.max(0,Math.min(1,-rect.top/range));
    const position=Math.min(prefixes.length-.0001,total*prefixes.length);
    const chapter=Math.floor(position),local=position-chapter;
    const t=Math.max(0,Math.min(1,(local-.80)/.20));
    const fade=chapter<prefixes.length-1?t*t*(3-2*t):0;
    state={chapter,local,fade};
    copies.forEach((copy,index)=>copy.classList.toggle('active',index===chapter));
    progress.style.height=`${total*100}%`;
    render();
    [-3,-2,-1,1,2,3].forEach(offset=>{
      const frame=Math.round(local*(FRAME_COUNT-1))+1+offset;
      if(frame>0&&frame<=FRAME_COUNT)imageFor(frameUrl(prefixes[chapter],frame));
    });
  }
  const firstFrame=imageFor(frameUrl(prefixes[0],1));
  if(firstFrame.complete)resize();else firstFrame.addEventListener('load',resize,{once:true});
  addEventListener('resize',resize,{passive:true});
  addEventListener('scroll',()=>{if(!queued){queued=true;requestAnimationFrame(update)}},{passive:true});
  new IntersectionObserver(entries=>{
    if(entries[0].isIntersecting&&!preloaded){
      preloaded=true;
      const preload=()=>prefixes.forEach(prefix=>{for(let n=1;n<=FRAME_COUNT;n++)imageFor(frameUrl(prefix,n))});
      'requestIdleCallback'in window?requestIdleCallback(preload,{timeout:1800}):setTimeout(preload,400);
    }
  },{rootMargin:'100% 0px'}).observe(story);
  update();
}

const cases={
  1:{front:'media/case-1-front.png',side:'media/case-1-side.png',back:'media/case-1-back.png'},
  2:{front:'media/case-2-front.png',side:'media/case-2-side.png',back:'media/case-2-back.png'}
};
const angleNames={front:'ÖN',side:'YAN',back:'ARKA'};
const caseImage=document.querySelector('#caseImage');
let selectedCase='1',selectedAngle='side';
function updateCase(){
  const view=caseImage.closest('.case-view');
  view.classList.add('loading');
  const next=new Image();
  next.onload=()=>{
    caseImage.src=next.src;
    caseImage.alt=`${selectedCase==='1'?'Birinci':'İkinci'} saç uygulamasının ${angleNames[selectedAngle].toLocaleLowerCase('tr-TR')} önce ve sonra görünümü`;
    document.querySelector('#caseCaption').textContent=`UYGULAMA 0${selectedCase} · ${angleNames[selectedAngle]} GÖRÜNÜM`;
    view.classList.remove('loading');
  };
  next.src=cases[selectedCase][selectedAngle];
}
document.querySelectorAll('[data-case]').forEach(button=>button.onclick=()=>{
  selectedCase=button.dataset.case;
  document.querySelectorAll('[data-case]').forEach(item=>{const active=item===button;item.classList.toggle('active',active);item.setAttribute('aria-selected',active)});
  updateCase();
});
document.querySelectorAll('[data-angle]').forEach(button=>button.onclick=()=>{
  selectedAngle=button.dataset.angle;
  document.querySelectorAll('[data-angle]').forEach(item=>item.classList.toggle('active',item===button));
  updateCase();
});

const full=document.querySelector('.video video'),play=document.querySelector('.play');
play.onclick=()=>full.play();full.onplay=()=>play.hidden=true;full.onpause=()=>play.hidden=false;

const booking=document.querySelector('#booking'),notice=document.querySelector('#notice'),map=document.querySelector('#mapDialog');
const bookChecks=[...booking.querySelectorAll('input')],bookSend=document.querySelector('#bookSend');
function openModal(modal){modal.hidden=false;document.body.classList.add('modal-open')}
function closeModal(modal){modal.hidden=true;if(!document.querySelector('.modal:not([hidden])'))document.body.classList.remove('modal-open')}
document.querySelectorAll('[data-book]').forEach(element=>element.onclick=()=>openModal(booking));
bookChecks.forEach(check=>check.onchange=()=>bookSend.disabled=!bookChecks.some(item=>item.checked));
bookSend.onclick=()=>{closeModal(booking);openModal(notice)};
document.querySelectorAll('[data-demo]').forEach(element=>element.onclick=event=>{event.preventDefault();openModal(notice)});
document.querySelector('#mapOpen').onclick=()=>{const iframe=map.querySelector('iframe');if(!iframe.getAttribute('src'))iframe.src=iframe.dataset.src;openModal(map)};
document.querySelectorAll('.modal').forEach(modal=>{modal.querySelector('.x').onclick=()=>closeModal(modal);modal.addEventListener('click',event=>{if(event.target===modal)closeModal(modal)})});
document.querySelector('.ok').onclick=()=>closeModal(notice);
addEventListener('keydown',event=>{if(event.key==='Escape'){const open=document.querySelector('.modal:not([hidden])');if(open)closeModal(open)}});
