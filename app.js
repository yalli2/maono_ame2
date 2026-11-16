"use strict";
/* ============================================================
   APP
   ============================================================ */
const $=(s,r)=>(r||document).querySelector(s);
const $$=(s,r)=>Array.from((r||document).querySelectorAll(s));
let toastT=null;
function toast(msg){const el=$('#toast');el.textContent=msg;el.classList.add('on');
  clearTimeout(toastT);toastT=setTimeout(()=>el.classList.remove('on'),2600);}

/* ---------- state ---------- */
const KV={}; KNOBS.forEach(k=>KV[k.id]=k.v);
const FV={}; FADERS.forEach(f=>FV[f.id]=f.v);
let gainSw='50';
const TG={light:1};
let atKey=null;
let QZ=QUIZ.map(()=>null);
let misDone=LS.get('ame2_mis',{});

/* ---------- language ---------- */
function applyLang(){
  document.documentElement.lang=lang;
  $$('[data-t]').forEach(el=>{const k=el.dataset.t; if(L[k]) el.textContent=T(k);});
  $$('.langs button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.lang===lang)));
  renderNav(); renderBoard(); renderKnobs(); renderMissions(); renderPads();
  renderScn(); renderFaq(); renderSpecs(); renderQuiz(); nextRead(true);
  updateBadge();
}
$$('.langs button').forEach(b=>b.addEventListener('click',()=>{
  lang=b.dataset.lang; LS.set('ame2_lang',lang); applyLang();
}));

/* ---------- nav ---------- */
let curTab='connect';
function renderNav(){
  const nav=$('#nav'); nav.innerHTML='';
  TABS.forEach((t,i)=>{
    const b=document.createElement('button');
    b.setAttribute('role','tab'); b.setAttribute('aria-selected',String(t.id===curTab));
    b.innerHTML='<span class="num">'+(i+1)+'</span>'+t.i+' '+tx(t.n);
    b.addEventListener('click',()=>go(t.id));
    nav.appendChild(b);
  });
}
function go(id){
  curTab=id;
  $$('.tab').forEach(s=>s.classList.toggle('on',s.id==='tab-'+id));
  $$('#nav button').forEach((b,i)=>b.setAttribute('aria-selected',String(TABS[i].id===id)));
  window.scrollTo({top:0,behavior:'smooth'});
}

/* ---------- board ---------- */
let curCtl=null;
function renderBoard(){
  const b=$('#board'); b.innerHTML='';
  GRP.forEach(g=>{
    const items=CONTROLS.filter(c=>c.g===g.k);
    const z=document.createElement('div'); z.className='zonecard';
    z.innerHTML='<h4>'+tx(g.n)+' · '+items.length+'</h4>';
    const hg=document.createElement('div'); hg.className='hotgrid';
    items.forEach(c=>{
      const el=document.createElement('button');
      el.className='hot'+(curCtl===c.n?' act':'');
      el.innerHTML='<span class="n">'+c.n+'</span>'+tx(c.name);
      el.addEventListener('click',()=>{curCtl=c.n;showCtl(c);
        $$('.hot').forEach(h=>h.classList.remove('act'));el.classList.add('act');});
      hg.appendChild(el);
    });
    z.appendChild(hg); b.appendChild(z);
  });
  if(curCtl){const c=CONTROLS.find(x=>x.n===curCtl); if(c) showCtl(c);}
}
function showCtl(c){
  $('#detail').innerHTML=
    '<div class="dh"><span class="dn">'+c.n+'</span><h3>'+tx(c.name)+'</h3></div>'+
    '<div class="kv">'+
      '<div><span class="k">'+T('kFn')+'</span><span class="v">'+tx(c.fn)+'</span></div>'+
      '<div><span class="k">'+T('kTip')+'</span><span class="v">'+tx(c.tip)+'</span></div>'+
      (c.rec?'<div><span class="k">'+T('kRec')+'</span><span class="v"><b>'+tx(c.rec)+'</b></span></div>':'')+
    '</div>';
}

/* ---------- knobs ---------- */
function knobEl(k){
  const w=document.createElement('div'); w.className='kn'; w.dataset.id=k.id;
  w.innerHTML='<div class="dial" style="--p:'+KV[k.id]+'" tabindex="0" role="slider" aria-label="'+k.n+
    '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+KV[k.id]+'">'+
    '<div class="inner"><div class="mark"></div></div></div>'+
    '<div class="nm">'+k.n+'<div style="font-weight:500;color:var(--tx3);font-size:10px">'+tx(k.d)+'</div></div>'+
    '<div class="vl">'+clockOf(KV[k.id])+'</div>';
  const dial=$('.dial',w);
  const set=v=>{KV[k.id]=Math.max(0,Math.min(100,Math.round(v)));paintKnob(w,k);};
  let dragging=false,startY=0,startV=0;
  dial.addEventListener('pointerdown',e=>{dragging=true;startY=e.clientY;startV=KV[k.id];
    dial.setPointerCapture(e.pointerId);});
  dial.addEventListener('pointermove',e=>{if(!dragging)return;set(startV+(startY-e.clientY)*0.7);});
  dial.addEventListener('pointerup',()=>{dragging=false;});
  dial.addEventListener('pointercancel',()=>{dragging=false;});
  dial.addEventListener('wheel',e=>{e.preventDefault();set(KV[k.id]+(e.deltaY<0?3:-3));},{passive:false});
  dial.addEventListener('keydown',e=>{
    if(e.key==='ArrowUp'||e.key==='ArrowRight'){e.preventDefault();set(KV[k.id]+3);}
    if(e.key==='ArrowDown'||e.key==='ArrowLeft'){e.preventDefault();set(KV[k.id]-3);}});
  paintKnob(w,k);
  return w;
}
function clockOf(v){ // 0..100 -> 7시 ~ 5시 (270도)
  const h=[7,8,9,10,11,12,1,2,3,4,5][Math.min(10,Math.round(v/10))];
  return h+(lang==='ko'?'시':'h');
}
function paintKnob(w,k){
  const v=KV[k.id];
  const d=$('.dial',w); d.style.setProperty('--p',v); d.setAttribute('aria-valuenow',v);
  $('.mark',w).style.transform='rotate('+(-135+v*2.7)+'deg)';
  $('.vl',w).textContent=clockOf(v)+' · '+v+'%';
}
function renderKnobs(){
  const box=$('#knobs'); box.innerHTML=''; KNOBS.forEach(k=>box.appendChild(knobEl(k)));
  const fb=$('#faders'); fb.innerHTML='';
  FADERS.forEach(f=>{
    const d=document.createElement('div'); d.className='fd';
    d.innerHTML='<input type="range" min="0" max="100" value="'+FV[f.id]+'" aria-label="'+f.n+'">'+
      '<div class="nm" style="font-size:11px;font-weight:800;color:var(--tx2);text-align:center">'+f.n+
      '<div style="font-weight:500;color:var(--tx3);font-size:10px">'+tx(f.d)+'</div></div>'+
      '<div class="vl" style="font-size:11px;color:var(--amber2)">'+FV[f.id]+'%</div>';
    const inp=$('input',d);
    inp.addEventListener('input',()=>{FV[f.id]=+inp.value;$('.vl',d).textContent=FV[f.id]+'%';});
    fb.appendChild(d);
  });
  const gw=document.createElement('div'); gw.className='fd';
  gw.innerHTML='<div style="display:grid;gap:5px">'+GAINSW.map(g=>
    '<button class="tg'+(gainSw===g.v?' on':'')+'" data-g="'+g.v+'" style="padding:7px 12px">'+g.t+'</button>').join('')+
    '</div><div class="nm" style="font-size:11px;font-weight:800;color:var(--tx2)">MIC1 GAIN</div>';
  $$('button',gw).forEach(btn=>btn.addEventListener('click',()=>{
    gainSw=btn.dataset.g; $$('button',gw).forEach(x=>x.classList.toggle('on',x.dataset.g===gainSw));}));
  fb.appendChild(gw);

  const tb=$('#toggles'); tb.innerHTML='';
  TOGGLES.forEach(t=>{
    const b=document.createElement('button');
    b.className='tg'+(TG[t.id]?' on':''); b.setAttribute('aria-pressed',String(!!TG[t.id]));
    b.innerHTML=t.n+'<small>'+tx(t.d)+'</small>';
    b.addEventListener('click',()=>{TG[t.id]=TG[t.id]?0:1;b.classList.toggle('on',!!TG[t.id]);
      b.setAttribute('aria-pressed',String(!!TG[t.id]));});
    tb.appendChild(b);
  });
  const ab=$('#autotune'); ab.innerHTML='';
  AT_KEYS.forEach(k=>{
    const b=document.createElement('button'); b.className='atk'+(atKey===k?' on':''); b.textContent=k;
    b.addEventListener('click',()=>{atKey=(atKey===k?null:k);
      $$('.atk',ab).forEach(x=>x.classList.toggle('on',x.textContent===atKey));});
    ab.appendChild(b);
  });
  const pr=$('#presetRow'); pr.innerHTML='';
  PRESETS.forEach(p=>{
    const b=document.createElement('button'); b.className='btn ghost sm'; b.textContent=tx(p.n);
    b.addEventListener('click',()=>applyPreset(p.id));
    pr.appendChild(b);
  });
}
function applyPreset(id){
  const p=PRESETS.find(x=>x.id===id); if(!p)return;
  Object.keys(p.k).forEach(k=>KV[k]=p.k[k]);
  Object.keys(p.f).forEach(k=>FV[k]=p.f[k]);
  gainSw=p.gain; atKey=p.at;
  Object.keys(TG).forEach(k=>delete TG[k]);
  Object.keys(p.t).forEach(k=>TG[k]=1);
  renderKnobs();
  const n=$('#presetNote'); n.style.display='block';
  n.innerHTML='<b>'+tx(p.n)+'</b> — '+tx(p.note);
  toast(T('mPresetOn')+': '+tx(p.n));
}
$('#btnSaveK').addEventListener('click',()=>{
  LS.set('ame2_knobs',{KV,FV,gainSw,TG,atKey}); toast(T('mSaved'));});
$('#btnLoadK').addEventListener('click',()=>{
  const s=LS.get('ame2_knobs',null); if(!s){toast(T('mNoSave'));return;}
  Object.assign(KV,s.KV||{}); Object.assign(FV,s.FV||{});
  gainSw=s.gainSw||'50'; atKey=s.atKey||null;
  Object.keys(TG).forEach(k=>delete TG[k]); Object.assign(TG,s.TG||{});
  renderKnobs(); toast(T('mLoaded'));});

/* ---------- missions ---------- */
function renderMissions(){
  const box=$('#missions'); box.innerHTML='';
  MIS.forEach((m,mi)=>{
    const d=document.createElement('details'); d.className='mission';
    const done=m.p.filter((_,si)=>misDone[mi+'-'+si]).length;
    d.innerHTML='<summary><span class="mn">'+(mi+1)+'</span><span class="ttl">'+tx(m.t)+
      '<em>'+tx(m.s)+'</em></span><span class="pg">'+done+'/'+m.p.length+'</span></summary>'+
      '<div class="mbody"><ul class="steps"></ul>'+
      '<div class="check"><b>'+(lang==='ko'?'확인 포인트':lang==='es'?'Clave':'Key point')+'</b>'+tx(m.c)+'</div></div>';
    const ul=$('.steps',d);
    m.p.forEach((s,si)=>{
      const key=mi+'-'+si; const li=document.createElement('li');
      li.className=misDone[key]?'done':'';
      const cb=document.createElement('input'); cb.type='checkbox'; cb.checked=!!misDone[key];
      const sp=document.createElement('span'); sp.textContent=tx(s);
      cb.addEventListener('change',()=>{
        if(cb.checked) misDone[key]=1; else delete misDone[key];
        LS.set('ame2_mis',misDone); li.classList.toggle('done',cb.checked);
        $('.pg',d).textContent=m.p.filter((_,x)=>misDone[mi+'-'+x]).length+'/'+m.p.length;
        updateMisScore();
      });
      li.appendChild(cb); li.appendChild(sp); ul.appendChild(li);
    });
    box.appendChild(d);
  });
  updateMisScore();
}
function updateMisScore(){
  const total=MIS.reduce((a,m)=>a+m.p.length,0);
  const done=Object.keys(misDone).length;
  $('#misScore').textContent=done+' / '+total;
  $('#misBar').style.width=(total?done/total*100:0)+'%';
}
$('#btnResetMis').addEventListener('click',()=>{misDone={};LS.set('ame2_mis',misDone);renderMissions();});

/* ---------- scenarios / faq / specs ---------- */
function renderScn(){
  const box=$('#scns'); box.innerHTML='';
  SCN.forEach(s=>{
    const d=document.createElement('div'); d.className='scn';
    d.innerHTML='<h3>'+tx(s.n)+'</h3><div class="sub">'+tx(s.s)+'</div><ul class="wire">'+
      s.w.map(w=>'<li><span>'+tx(w)+'</span></li>').join('')+'</ul>';
    const b=document.createElement('button'); b.className='btn sm'; b.style.marginTop='13px';
    b.textContent='⚙ '+T('usePreset');
    b.addEventListener('click',()=>{applyPreset(s.p);go('knobs');toast(T('mJump'));});
    d.appendChild(b); box.appendChild(d);
  });
}
function renderFaq(){
  const box=$('#trouble'); box.innerHTML='';
  FAQ.forEach((f,i)=>{
    const d=document.createElement('details'); d.className='mission';
    d.innerHTML='<summary><span class="mn">Q'+(i+1)+'</span><span class="ttl">'+tx(f.q)+
      '</span></summary><div class="mbody"><p style="font-size:13.5px;color:var(--tx2);margin:12px 0 0">'+
      tx(f.a)+'</p></div>';
    box.appendChild(d);
  });
}
function renderSpecs(){
  const box=$('#specs'); box.innerHTML='';
  SPECS.forEach(s=>{
    const d=document.createElement('div');
    d.innerHTML='<div style="font-size:11px;font-weight:800;letter-spacing:.4px;color:var(--tx3);text-transform:uppercase">'+
      tx(s.k)+'</div><div style="font-size:15px;font-weight:700;color:var(--tx)">'+s.v+'</div>';
    box.appendChild(d);
  });
}

/* ---------- quiz ---------- */
function renderQuiz(){
  const box=$('#quiz'); box.innerHTML='';
  QUIZ.forEach((q,qi)=>{
    const d=document.createElement('div'); d.className='q';
    d.innerHTML='<div class="qt">'+(qi+1)+'. '+tx(q.q)+'</div><div class="opts"></div>'+
      '<div class="ex"><b>'+(lang==='ko'?'해설':lang==='es'?'Explicación':'Why')+' · </b>'+tx(q.e)+'</div>';
    const op=$('.opts',d);
    q.o.forEach((o,oi)=>{
      const b=document.createElement('button'); b.className='opt'; b.textContent=tx(o);
      if(QZ[qi]!=null){
        if(oi===q.a) b.classList.add('ok');
        else if(oi===QZ[qi]) b.classList.add('no');
      }
      b.addEventListener('click',()=>{
        if(QZ[qi]!=null) return;
        QZ[qi]=oi;
        $$('.opt',d).forEach((x,xi)=>{if(xi===q.a)x.classList.add('ok');else if(xi===oi)x.classList.add('no');});
        $('.ex',d).classList.add('show'); updateQz();
      });
      op.appendChild(b);
    });
    if(QZ[qi]!=null) $('.ex',d).classList.add('show');
    box.appendChild(d);
  });
  updateQz();
}
function updateQz(){
  const c=QZ.filter((a,i)=>a===QUIZ[i].a).length;
  $('#qzScore').textContent=c+' / '+QUIZ.length;
}
$('#btnQzReset').addEventListener('click',()=>{QZ=QUIZ.map(()=>null);renderQuiz();});

/* ============================================================
   AUDIO ENGINE
   ============================================================ */
const RX=/maono|ame2|maonocaster|(^|[^a-z])e2([^a-z]|$)/i;
let AC=null, stream=null, srcNode=null, anL=null, anR=null, bufL=null, bufR=null, rafId=null;
let pkHoldL=0, pkHoldR=0, clipT=0, devices=[];
let micReady=false;

function dbfs(v){ return v<=0.000016?-96:20*Math.log10(v); }
function pctOf(db){ return Math.max(0,Math.min(100,(db+60)/60*100)); }

async function enumerate(){
  try{ devices=await navigator.mediaDevices.enumerateDevices(); }catch(e){ devices=[]; }
  const list=$('#devList'); list.innerHTML='';
  const ins=devices.filter(d=>d.kind==='audioinput');
  const outs=devices.filter(d=>d.kind==='audiooutput');
  [['IN',ins],['OUT',outs]].forEach(([tag,arr])=>{
    arr.forEach(d=>{
      const hit=RX.test(d.label||'');
      const el=document.createElement('div'); el.className='dev'+(hit?' hit':'');
      el.innerHTML='<span class="tag">'+tag+'</span><span class="nm">'+
        (d.label||'(unnamed device)')+'</span>'+(hit?'<span class="tag">AME2</span>':'');
      list.appendChild(el);
    });
  });
  const si=$('#selIn'), so=$('#selOut');
  si.innerHTML=ins.map(d=>'<option value="'+d.deviceId+'">'+(d.label||d.deviceId)+'</option>').join('');
  so.innerHTML=outs.map(d=>'<option value="'+d.deviceId+'">'+(d.label||d.deviceId)+'</option>').join('');
  const hitIn=ins.find(d=>RX.test(d.label||''));
  const hitOut=outs.find(d=>RX.test(d.label||''));
  if(hitIn) si.value=hitIn.deviceId;
  if(hitOut) so.value=hitOut.deviceId;
  updateBadge(!!hitIn||!!hitOut);
  return {hitIn,hitOut};
}
let badgeState=null;
function updateBadge(found){
  if(found!==undefined) badgeState=found;
  const b=$('#devBadge');
  if(badgeState===null){ b.className='badge'; b.innerHTML='<i class="pulse"></i>'+T('badgeIdle'); return; }
  b.className='badge '+(badgeState?'ok':'bad');
  b.innerHTML='<i class="pulse"></i>'+(badgeState?T('badgeOk'):T('badgeNo'));
}

async function openMic(deviceId){
  if(stream){ stream.getTracks().forEach(t=>t.stop()); }
  const con={audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false,channelCount:2}};
  if(deviceId) con.audio.deviceId={exact:deviceId};
  stream=await navigator.mediaDevices.getUserMedia(con);
  if(!AC) AC=new (window.AudioContext||window.webkitAudioContext)();
  if(AC.state==='suspended') await AC.resume();
  srcNode=AC.createMediaStreamSource(stream);
  const sp=AC.createChannelSplitter(2);
  srcNode.connect(sp);
  anL=AC.createAnalyser(); anR=AC.createAnalyser();
  anL.fftSize=2048; anR.fftSize=2048; anL.smoothingTimeConstant=.5;
  sp.connect(anL,0); try{ sp.connect(anR,1); }catch(e){ srcNode.connect(anR); }
  bufL=new Float32Array(anL.fftSize); bufR=new Float32Array(anR.fftSize);
  micReady=true;
  $$('[data-rec],[data-play],#btnNoise,#btnTone,#btnPink,#btnLoop,#btnRefresh').forEach(b=>b.disabled=false);
  const tr=stream.getAudioTracks()[0], st=tr?tr.getSettings():{};
  $('#devInfo').innerHTML=
    '<span>'+(lang==='ko'?'활성 입력':lang==='es'?'Entrada activa':'Active input')+'</span><b>'+
      (tr?tr.label:'—')+'</b>'+
    '<span>Sample rate</span><b>'+(st.sampleRate||AC.sampleRate)+' Hz</b>'+
    '<span>Channels</span><b>'+(st.channelCount||2)+'</b>';
  if(!rafId) loop();
  try{ await applySink(); }catch(e){}
}
async function applySink(){
  const id=$('#selOut').value;
  if(AC && typeof AC.setSinkId==='function' && id){ try{ await AC.setSinkId(id); }catch(e){} }
}

