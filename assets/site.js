
(function(){
var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// ord-for-ord overskrifter
document.querySelectorAll('h2.disp, blockquote.disp').forEach(function(h){
  var i=0;
  Array.prototype.slice.call(h.childNodes).forEach(function(n){
    if(n.nodeType===3){
      var frag=document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach(function(part){
        if(!part)return;
        if(/^\s+$/.test(part)){frag.appendChild(document.createTextNode(part));return;}
        var w=document.createElement('span');w.className='w';w.textContent=part;w.style.transitionDelay=(i++*0.05)+'s';frag.appendChild(w);
      });
      h.replaceChild(frag,n);
    }else if(n.nodeType===1&&n.tagName!=='BR'){n.classList.add('w');n.style.transitionDelay=(i++*0.05)+'s';}
  });
  h.classList.add('split');
});
// stagger soeskende
var seen=new Set();
document.querySelectorAll('.reveal').forEach(function(el){
  var p=el.parentNode;if(seen.has(p))return;seen.add(p);
  var sib=Array.prototype.filter.call(p.children,function(c){return c.classList.contains('reveal');});
  if(sib.length>1)sib.forEach(function(c,k){c.dataset.delay=k*0.12;});
});
// count-up
function countUp(el){
  if(el.dataset.done)return;el.dataset.done=1;
  var m=el.textContent.match(/^(\D*)([\d.]+)(.*)$/);if(!m)return;
  var target=parseInt(m[2].replace(/\./g,''),10),t0=null,dur=1600;
  if(!target||reduce)return;
  function step(t){if(!t0)t0=t;var k=Math.min(1,(t-t0)/dur);var e=1-Math.pow(1-k,4);
    el.textContent=m[1]+Math.round(target*e).toLocaleString('da-DK')+m[3];if(k<1)requestAnimationFrame(step);}
  requestAnimationFrame(step);
}
// observer
var io=new IntersectionObserver(function(entries){
  entries.forEach(function(en){
    if(!en.isIntersecting)return;var el=en.target;
    var d=parseFloat(el.dataset.delay||0);
    if(d){el.style.transitionDelay=d+'s';setTimeout(function(){el.style.transitionDelay='';},d*1000+1100);}
    el.classList.add('is-in');
    el.querySelectorAll('.count').forEach(countUp);
    io.unobserve(el);
  });
},{threshold:0.15,rootMargin:'0px 0px -8% 0px'});
document.querySelectorAll('.reveal,.split,[data-io]').forEach(function(el){io.observe(el);});
if(!('IntersectionObserver' in window))document.querySelectorAll('.reveal,.split,[data-io]').forEach(function(el){el.classList.add('is-in');});

// scroll: progress, parallax, morkt band, marquee-skew
var prog=document.getElementById('progress'),par=document.querySelectorAll('[data-parallax]'),band=document.getElementById('funktioner')||document.querySelector('[data-band]'),marq=document.getElementById('marq');
var lastY=window.scrollY,skew=0,ticking=false;
function onScroll(){
  var y=window.scrollY,h=document.documentElement.scrollHeight-innerHeight;
  prog.style.transform='scaleX('+(h>0?y/h:0)+')';
  if(!reduce){
    par.forEach(function(el){el.style.setProperty('--py',(y*parseFloat(el.dataset.parallax))+'px');});
    if(band){var r=band.getBoundingClientRect(),k=Math.max(0,Math.min(1,(innerHeight-r.top)/(innerHeight*0.8)));
    var inset=(1-k)*6;band.style.clipPath='inset(0 '+inset+'% 0 '+inset+'% round 48px 48px 0 0)';}
    skew+=(Math.max(-12,Math.min(12,(y-lastY)*0.4))-skew)*0.3;
    if(marq)marq.style.transform='skewX('+(-skew)+'deg)';
  }
  lastY=y;ticking=false;
}
window.addEventListener('scroll',function(){if(!ticking){ticking=true;requestAnimationFrame(onScroll);}},{passive:true});
onScroll();
if(marq)setInterval(function(){if(Math.abs(skew)>0.05){skew*=0.8;marq.style.transform='skewX('+(-skew)+'deg)';}},50);



// WebGL grain-gradient baggrund (inspireret af paper-design GrainGradient, "corners")
(function(){
  var cv=document.getElementById('shader'),gl=cv.getContext('webgl',{antialias:false,alpha:false,premultipliedAlpha:false});
  if(!gl)return;
  var vs='attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  var fs='precision highp float;uniform vec2 r;uniform float t;uniform vec3 c0,c1,c2,c3;uniform float soft,inten,grain;\n'+
  'vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}vec2 mod289(vec2 x){return x-floor(x*(1./289.))*289.;}vec3 permute(vec3 x){return mod289(((x*34.)+1.)*x);}\n'+
  'float snoise(vec2 v){const vec4 C=vec4(.211324865405187,.366025403784439,-.577350269189626,.024390243902439);vec2 i=floor(v+dot(v,C.yy));vec2 x0=v-i+dot(i,C.xx);vec2 i1=(x0.x>x0.y)?vec2(1.,0.):vec2(0.,1.);vec4 x12=x0.xyxy+C.xxzz;x12.xy-=i1;i=mod289(i);vec3 p=permute(permute(i.y+vec3(0.,i1.y,1.))+i.x+vec3(0.,i1.x,1.));vec3 m=max(.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.);m=m*m;m=m*m;vec3 x=2.*fract(p*C.www)-1.;vec3 h=abs(x)-.5;vec3 ox=floor(x+.5);vec3 a0=x-ox;m*=1.79284291400159-.85373472095314*(a0*a0+h*h);vec3 g;g.x=a0.x*x0.x+h.x*x0.y;g.yz=a0.yz*x12.xz+h.yz*x12.yw;return 130.*dot(m,g);}\n'+
  'float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*snoise(p);p=p*2.03+vec2(7.1,3.3);a*=.5;}return v;}\n'+
  'float hash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}\n'+
  'void main(){vec2 uv=gl_FragCoord.xy/r;vec2 q=(gl_FragCoord.xy-.5*r)/min(r.x,r.y);float tt=t*.12;\n'+
  'float n=fbm(q*1.6+vec2(tt*.7,-tt*.5));float n2=fbm(q*2.2-vec2(tt*.4,tt*.6)+3.7);\n'+
  'vec2 w=q+vec2(n,n2)*.35;\n'+
  'vec2 p0=vec2(-.9,.75)+vec2(sin(tt*1.3),cos(tt*.9))*.25;vec2 p1=vec2(.95,-.8)+vec2(cos(tt*1.1),sin(tt*1.4))*.25;vec2 p2=vec2(.9,.8)+vec2(sin(tt*.8+2.),cos(tt*1.2+1.))*.3;vec2 p3=vec2(-.8,-.85)+vec2(cos(tt*1.5+1.),sin(tt*.7+3.))*.3;\n'+
  'float s=mix(.55,1.6,soft);\n'+
  'float w0=exp(-pow(length(w-p0),2.)/s);float w1=exp(-pow(length(w-p1),2.)/s);float w2=exp(-pow(length(w-p2),2.)/s)*.8;float w3=exp(-pow(length(w-p3),2.)/s)*.7;\n'+
  'vec3 col=c0;col=mix(col,c1,clamp(w0*inten*1.6,0.,1.));col=mix(col,c2,clamp(w1*inten*1.6,0.,1.));col=mix(col,c3,clamp(w2*inten*1.4,0.,1.));col=mix(col,mix(c1,c3,.5),clamp(w3*inten*1.3,0.,1.));\n'+
  'col=mix(col,c0,smoothstep(.1,.9,length(q)*.55-n*.15)*.35);\n'+
  'float g=(hash(gl_FragCoord.xy+fract(t)*vec2(17.,31.))-.5)*grain;col+=g;\n'+
  'gl_FragColor=vec4(col,1.);}';
  function sh(type,src){var o=gl.createShader(type);gl.shaderSource(o,src);gl.compileShader(o);if(!gl.getShaderParameter(o,gl.COMPILE_STATUS)){console.warn(gl.getShaderInfoLog(o));return null;}return o;}
  var v=sh(gl.VERTEX_SHADER,vs),f=sh(gl.FRAGMENT_SHADER,fs);if(!v||!f)return;
  var pr=gl.createProgram();gl.attachShader(pr,v);gl.attachShader(pr,f);gl.linkProgram(pr);if(!gl.getProgramParameter(pr,gl.LINK_STATUS))return;gl.useProgram(pr);
  var buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  var loc=gl.getAttribLocation(pr,'p');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
  var U=function(n){return gl.getUniformLocation(pr,n);};
  function hex(h){return [parseInt(h.slice(1,3),16)/255,parseInt(h.slice(3,5),16)/255,parseInt(h.slice(5,7),16)/255];}
  // farver: lys bund + orange / rav / fersken
  gl.uniform3fv(U('c0'),hex('#FFEEDB'));gl.uniform3fv(U('c1'),hex('#F26A1E'));gl.uniform3fv(U('c2'),hex('#FFA03A'));gl.uniform3fv(U('c3'),hex('#FFC27A'));
  gl.uniform1f(U('soft'),0.76);gl.uniform1f(U('inten'),0.62);gl.uniform1f(U('grain'),0.06);
  var ur=U('r'),ut=U('t'),dpr=Math.min(1.5,window.devicePixelRatio||1);
  function size(){cv.width=Math.floor(innerWidth*dpr*0.6);cv.height=Math.floor(innerHeight*dpr*0.6);gl.viewport(0,0,cv.width,cv.height);gl.uniform2f(ur,cv.width,cv.height);}
  window.addEventListener('resize',size);size();
  document.getElementById('bg').classList.add('gl');
  var start=performance.now(),paused=false;
  document.addEventListener('visibilitychange',function(){paused=document.hidden;if(!paused)frame();});
  function frame(){if(paused)return;gl.uniform1f(ut,(performance.now()-start)/1000);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);if(!reduce)requestAnimationFrame(frame);}
  frame();
})();
// levende baggrund: scroll-farveskift + cursor-glod
var bgEl=document.getElementById('bg'),cur=bgEl.querySelector('.cursor');
if(!reduce){
  window.addEventListener('mousemove',function(e){bgEl.classList.add('has-cursor');cur.style.transform='translate('+e.clientX+'px,'+e.clientY+'px)';},{passive:true});
  document.addEventListener('mouseleave',function(){bgEl.classList.remove('has-cursor');});
  window.addEventListener('scroll',function(){var k=window.scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight);
    bgEl.style.filter='hue-rotate('+(k*6)+'deg) saturate('+(1+k*0.15)+')';},{passive:true});
}