/* ---------- meter loop ---------- */
const cvW=$('#cvWave'), cvS=$('#cvSpec');
const cvDims=new WeakMap();
function fitCanvas(c){
  const d=window.devicePixelRatio||1, w=c.clientWidth, h=c.clientHeight;
  const m=cvDims.get(c);
  if(!m||m.w!==w||m.h!==h){ c.width=Math.max(1,Math.round(w*d)); c.height=Math.max(1,Math.round(h*d));
    cvDims.set(c,{w:w,h:h}); }
  return c.getContext('2d');
}
const M={};
function meterRefs(){
  if(M.fillL) return M;
  M.fillL=$('#fillL'); M.fillR=$('#fillR'); M.pkL=$('#pkL'); M.pkR=$('#pkR');
  M.vRms=$('#vRms'); M.vPeak=$('#vPeak'); M.sig=$('#ledSig'); M.clip=$('#ledClip');
  return M;
}
function loop(){
  rafId=requestAnimationFrame(loop);
  if(!micReady) return;
  meterRefs();
  anL.getFloatTimeDomainData(bufL); anR.getFloatTimeDomainData(bufR);
  const m=(buf)=>{let s=0,p=0;for(let i=0;i<buf.length;i++){const v=buf[i];s+=v*v;if(Math.abs(v)>p)p=Math.abs(v);}
    return {rms:Math.sqrt(s/buf.length),peak:p};};
  const a=m(bufL), b=m(bufR);
  const dL=dbfs(a.rms), dR=dbfs(b.rms), pL=dbfs(a.peak), pR=dbfs(b.peak);
  M.fillL.style.width=pctOf(dL)+'%'; M.fillR.style.width=pctOf(dR)+'%';
  pkHoldL=Math.max(pkHoldL-0.6,pctOf(pL)); pkHoldR=Math.max(pkHoldR-0.6,pctOf(pR));
  M.pkL.style.left=pkHoldL+'%'; M.pkR.style.left=pkHoldR+'%';
  M.vRms.textContent=(dL>-95?dL.toFixed(1):'-∞')+' dB';
  M.vPeak.textContent=(Math.max(pL,pR)>-95?Math.max(pL,pR).toFixed(1):'-∞')+' dB';
  M.sig.classList.toggle('on',dL>-50||dR>-50);
  if(a.peak>=0.985||b.peak>=0.985) clipT=performance.now();
  M.clip.classList.toggle('on',performance.now()-clipT<1200);
  if(noiseRun) noiseAcc.push(a.rms);
  drawWave(); drawSpec();
}
function drawWave(){
  const g=fitCanvas(cvW), W=cvW.width, H=cvW.height;
  g.clearRect(0,0,W,H); g.fillStyle='#070a0d'; g.fillRect(0,0,W,H);
  g.strokeStyle='#1d2630'; g.lineWidth=1; g.beginPath(); g.moveTo(0,H/2); g.lineTo(W,H/2); g.stroke();
  g.strokeStyle='#ffa62b'; g.lineWidth=1.6; g.beginPath();
  for(let i=0;i<bufL.length;i++){
    const x=i/bufL.length*W, y=H/2-bufL[i]*H*0.46;
    i?g.lineTo(x,y):g.moveTo(x,y);
  }
  g.stroke();
}
let specBuf=null;
function drawSpec(){
  if(!specBuf) specBuf=new Uint8Array(anL.frequencyBinCount);
  anL.getByteFrequencyData(specBuf);
  const g=fitCanvas(cvS), W=cvS.width, H=cvS.height;
  g.clearRect(0,0,W,H); g.fillStyle='#070a0d'; g.fillRect(0,0,W,H);
  const n=120;
  for(let i=0;i<n;i++){
    const f0=Math.pow(10,1.3+ (i/n)*(Math.log10(16000)-1.3));
    const bin=Math.min(specBuf.length-1,Math.round(f0/(AC.sampleRate/2)*specBuf.length));
    const v=specBuf[bin]/255, bw=W/n;
    const h=v*H*0.95;
    const grd=g.createLinearGradient(0,H,0,H-h);
    grd.addColorStop(0,'#2b6f6a'); grd.addColorStop(1,'#ffcd6b');
    g.fillStyle=grd; g.fillRect(i*bw+0.5,H-h,bw-1.2,h);
  }
  g.fillStyle='#4a5a6b'; g.font=(10*(window.devicePixelRatio||1))+'px sans-serif';
  ['100','1k','10k'].forEach((t,i)=>{ g.fillText(t, W*(0.14+i*0.37), H-4); });
}

/* ---------- noise floor ---------- */
let noiseRun=false, noiseAcc=[];
$('#btnNoise').addEventListener('click',async()=>{
  if(!micReady) return toast(T('mNeedMic'));
  noiseAcc=[]; noiseRun=true; $('#noiseOut').textContent=T('mNoiseRun');
  for(let i=5;i>0;i--){ $('#noiseOut').textContent=T('mNoiseRun')+'  ('+i+T('secs')+')'; await sleep(1000); }
  noiseRun=false;
  const avg=noiseAcc.length?noiseAcc.reduce((x,y)=>x+y,0)/noiseAcc.length:0;
  const db=dbfs(avg);
  const verdict = db<-58?T('mNoiseQuiet') : db<-45?T('mNoiseOk') : T('mNoiseHi');
  const cls = db<-58?'good' : db<-45?'warn' : 'bad';
  $('#noiseOut').innerHTML='<div class="'+cls+'" style="margin-top:10px">'+
    (lang==='ko'?'노이즈 플로어':'Noise floor')+': <b>'+db.toFixed(1)+' dBFS</b> — '+verdict+'</div>';
});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

/* ---------- test tones ---------- */
function playTone(freq,dur,gain){
  if(!AC) return;
  const o=AC.createOscillator(), g=AC.createGain();
  o.frequency.value=freq; o.type='sine';
  g.gain.value=0; o.connect(g); g.connect(AC.destination);
  const t=AC.currentTime;
  g.gain.linearRampToValueAtTime(gain||0.08,t+0.03);
  g.gain.setValueAtTime(gain||0.08,t+dur-0.05);
  g.gain.linearRampToValueAtTime(0,t+dur);
  o.start(t); o.stop(t+dur+0.02);
  return o;
}
$('#btnTone').addEventListener('click',()=>playTone(1000,2));
$('#btnPink').addEventListener('click',()=>{
  if(!AC) return;
  const len=AC.sampleRate*3, buf=AC.createBuffer(1,len,AC.sampleRate), d=buf.getChannelData(0);
  let b0=0,b1=0,b2=0;
  for(let i=0;i<len;i++){
    const w=Math.random()*2-1;
    b0=0.99765*b0+w*0.0990460; b1=0.96300*b1+w*0.2965164; b2=0.57000*b2+w*1.0526913;
    d[i]=(b0+b1+b2+w*0.1848)*0.12;
  }
  const s=AC.createBufferSource(); s.buffer=buf; const g=AC.createGain(); g.gain.value=0.5;
  s.connect(g); g.connect(AC.destination); s.start();
});