// header: skjul ved scroll ned, kompakt ved scroll, aktiv sektion, hover-pille
var hd=document.getElementById('hd'),hnav=document.getElementById('hdnav'),hpill=hnav.querySelector('.hd-pill'),hlinks=hnav.querySelectorAll('a'),lastHY=0;
function hdScroll(){var y=window.scrollY;hd.classList.toggle('scrolled',y>40);
  if(!document.body.classList.contains('menu-open')){hd.classList.toggle('hide',y>lastHY&&y>320);}lastHY=y;}
window.addEventListener('scroll',hdScroll,{passive:true});hdScroll();
hlinks.forEach(function(a){a.addEventListener('mouseenter',function(){hnav.classList.add('has-pill');hpill.style.left=a.offsetLeft+'px';hpill.style.width=a.offsetWidth+'px';});});
hnav.addEventListener('mouseleave',function(){hnav.classList.remove('has-pill');});
var secIO=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){hlinks.forEach(function(a){a.classList.toggle('active',a.dataset.sec===e.target.id);});}});},{rootMargin:'-40% 0px -55% 0px'});
['funktioner','saadan','priser','aura','faq'].forEach(function(id){var el=document.getElementById(id);if(el)secIO.observe(el);});
// mobil-menu
var burger=document.getElementById('burger'),mm=document.getElementById('mm');
function setMenu(open){document.body.classList.toggle('menu-open',open);burger.setAttribute('aria-expanded',open);burger.setAttribute('aria-label',open?'Luk menu':'Åbn menu');mm.setAttribute('aria-hidden',!open);if(open)hd.classList.remove('hide');}
burger.addEventListener('click',function(){setMenu(!document.body.classList.contains('menu-open'));});
mm.querySelectorAll('a').forEach(function(a){a.addEventListener('click',function(){setTimeout(function(){setMenu(false);},150);});});
document.addEventListener('keydown',function(e){if(e.key==='Escape')setMenu(false);});
window.addEventListener('resize',function(){if(innerWidth>900)setMenu(false);});