/* ---------- A/B recorder ---------- */
const slots={A:{},B:{}};
function mimeType(){
  const c=['audio/webm;codecs=opus','audio/webm','audio/mp4','audio/ogg'];
  for(const m of c){ if(window.MediaRecorder && MediaRecorder.isTypeSupported(m)) return m; }
  return '';
}
$$('[data-rec]').forEach(btn=>btn.addEventListener('click',async()=>{
  const k=btn.dataset.rec, s=slots[k];
  if(!micReady) return toast(T('mNeedMic'));
  if(s.rec && s.rec.state==='recording'){ s.rec.stop(); return; }
  const mt=mimeType();
  try{ s.rec=new MediaRecorder(stream, mt?{mimeType:mt}:undefined); }
  catch(e){ toast('MediaRecorder: '+e.message); return; }
  const chunks=[];
  s.rec.ondataavailable=e=>{ if(e.data.size) chunks.push(e.data); };
  s.rec.onstop=async()=>{
    clearInterval(s.iv);
    btn.classList.remove('rec'); $('span',btn).textContent=T('btnRec');
    const blob=new Blob(chunks,{type:mt||'audio/webm'});
    if(s.url) URL.revokeObjectURL(s.url);
    s.url=URL.createObjectURL(blob); s.blob=blob;
    $('#info'+k).textContent=(blob.size/1024).toFixed(0)+' KB';
    try{ await drawRecorded(k,blob); }catch(e){}
  };
  s.rec.start(200);
  const t0=Date.now();
  $('span',btn).textContent=T('btnStop');
  s.iv=setInterval(()=>{
    const el=(Date.now()-t0)/1000;
    $('#info'+k).textContent=el.toFixed(1)+'s · '+T('mRecOn');
    if(el>=30 && s.rec.state==='recording') s.rec.stop();
  },120);
}));
$$('[data-play]').forEach(btn=>btn.addEventListener('click',()=>{
  const k=btn.dataset.play, s=slots[k];
  if(!s.url) return;
  if(!s.audio) s.audio=new Audio();
  s.audio.src=s.url;
  if($('#selOut').value && typeof s.audio.setSinkId==='function'){ s.audio.setSinkId($('#selOut').value).catch(()=>{}); }
  s.audio.currentTime=0; s.audio.play().catch(()=>{});
}));
async function drawRecorded(k,blob){
  const ab=await blob.arrayBuffer();
  const ctx=AC||new (window.AudioContext||window.webkitAudioContext)();
  const audio=await ctx.decodeAudioData(ab.slice(0));
  const data=audio.getChannelData(0);
  const c=$('[data-cv="'+k+'"]'), g=fitCanvas(c), W=c.width, H=c.height;
  g.clearRect(0,0,W,H); g.fillStyle='#070a0d'; g.fillRect(0,0,W,H);
  const step=Math.max(1,Math.floor(data.length/W));
  g.fillStyle=k==='A'?'#45d6c4':'#ffa62b';
  for(let x=0;x<W;x++){
    let mx=0;
    for(let i=0;i<step;i++){ const v=Math.abs(data[x*step+i]||0); if(v>mx) mx=v; }
    const h=Math.max(1,mx*H*0.92);
    g.fillRect(x,(H-h)/2,1,h);
  }
  g.strokeStyle='#1d2630'; g.beginPath(); g.moveTo(0,H/2); g.lineTo(W,H/2); g.stroke();
  $('#info'+k).textContent=audio.duration.toFixed(1)+'s · '+(blob.size/1024).toFixed(0)+' KB';
}

/* ---------- loopback test ---------- */
$('#btnLoop').addEventListener('click',async()=>{
  if(!micReady) return toast(T('mNeedMic'));
  const F=[659,1864];
  $('#loopOut').textContent=T('mLoopRun');
  await applySink();
  const os=F.map(f=>playTone(f,5,0.14));
  const bins=new Uint8Array(anL.frequencyBinCount);
  const hits=[0,0]; let n=0;
  for(let i=0;i<40;i++){
    await sleep(110);
    anL.getByteFrequencyData(bins);
    const med=median(bins);
    F.forEach((f,fi)=>{
      const idx=Math.round(f/(AC.sampleRate/2)*bins.length);
      let mx=0; for(let d=-2;d<=2;d++){ const v=bins[idx+d]||0; if(v>mx) mx=v; }
      if(mx>med+55) hits[fi]++;
    });
    n++;
  }
  os.forEach(o=>{ try{o.stop();}catch(e){} });
  const ratio=Math.min(hits[0],hits[1])/n;
  if(ratio>0.4){
    $('#loopOut').innerHTML='<div class="good" style="margin-top:10px">✅ '+T('mLoopYes')+
      ' <span style="opacity:.7">('+Math.round(ratio*100)+'%)</span></div>';
  }else{
    $('#loopOut').innerHTML='<div class="warn" style="margin-top:10px">⚠️ '+T('mLoopNo')+
      ' <span style="opacity:.7">('+Math.round(ratio*100)+'%)</span></div>';
  }
});
function median(arr){ const a=Array.from(arr).sort((x,y)=>x-y); return a[Math.floor(a.length/2)]; }