// footer-logo: fliser samles + lyser op omkring musen
var fb=document.getElementById('ftbig'),tiles=fb?fb.querySelectorAll('i'):[];
if(fb)new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting)fb.classList.add('is-in');});},{threshold:.2}).observe(fb);
if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
  var COLS=36,ROWS=21;
  if(fb)fb.addEventListener('mousemove',function(e){var r=fb.getBoundingClientRect(),cx=(e.clientX-r.left)/r.width*COLS,cy=(e.clientY-r.top)/r.height*ROWS;
    tiles.forEach(function(t,i){var dx=(i%COLS)+.5-cx,dy=Math.floor(i/COLS)+.5-cy;t.classList.toggle('hot',dx*dx+dy*dy<9);});});
  if(fb)fb.addEventListener('mouseleave',function(){tiles.forEach(function(t){t.classList.remove('hot');});});
}
// juridisk: aktiv sektion i indholdsfortegnelse + laesefremdrift
var lgtoc=document.getElementById('lgtoc');
if(lgtoc){var lgLinks=lgtoc.querySelectorAll('a'),lgSecs=document.querySelectorAll('.lg-sec'),lgp=document.getElementById('lgprog'),lgBody=document.querySelector('.lg-body');
  new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){lgLinks.forEach(function(a){a.classList.toggle('active',a.getAttribute('href')==='#'+e.target.id);});}});},{rootMargin:'-20% 0px -70% 0px'}).observe&&lgSecs.forEach(function(s){new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){lgLinks.forEach(function(a){a.classList.toggle('active',a.getAttribute('href')==='#'+e.target.id);});}});},{rootMargin:'-20% 0px -70% 0px'}).observe(s);});
  window.addEventListener('scroll',function(){var r=lgBody.getBoundingClientRect(),k=Math.max(0,Math.min(1,(innerHeight*0.5-r.top)/r.height));lgp.style.width=(k*100)+'%';},{passive:true});
}
// book intro: kvittering efter afsendelse
var biOk=document.getElementById('bi-success');
if(biOk&&/[?&]sent=1/.test(location.search)){biOk.hidden=false;setTimeout(function(){biOk.scrollIntoView({block:'center',behavior:'smooth'});},1800);}
// hero: rundvisning i scener
var hsc=document.getElementById('hscenes');
if(hsc){var hsTabs=hsc.querySelectorAll('.hs-tabs button'),hsScenes=hsc.querySelectorAll('.hs-scene'),hsBar=hsc.querySelector('.hs-bar'),hsI=0,hsT;
  function hsGo(i){hsI=i;hsTabs.forEach(function(b,k){b.classList.toggle('on',k===i);});hsScenes.forEach(function(s,k){s.classList.toggle('on',k===i);});
    var t=hsTabs[i];hsBar.style.left=t.offsetLeft+'px';hsBar.style.width=t.offsetWidth+'px';hsBar.style.animation='none';void hsBar.offsetWidth;hsBar.style.animation='';}
  function hsAuto(){clearInterval(hsT);if(!reduce)hsT=setInterval(function(){hsGo((hsI+1)%hsScenes.length);},5000);}
  hsTabs.forEach(function(b,k){b.addEventListener('click',function(){hsGo(k);hsAuto();});});
  setTimeout(function(){hsGo(0);},100);window.addEventListener('resize',function(){hsGo(hsI);});hsAuto();
  document.addEventListener('visibilitychange',function(){if(document.hidden)clearInterval(hsT);else hsAuto();});
}
// rundvisning: aktiv blok i sidemenu
var tnav=document.getElementById('tournav');
if(tnav){var tl=tnav.querySelectorAll('a'),tb=document.querySelectorAll('.tour-block'),tp=document.getElementById('tourprog'),tlist=document.querySelector('.tour-list');
  tb.forEach(function(s){new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){tl.forEach(function(a){a.classList.toggle('active',a.dataset.t===e.target.id);});}});},{rootMargin:'-30% 0px -60% 0px'}).observe(s);});
  window.addEventListener('scroll',function(){var r=tlist.getBoundingClientRect(),k=Math.max(0,Math.min(1,(innerHeight*0.5-r.top)/r.height));tp.style.width=(k*100)+'%';},{passive:true});
}
// brancher: skift eksempel
var indTabs=document.querySelectorAll('.ind-tab');
if(indTabs.length){var indPanes=document.querySelectorAll('.ind-pane');
  indTabs.forEach(function(t){t.addEventListener('click',function(){var k=t.dataset.ind;indTabs.forEach(function(x){x.classList.toggle('on',x===t);});
    indPanes.forEach(function(p){var on=p.dataset.ind===k;if(on&&!p.classList.contains('on')){p.classList.add('on');p.querySelectorAll('.ind-copy>*,.ind-pts li,.ind-scene').forEach(function(el){el.style.animation='none';void el.offsetWidth;el.style.animation='';});}else if(!on)p.classList.remove('on');});});});
}
// loader
var loader=document.getElementById('loader');
setTimeout(function(){if(loader)loader.classList.add('done');},1350);
setTimeout(function(){if(loader)loader.remove();},2400);
// ripple
document.querySelectorAll('.btn').forEach(function(b){b.addEventListener('click',function(e){var r=b.getBoundingClientRect(),d=Math.max(r.width,r.height),sp=document.createElement('span');
  sp.className='ripple';sp.style.width=sp.style.height=d+'px';sp.style.left=(e.clientX-r.left-d/2)+'px';sp.style.top=(e.clientY-r.top-d/2)+'px';b.appendChild(sp);setTimeout(function(){sp.remove();},700);});});