/* ---------- reading sentences ---------- */
let readIdx=-1;
function nextRead(keep){
  const arr=READS[lang]||READS.ko;
  if(!keep||readIdx<0) readIdx=(readIdx+1)%arr.length;
  $('#readTxt').textContent=arr[readIdx%arr.length];
}
$('#btnNextTxt').addEventListener('click',()=>nextRead(false));

/* ---------- permission buttons ---------- */
$('#btnPerm').addEventListener('click',async()=>{
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){
    $('#permMsg').innerHTML='<div class="bad" style="margin-top:10px">'+T('mNoSupport')+'</div>'; return;
  }
  try{
    await openMic(null);
    const {hitIn}=await enumerate();
    if(hitIn){ await openMic(hitIn.deviceId); toast(T('mFound')); $('#permMsg').innerHTML=
        '<div class="good" style="margin-top:10px">✅ '+T('mFound')+'</div>'; }
    else { $('#permMsg').innerHTML='<div class="warn" style="margin-top:10px">'+T('mNotFound')+'</div>'; }
  }catch(e){
    $('#permMsg').innerHTML='<div class="bad" style="margin-top:10px">'+T('mDenied')+
      '<br><span style="opacity:.7">'+(e&&e.name?e.name:'')+'</span></div>';
    updateBadge(false);
  }
});
$('#btnRefresh').addEventListener('click',()=>enumerate());
$('#selIn').addEventListener('change',()=>openMic($('#selIn').value).catch(()=>{}));
$('#selOut').addEventListener('change',()=>applySink());
if(navigator.mediaDevices&&navigator.mediaDevices.addEventListener){
  navigator.mediaDevices.addEventListener('devicechange',()=>{ if(micReady) enumerate(); });
}

/* ============================================================
   SOUND PADS
   ============================================================ */
const PADS=[{id:'A',max:60},{id:'B',max:60},{id:'C',max:60}].concat(
  [1,2,3,4,5,6,7,8].map(i=>({id:String(i),max:20})));
const padData={};
let padLoop=false, padGain=0.75;
function renderPads(){
  const box=$('#pads'); box.innerHTML='';
  PADS.forEach(p=>{
    const b=document.createElement('button');
    b.className='pad'+(padData[p.id]?' has':''); b.dataset.pad=p.id;
    b.innerHTML='<div>'+p.id+'<small>'+p.max+'s</small></div><div class="ring" style="--r:0"></div>';
    let holdT=null, ringT=null, longed=false;
    const startHold=e=>{
      e.preventDefault(); longed=false;
      if(padData[p.id]&&padData[p.id].recording) return;
      const t0=Date.now();
      ringT=setInterval(()=>{
        const r=Math.min(100,(Date.now()-t0)/3000*100);
        $('.ring',b).style.setProperty('--r',r);
      },50);
      holdT=setTimeout(()=>{ longed=true; clearInterval(ringT); $('.ring',b).style.setProperty('--r',0);
        startPadRec(p,b); },3000);
    };
    const endHold=()=>{
      clearTimeout(holdT); clearInterval(ringT); $('.ring',b).style.setProperty('--r',0);
      if(longed) return;
      if(padData[p.id]&&padData[p.id].recording){ stopPadRec(p,b); return; }
      playPad(p,b);
    };
    b.addEventListener('pointerdown',startHold);
    b.addEventListener('pointerup',endHold);
    b.addEventListener('pointerleave',()=>{clearTimeout(holdT);clearInterval(ringT);
      $('.ring',b).style.setProperty('--r',0);});
    box.appendChild(b);
  });
  const tl=$('#tgLoop'); tl.classList.toggle('on',padLoop);
}
function startPadRec(p,b){
  if(!micReady){ toast(T('mNeedMic')); return; }
  const mt=mimeType(); let rec;
  try{ rec=new MediaRecorder(stream, mt?{mimeType:mt}:undefined); }catch(e){ toast(e.message); return; }
  const chunks=[]; const d={recording:true,rec:rec};
  padData[p.id]=d;
  rec.ondataavailable=e=>{ if(e.data.size) chunks.push(e.data); };
  rec.onstop=()=>{
    clearTimeout(d.cap); d.recording=false;
    const blob=new Blob(chunks,{type:mt||'audio/webm'});
    if(d.url) URL.revokeObjectURL(d.url);
    d.url=URL.createObjectURL(blob);
    b.classList.remove('rec'); b.classList.add('has');
  };
  rec.start(200);
  b.classList.add('rec'); toast(T('mPadRec'));
  d.cap=setTimeout(()=>{ if(rec.state==='recording') rec.stop(); }, p.max*1000);
}
function stopPadRec(p,b){
  const d=padData[p.id];
  if(d&&d.rec&&d.rec.state==='recording') d.rec.stop();
}
function playPad(p,b){
  const d=padData[p.id];
  if(!d||!d.url) return;
  if(!d.audio) d.audio=new Audio();
  d.audio.src=d.url; d.audio.loop=padLoop; d.audio.volume=padGain;
  if($('#selOut').value&&typeof d.audio.setSinkId==='function'){ d.audio.setSinkId($('#selOut').value).catch(()=>{}); }
  d.audio.currentTime=0; d.audio.play().catch(()=>{});
  b.classList.add('play');
  d.audio.onended=()=>b.classList.remove('play');
  if(padLoop){
    b.addEventListener('dblclick',()=>{ d.audio.pause(); b.classList.remove('play'); },{once:true});
  }
}
$('#tgLoop').addEventListener('click',()=>{ padLoop=!padLoop; $('#tgLoop').classList.toggle('on',padLoop); });
$('#padVol').addEventListener('input',e=>{ padGain=(+e.target.value)/100; });
$('#btnPadClear').addEventListener('click',()=>{
  PADS.forEach(p=>{ const d=padData[p.id]; if(d&&d.url) URL.revokeObjectURL(d.url); delete padData[p.id]; });
  renderPads();
});

/* ---------- init ---------- */
window.addEventListener('resize',()=>{ cvDims.delete(cvW); cvDims.delete(cvS); });
applyLang();
updateBadge();
if(location.protocol==='file:'){
  $('#permMsg').innerHTML='<div class="warn" style="margin-top:10px">'+T('permHint')+'</div>';
}