// 3D-tilt paa alle kort
if(!reduce){document.querySelectorAll('.card').forEach(function(c){
  c.addEventListener('mousemove',function(e){var r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
    c.classList.add('tilting');c.style.transform='perspective(900px) rotateY('+(x*6)+'deg) rotateX('+(-y*6)+'deg) translateY(-6px)';});
  c.addEventListener('mouseleave',function(){c.style.transform='';setTimeout(function(){c.classList.remove('tilting');},200);});});}
// sektioner fader ud naar de forlader skaermen
var secs=document.querySelectorAll('section');
window.addEventListener('scroll',function(){if(reduce)return;secs.forEach(function(sc){var r=sc.getBoundingClientRect();if(r.bottom<innerHeight*0.4&&r.bottom>0){sc.style.opacity=Math.max(.15,r.bottom/(innerHeight*0.4));}else sc.style.opacity='';});},{passive:true});
if(!reduce){
  // 3D-tilt paa hero-mockup
  var tilt=document.getElementById('tilt');
  if(tilt){tilt.addEventListener('mousemove',function(e){var r=tilt.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,yy=(e.clientY-r.top)/r.height-.5;
    tilt.style.transform='perspective(1200px) rotateY('+(x*8)+'deg) rotateX('+(-yy*8)+'deg)';});
  tilt.addEventListener('mouseleave',function(){tilt.style.transform='';});}
  // spotlight paa morke kort
  document.querySelectorAll('.spot').forEach(function(c){c.addEventListener('mousemove',function(e){var r=c.getBoundingClientRect();
    c.style.setProperty('--mx',(e.clientX-r.left)+'px');c.style.setProperty('--my',(e.clientY-r.top)+'px');});});
  // magnetiske knapper
  document.querySelectorAll('.magnet').forEach(function(b){
    b.addEventListener('mousemove',function(e){var r=b.getBoundingClientRect();b.style.translate=((e.clientX-r.left-r.width/2)*0.18)+'px '+((e.clientY-r.top-r.height/2)*0.25)+'px';});
    b.addEventListener('mouseleave',function(){b.style.translate='';});
  });
}
var sec=47;var timers=document.querySelectorAll('.js-timer');
setInterval(function(){sec++;var t=Math.floor(sec/60)+':'+String(sec%60).padStart(2,'0');timers.forEach(function(e){e.textContent=t;});},1000);
var chips=document.querySelectorAll('[data-status]'),st=0;
if(chips.length)setInterval(function(){chips[st].classList.remove('on');st=(st+1)%chips.length;chips[st].classList.add('on');},2200);
var tips=['Nævn at Google Ads-pakken starter ved 5.000 kr./md.','Kunden nævnte budget — spørg til tidshorisont.','Godt tidspunkt at foreslå et tilbud på mail.'],ti=0,tip=document.getElementById('tip');
if(tip)setInterval(function(){ti=(ti+1)%tips.length;tip.textContent=tips[ti];},4500);
// beregner
var r1=document.getElementById('r1'),r2=document.getElementById('r2'),r3=document.getElementById('r3');
function fmt(n){return Math.round(n).toLocaleString('da-DK');}
function set(id,v){document.getElementById('o-'+id).textContent=v;}
function calc(){var s=+r1.value,m=+r3.value,c=+r2.value,perSellerMonth=m*21/60,month=perSellerMonth*s,week=m*5*s/60;
set('sellers',s);set('admin',m);set('calls',c);set('hoursMonth',fmt(month));set('hoursWeek',fmt(week));set('perSeller',fmt(perSellerMonth));set('extraCalls',fmt(month*60/c));set('days',fmt(month/7.4));
var pct=Math.round(m/(7.4*60)*100);set('pct',pct);document.getElementById('o-bar').style.width=Math.max(3,pct)+'%';}
if(r1&&r2&&r3){[r1,r2,r3].forEach(function(r){r.addEventListener('input',calc);});calc();}
// priser
var a=document.getElementById('segA'),b=document.getElementById('segB'),pa=document.getElementById('plans-payg'),pu=document.getElementById('plans-unl');
function pick(u){a.classList.toggle('on',!u);b.classList.toggle('on',u);a.setAttribute('aria-pressed',!u);b.setAttribute('aria-pressed',u);pa.hidden=u;pu.hidden=!u;var g=u?pu:pa;Array.prototype.forEach.call(g.children,function(c,k){c.classList.remove('is-in');void c.offsetWidth;c.style.transitionDelay=(k*0.1)+'s';c.classList.add('is-in');setTimeout(function(){c.style.transitionDelay='';},1300);});}
if(a&&b){a.addEventListener('click',function(){pick(false);});b.addEventListener('click',function(){pick(true);});}
// faq
var btns=document.querySelectorAll('.faqbtn');
btns.forEach(function(btn){btn.addEventListener('click',function(){var open=btn.getAttribute('aria-expanded')==='true';
btns.forEach(function(o){o.setAttribute('aria-expanded','false');o.querySelector('span').style.transform='none';o.parentNode.querySelector('.faqans').hidden=true;});
if(!open){btn.setAttribute('aria-expanded','true');btn.querySelector('span').style.transform='rotate(45deg)';btn.parentNode.querySelector('.faqans').hidden=false;}});});
})();

