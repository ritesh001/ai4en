/* ─────────────────────────────────────────────────────────────
   Interactive widgets for the AI-for-Molecules deck.
   Vanilla JS. Each widget self-initialises against its slide DOM.
   ───────────────────────────────────────────────────────────── */

const SVG_NS = 'http://www.w3.org/2000/svg';
const cssVar = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

function el(tag, attrs = {}, parent) {
  const e = document.createElementNS(SVG_NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}
function clear(node){ while(node.firstChild) node.removeChild(node.firstChild); }

/* ══════════════════════════════════════════════════════════════
   Slide 03 · Fingerprint bit vector (pretty, static)
   ══════════════════════════════════════════════════════════════ */
(() => {
  const host = document.getElementById('fingerprint');
  if (!host) return;
  const rng = mulberry32(42);
  let s = '';
  for (let i = 0; i < 128; i++) {
    const on = rng() < 0.32;
    s += `<span style="color:${on ? 'var(--coral-ink)' : 'var(--ink-soft)'}; opacity:${on?1:0.35};">${on?'1':'0'}</span>`;
    if ((i+1) % 16 === 0) s += '<br/>';
  }
  host.innerHTML = s;
})();

function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

/* ══════════════════════════════════════════════════════════════
   Slide 04 · Linear regression — drag points
   ══════════════════════════════════════════════════════════════ */
(() => {
  const svg = document.getElementById('lr-svg');
  if (!svg) return;
  const W = 600, H = 400, PAD = 40;
  const xToPx = (x) => PAD + ((x + 5) / 10) * (W - 2*PAD);
  const yToPx = (y) => H - PAD - ((y + 5) / 10) * (H - 2*PAD);
  const pxToX = (px) => (px - PAD) / (W - 2*PAD) * 10 - 5;
  const pxToY = (py) => (H - PAD - py) / (H - 2*PAD) * 10 - 5;

  const mLabel = document.getElementById('lr-m');
  const bLabel = document.getElementById('lr-b');
  const lossLabel = document.getElementById('lr-loss');
  const resetBtn = document.getElementById('lr-reset');

  const defaults = [[-3.5,-2.8],[-2,-1.2],[-0.5,-0.2],[1,0.9],[2,2.3],[3.5,3.2],[-1,0.1],[0.5,0.7]];
  let pts = defaults.map(p => [...p]);

  function fit(){
    const n = pts.length;
    const mx = pts.reduce((a,p)=>a+p[0],0)/n;
    const my = pts.reduce((a,p)=>a+p[1],0)/n;
    let num=0, den=0;
    pts.forEach(p => { num += (p[0]-mx)*(p[1]-my); den += (p[0]-mx)**2; });
    const m = den === 0 ? 0 : num/den;
    const b = my - m*mx;
    const loss = pts.reduce((a,p)=>a+(p[1]-(m*p[0]+b))**2,0)/n;
    return { m, b, loss };
  }

  function draw(){
    clear(svg);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    // grid
    for (let i=-5;i<=5;i++){
      el('line', { x1: xToPx(i), y1: PAD, x2: xToPx(i), y2: H-PAD, stroke: cssVar('--rule'), 'stroke-width': 1 }, svg);
      el('line', { x1: PAD, y1: yToPx(i), x2: W-PAD, y2: yToPx(i), stroke: cssVar('--rule'), 'stroke-width': 1 }, svg);
    }
    // axes
    el('line',{x1:PAD,y1:yToPx(0),x2:W-PAD,y2:yToPx(0),stroke:cssVar('--ink-soft'),'stroke-width':1.5},svg);
    el('line',{x1:xToPx(0),y1:PAD,x2:xToPx(0),y2:H-PAD,stroke:cssVar('--ink-soft'),'stroke-width':1.5},svg);

    const { m, b, loss } = fit();
    // residuals
    pts.forEach(p => {
      const yhat = m*p[0]+b;
      el('line',{x1:xToPx(p[0]),y1:yToPx(p[1]),x2:xToPx(p[0]),y2:yToPx(yhat),
        stroke:cssVar('--violet'),'stroke-width':1.5,'stroke-dasharray':'3 3',opacity:0.7},svg);
    });
    // fit line
    el('line',{x1:xToPx(-5),y1:yToPx(m*-5+b),x2:xToPx(5),y2:yToPx(m*5+b),
      stroke:cssVar('--coral'),'stroke-width':4,'stroke-linecap':'round'},svg);

    // points
    pts.forEach((p, i) => {
      const c = el('circle',{cx:xToPx(p[0]),cy:yToPx(p[1]),r:10,
        fill:cssVar('--ink'),stroke:cssVar('--paper'),'stroke-width':3,
        style:'cursor:grab'},svg);
      c.addEventListener('pointerdown',(e)=>{
        e.preventDefault();
        c.setPointerCapture(e.pointerId);
        c.style.cursor='grabbing';
        const move=(ev)=>{
          const pt = svg.createSVGPoint();
          pt.x = ev.clientX; pt.y = ev.clientY;
          const loc = pt.matrixTransform(svg.getScreenCTM().inverse());
          pts[i][0] = Math.max(-5, Math.min(5, pxToX(loc.x)));
          pts[i][1] = Math.max(-5, Math.min(5, pxToY(loc.y)));
          draw();
        };
        const up=()=>{ c.style.cursor='grab'; svg.removeEventListener('pointermove',move); svg.removeEventListener('pointerup',up); };
        svg.addEventListener('pointermove',move);
        svg.addEventListener('pointerup',up);
      });
    });

    mLabel.textContent = m.toFixed(2);
    bLabel.textContent = b.toFixed(2);
    lossLabel.textContent = loss.toFixed(2);
  }
  resetBtn.addEventListener('click', () => { pts = defaults.map(p=>[...p]); draw(); });
  draw();
})();

/* ══════════════════════════════════════════════════════════════
   Slide 05 · Gradient descent on a 2D loss landscape
   ══════════════════════════════════════════════════════════════ */
(() => {
  const cv = document.getElementById('gd-canvas');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height;

  const lrInput = document.getElementById('gd-lr');
  const lrVal = document.getElementById('gd-lr-v');
  const stepBtn = document.getElementById('gd-step');
  const runBtn = document.getElementById('gd-run');
  const resetBtn = document.getElementById('gd-reset');

  // Rosenbrock-like loss for pedagogy
  const L = (x,y) => 0.6*(x*x) + 1.8*(y - 0.4*x*x)*(y - 0.4*x*x);
  const grad = (x,y) => {
    const u = y - 0.4*x*x;
    const dx = 1.2*x + 1.8*2*u*(-0.8*x);
    const dy = 1.8*2*u;
    return [dx, dy];
  };

  const X0=-2.5,X1=2.5,Y0=-1,Y1=2.5;
  const xToPx=(x)=> ((x-X0)/(X1-X0))*W;
  const yToPx=(y)=> H - ((y-Y0)/(Y1-Y0))*H;
  const pxToX=(px)=> X0 + (px/W)*(X1-X0);
  const pxToY=(py)=> Y0 + ((H-py)/H)*(Y1-Y0);

  let trail = [];
  let pos = null;

  function drawField(){
    const img = ctx.createImageData(W, H);
    // sample coarse then scale? Just do direct since W=640.
    for (let j=0;j<H;j+=2){
      for (let i=0;i<W;i+=2){
        const x = pxToX(i), y = pxToY(j);
        const v = L(x,y);
        const t = Math.min(1, v/6);
        // warm-to-cool
        const r = Math.round(250 - t*180);
        const g = Math.round(235 - t*140);
        const b = Math.round(215 + t*20);
        for (let jj=0;jj<2;jj++) for (let ii=0;ii<2;ii++){
          const idx = ((j+jj)*W + (i+ii))*4;
          img.data[idx]=r; img.data[idx+1]=g; img.data[idx+2]=b; img.data[idx+3]=255;
        }
      }
    }
    ctx.putImageData(img,0,0);
    // contour lines
    ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(60,40,30,0.25)';
    const levels = [0.1,0.3,0.7,1.3,2.2,3.5,5,7];
    levels.forEach(lev => {
      ctx.beginPath();
      for (let j=0;j<H;j+=4){
        for (let i=0;i<W;i+=4){
          const x=pxToX(i),y=pxToY(j);
          if (Math.abs(L(x,y)-lev) < 0.06) ctx.rect(i,j,1.5,1.5);
        }
      }
      ctx.stroke();
    });
    // minimum marker
    ctx.fillStyle = cssVar('--mint');
    ctx.beginPath(); ctx.arc(xToPx(0), yToPx(0), 7, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
  }

  function drawTrail(){
    if (trail.length < 2) { if(pos){ drawBall(pos); } return; }
    ctx.strokeStyle = cssVar('--coral');
    ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(xToPx(trail[0][0]), yToPx(trail[0][1]));
    for (let i=1;i<trail.length;i++) ctx.lineTo(xToPx(trail[i][0]), yToPx(trail[i][1]));
    ctx.stroke();
    trail.forEach(([x,y])=>{
      ctx.fillStyle = cssVar('--coral-ink');
      ctx.beginPath(); ctx.arc(xToPx(x),yToPx(y),2.5,0,Math.PI*2); ctx.fill();
    });
    drawBall(pos);
  }
  function drawBall(p){
    if (!p) return;
    ctx.fillStyle = cssVar('--ink');
    ctx.beginPath(); ctx.arc(xToPx(p[0]),yToPx(p[1]),7,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='#fff'; ctx.lineWidth=2; ctx.stroke();
  }

  function redraw(){ drawField(); drawTrail(); }

  cv.addEventListener('click',(e)=>{
    const rect = cv.getBoundingClientRect();
    const x = (e.clientX-rect.left)*(W/rect.width);
    const y = (e.clientY-rect.top)*(H/rect.height);
    pos = [pxToX(x), pxToY(y)];
    trail = [pos.slice()];
    redraw();
  });
  function step(){
    if (!pos) return;
    const eta = parseFloat(lrInput.value);
    const [gx,gy] = grad(pos[0],pos[1]);
    pos = [pos[0]-eta*gx, pos[1]-eta*gy];
    // clamp so diverging doesn't blow canvas
    pos = [Math.max(X0, Math.min(X1,pos[0])), Math.max(Y0, Math.min(Y1,pos[1]))];
    trail.push(pos.slice());
    if (trail.length > 120) trail.shift();
    redraw();
  }
  stepBtn.addEventListener('click', step);
  runBtn.addEventListener('click', ()=>{
    if (!pos) pos = [-2,2], trail=[pos.slice()];
    let n=0;
    const iv = setInterval(()=>{ step(); n++; if(n>=50) clearInterval(iv); }, 40);
  });
  resetBtn.addEventListener('click', ()=>{ pos=null; trail=[]; redraw(); });
  lrInput.addEventListener('input', ()=> lrVal.textContent = parseFloat(lrInput.value).toFixed(3));
  lrVal.textContent = parseFloat(lrInput.value).toFixed(3);
  // default
  pos = [-2, 2]; trail = [pos.slice()];
  redraw();
})();

/* ══════════════════════════════════════════════════════════════
   Slide 06 · Activation functions
   ══════════════════════════════════════════════════════════════ */
(() => {
  const svg = document.getElementById('act-svg');
  if (!svg) return;
  const W=600,H=400,PAD=40;
  const xToPx=(x)=>PAD+((x+5)/10)*(W-2*PAD);
  const yToPx=(y)=>H-PAD-((y+1.5)/3)*(H-2*PAD);
  const fns = {
    relu:    { fn: (x)=>Math.max(0,x), color: '--coral' },
    sigmoid: { fn: (x)=>1/(1+Math.exp(-x)), color: '--mint' },
    tanh:    { fn: (x)=>Math.tanh(x), color: '--violet' },
    gelu:    { fn: (x)=>0.5*x*(1+Math.tanh(Math.sqrt(2/Math.PI)*(x+0.044715*x*x*x))), color: '--amber' }
  };
  const checks = document.querySelectorAll('input[data-act]');
  function draw(){
    clear(svg);
    svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
    // grid
    for (let i=-5;i<=5;i++){
      el('line',{x1:xToPx(i),y1:PAD,x2:xToPx(i),y2:H-PAD,stroke:cssVar('--rule'),'stroke-width':1},svg);
    }
    [-1,0,1].forEach(y=> el('line',{x1:PAD,y1:yToPx(y),x2:W-PAD,y2:yToPx(y),stroke:cssVar('--rule'),'stroke-width':1},svg));
    // x-axis
    el('line',{x1:PAD,y1:yToPx(0),x2:W-PAD,y2:yToPx(0),stroke:cssVar('--ink-soft'),'stroke-width':1.5},svg);
    el('line',{x1:xToPx(0),y1:PAD,x2:xToPx(0),y2:H-PAD,stroke:cssVar('--ink-soft'),'stroke-width':1.5},svg);

    checks.forEach(c => {
      if (!c.checked) return;
      const {fn, color} = fns[c.dataset.act];
      let d='';
      for (let i=0;i<=200;i++){
        const x = -5 + (10*i/200);
        const y = Math.max(-1.4, Math.min(1.4, fn(x)));
        d += (i===0?'M':'L')+xToPx(x)+','+yToPx(y)+' ';
      }
      el('path',{d,stroke:cssVar(color),'stroke-width':4,fill:'none','stroke-linecap':'round','stroke-linejoin':'round'},svg);
    });
  }
  checks.forEach(c => c.addEventListener('change',draw));
  draw();
})();

/* ══════════════════════════════════════════════════════════════
   Slide 07 · Forward pass
   ══════════════════════════════════════════════════════════════ */
(() => {
  const svg = document.getElementById('fp-svg');
  if (!svg) return;
  const W=1600, H=560;
  const layers = [2, 4, 3, 1];
  const xPos = [180, 620, 1050, 1440];
  const layerYs = layers.map((n, li) => {
    const gap = H / (n+1);
    return Array.from({length:n}, (_,i)=> gap*(i+1));
  });
  // weights
  let weights = layers.slice(1).map((n, li) => {
    return Array.from({length:n}, () =>
      Array.from({length: layers[li]}, ()=> (Math.random()*2-1)));
  });
  let inputs = [0.5, -0.3];
  const x1 = document.getElementById('fp-x1'), x1v=document.getElementById('fp-x1-v');
  const x2 = document.getElementById('fp-x2'), x2v=document.getElementById('fp-x2-v');
  const rnd = document.getElementById('fp-randomize');
  const outLabel = document.getElementById('fp-out');

  const sig = (z)=> 1/(1+Math.exp(-z));

  function forward(){
    let a = inputs.slice();
    const acts = [a.slice()];
    for (let li=0; li<weights.length; li++){
      const na = weights[li].map(row => sig(row.reduce((s,w,i)=> s + w*a[i], 0)));
      a = na; acts.push(a.slice());
    }
    return acts;
  }

  function draw(){
    clear(svg);
    svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
    const acts = forward();

    // edges
    for (let li=0; li<weights.length; li++){
      for (let j=0;j<layers[li+1]; j++){
        for (let i=0;i<layers[li]; i++){
          const w = weights[li][j][i];
          const x1p = xPos[li], y1p = layerYs[li][i];
          const x2p = xPos[li+1], y2p = layerYs[li+1][j];
          const col = w >= 0 ? cssVar('--coral') : cssVar('--violet');
          const sw = 0.8 + Math.min(8, Math.abs(w)*5);
          const line = el('line',{x1:x1p,y1:y1p,x2:x2p,y2:y2p,stroke:col,'stroke-width':sw,'stroke-linecap':'round',opacity:0.85,style:'cursor:ns-resize'},svg);
          line.addEventListener('pointerdown',(ev)=>{
            ev.preventDefault();
            line.setPointerCapture(ev.pointerId);
            const startY = ev.clientY;
            const startW = w;
            const move=(e)=>{
              const dy = (e.clientY - startY)/-60;
              weights[li][j][i] = Math.max(-3, Math.min(3, startW + dy));
              draw();
            };
            const up=()=>{ svg.removeEventListener('pointermove',move); svg.removeEventListener('pointerup',up); };
            svg.addEventListener('pointermove',move);
            svg.addEventListener('pointerup',up);
          });
        }
      }
    }
    // nodes
    for (let li=0; li<layers.length; li++){
      for (let i=0;i<layers[li];i++){
        const cx = xPos[li], cy = layerYs[li][i];
        const v = acts[li][i];
        const r = 34;
        const fillT = Math.max(0, Math.min(1, (v+0.0)));
        // colour by activation
        const bg = li===0 ? cssVar('--ink') : (li===layers.length-1 ? cssVar('--coral') : cssVar('--mint'));
        el('circle',{cx,cy,r,fill:bg,opacity: li===0?1:(0.35+0.65*fillT),stroke:cssVar('--ink'),'stroke-width':2},svg);
        const t = el('text',{x:cx,y:cy,fill:'#fff','font-family':cssVar('--font-mono'),'font-size':18,'text-anchor':'middle','dominant-baseline':'central','font-weight':500},svg);
        t.textContent = (li===0 ? inputs[i] : v).toFixed(2);
      }
    }
    // layer labels
    const labels = ['input','hidden 1','hidden 2','output'];
    labels.forEach((lbl,i)=>{
      const t = el('text',{x:xPos[i], y: H-16, fill: cssVar('--ink-soft'), 'font-family': cssVar('--font-mono'), 'font-size': 18, 'text-anchor':'middle'}, svg);
      t.textContent = lbl;
    });
    outLabel.textContent = acts[acts.length-1][0].toFixed(3);
  }

  x1.addEventListener('input',()=>{ inputs[0]=parseFloat(x1.value); x1v.textContent=inputs[0].toFixed(2); draw(); });
  x2.addEventListener('input',()=>{ inputs[1]=parseFloat(x2.value); x2v.textContent=inputs[1].toFixed(2); draw(); });
  rnd.addEventListener('click',()=>{
    weights = layers.slice(1).map((n, li) =>
      Array.from({length:n}, () => Array.from({length: layers[li]}, ()=> (Math.random()*2-1))));
    draw();
  });
  draw();
})();

/* ══════════════════════════════════════════════════════════════
   Slide 08 · Backprop step-through
   ══════════════════════════════════════════════════════════════ */
(() => {
  const svg = document.getElementById('bp-svg');
  if (!svg) return;
  const W=720, H=380;
  const phaseLabel = document.getElementById('bp-phase');
  const nextBtn = document.getElementById('bp-next');
  const resetBtn = document.getElementById('bp-reset');
  // phases: 0-3 forward edges, 4-6 backward edges, 7 update
  let phase = 0;
  const PHASES = 8;

  const nodes = [
    {x:80,  y:190, lbl:'x'},
    {x:260, y:190, lbl:'h₁'},
    {x:440, y:190, lbl:'h₂'},
    {x:620, y:190, lbl:'ŷ'},
  ];

  function draw(){
    clear(svg);
    svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
    // loss node at right
    el('text',{x:700,y:110,'font-family':cssVar('--font-mono'),'font-size':16,fill:cssVar('--ink-soft'),'text-anchor':'end'},svg).textContent='target y*';

    for (let i=0;i<nodes.length-1;i++){
      const a=nodes[i], b=nodes[i+1];
      const fwdOn = phase > i;
      const bwdOn = phase >= 4 + (2-i);
      // forward arrow
      el('line',{x1:a.x+36,y1:a.y-10,x2:b.x-36,y2:b.y-10,
        stroke: fwdOn ? cssVar('--coral') : cssVar('--rule'),
        'stroke-width': fwdOn ? 5 : 2, 'stroke-linecap':'round'},svg);
      const fx = (a.x+b.x)/2, fy = a.y - 30;
      const tf = el('text',{x:fx,y:fy,'font-family':cssVar('--font-mono'),'font-size':16,
        fill: fwdOn?cssVar('--coral-ink'):cssVar('--ink-soft'),'text-anchor':'middle'},svg);
      tf.textContent = 'w'+(i+1);
      // backward arrow (below)
      el('line',{x1:b.x-36,y1:b.y+10,x2:a.x+36,y2:a.y+10,
        stroke: bwdOn ? cssVar('--mint') : cssVar('--rule'),
        'stroke-width': bwdOn ? 5 : 2, 'stroke-linecap':'round','stroke-dasharray': bwdOn ? '0' : '4 4'},svg);
      const bx = (a.x+b.x)/2, by = a.y + 34;
      const tb = el('text',{x:bx,y:by,'font-family':cssVar('--font-mono'),'font-size':16,
        fill: bwdOn?cssVar('--mint-ink'):cssVar('--ink-soft'),'text-anchor':'middle'},svg);
      tb.textContent = '∂ℒ/∂w'+(i+1);
    }
    // nodes
    nodes.forEach((n,i)=>{
      const active = (phase === i) || (phase === 3 && i===3);
      const hit = phase >= i && phase < 4;
      el('circle',{cx:n.x,cy:n.y,r:32, fill: hit ? cssVar('--coral') : (phase>=4? cssVar('--mint') : cssVar('--paper-2')),
        stroke: cssVar('--ink'),'stroke-width':2},svg);
      const t = el('text',{x:n.x,y:n.y,'font-family':cssVar('--font-display'),'font-size':24,fill:(hit||phase>=4)?'#fff':cssVar('--ink'),
        'text-anchor':'middle','dominant-baseline':'central'},svg);
      t.textContent = n.lbl;
    });
    // loss box
    const lossActive = phase>=3;
    el('rect',{x:600,y:130,width:100,height:60,rx:12,
      fill: lossActive ? cssVar('--violet') : cssVar('--paper-2'), stroke:cssVar('--ink'),'stroke-width':2},svg);
    const tl = el('text',{x:650,y:162,'font-family':cssVar('--font-mono'),'font-size':18,
      fill: lossActive?'#fff':cssVar('--ink-soft'),'text-anchor':'middle','dominant-baseline':'central'},svg);
    tl.textContent = 'ℒ(ŷ,y*)';
    // update
    if (phase === 7){
      const t = el('text',{x:360,y:340,'font-family':cssVar('--font-mono'),'font-size':22,fill:cssVar('--coral-ink'),'text-anchor':'middle'},svg);
      t.textContent = 'θ ← θ − η · ∇ℒ    ✓';
    }
    const labels = ['forward x→h₁','forward h₁→h₂','forward h₂→ŷ','compute loss','∂ℒ/∂w₃','∂ℒ/∂w₂','∂ℒ/∂w₁','update weights'];
    phaseLabel.textContent = labels[phase];
  }
  nextBtn.addEventListener('click',()=>{ phase = (phase+1)%PHASES; draw(); });
  resetBtn.addEventListener('click',()=>{ phase=0; draw(); });
  draw();
})();

/* ══════════════════════════════════════════════════════════════
   Slide 09 · Overfitting via polynomial degree
   ══════════════════════════════════════════════════════════════ */
(() => {
  const svg = document.getElementById('of-svg');
  if (!svg) return;
  const W=600,H=400,PAD=40;
  const trueF = (x)=> Math.sin(2*x) + 0.3*x;
  const degI = document.getElementById('of-deg'); const degV = document.getElementById('of-deg-v');
  const noiseI = document.getElementById('of-noise'); const noiseV = document.getElementById('of-noise-v');
  const resampleBtn = document.getElementById('of-resample');
  const trLabel = document.getElementById('of-tr'), teLabel = document.getElementById('of-te');

  let seed = 1;
  let train = [], test = [];
  function sampleAll(){
    const rand = mulberry32(seed);
    const noise = parseFloat(noiseI.value);
    train = []; test = [];
    for (let i=0;i<15;i++){
      const x = -3 + 6*rand();
      train.push([x, trueF(x) + (rand()*2-1)*noise]);
    }
    for (let i=0;i<60;i++){
      const x = -3 + 6*rand();
      test.push([x, trueF(x) + (rand()*2-1)*noise]);
    }
  }
  sampleAll();

  function polyFit(points, deg){
    // Vandermonde least-squares
    const n = points.length, m = deg+1;
    const X = Array.from({length:n},(_,i)=>{
      const row=[]; let p=1;
      for (let j=0;j<m;j++){ row.push(p); p*=points[i][0]; } return row;
    });
    const y = points.map(p=>p[1]);
    // Normal equations: (XᵀX) w = Xᵀy  (tiny m so fine)
    const XtX = Array.from({length:m},(_,i)=>Array.from({length:m},(_,j)=>{
      let s=0; for (let k=0;k<n;k++) s+=X[k][i]*X[k][j]; return s;
    }));
    const Xty = Array.from({length:m},(_,i)=>{
      let s=0; for (let k=0;k<n;k++) s+=X[k][i]*y[k]; return s;
    });
    // Tikhonov for numerical safety
    for (let i=0;i<m;i++) XtX[i][i]+=1e-6;
    const w = solve(XtX, Xty);
    return (x)=>{ let s=0,p=1; for(let j=0;j<m;j++){s+=w[j]*p;p*=x;} return s; };
  }
  function solve(A, b){
    const n=A.length;
    const M = A.map((r,i)=> r.concat([b[i]]));
    for (let i=0;i<n;i++){
      let p=i; for (let k=i+1;k<n;k++) if (Math.abs(M[k][i])>Math.abs(M[p][i])) p=k;
      [M[i],M[p]]=[M[p],M[i]];
      for (let k=i+1;k<n;k++){
        const f=M[k][i]/M[i][i];
        for (let j=i;j<=n;j++) M[k][j]-=f*M[i][j];
      }
    }
    const x=new Array(n);
    for (let i=n-1;i>=0;i--){
      let s=M[i][n];
      for (let j=i+1;j<n;j++) s-=M[i][j]*x[j];
      x[i]=s/M[i][i];
    }
    return x;
  }

  const xToPx = (x)=> PAD + ((x+3)/6)*(W-2*PAD);
  const yToPx = (y)=> H-PAD - ((y+2.5)/5)*(H-2*PAD);

  function draw(){
    clear(svg); svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
    for (let x=-3;x<=3;x++) el('line',{x1:xToPx(x),y1:PAD,x2:xToPx(x),y2:H-PAD,stroke:cssVar('--rule'),'stroke-width':1},svg);
    for (let y=-2;y<=2;y++) el('line',{x1:PAD,y1:yToPx(y),x2:W-PAD,y2:yToPx(y),stroke:cssVar('--rule'),'stroke-width':1},svg);
    el('line',{x1:PAD,y1:yToPx(0),x2:W-PAD,y2:yToPx(0),stroke:cssVar('--ink-soft'),'stroke-width':1.2},svg);

    const deg = parseInt(degI.value);
    const f = polyFit(train, deg);
    // true
    let dt='';
    for (let i=0;i<=120;i++){
      const x=-3+6*i/120, y=trueF(x);
      dt += (i===0?'M':'L')+xToPx(x)+','+yToPx(y)+' ';
    }
    el('path',{d:dt,stroke:cssVar('--ink-soft'),'stroke-width':2.2,'stroke-dasharray':'6 5',fill:'none'},svg);
    // model
    let dm='';
    for (let i=0;i<=240;i++){
      const x=-3+6*i/240; const y=Math.max(-3, Math.min(3, f(x)));
      dm += (i===0?'M':'L')+xToPx(x)+','+yToPx(y)+' ';
    }
    el('path',{d:dm,stroke:cssVar('--violet'),'stroke-width':3.5,fill:'none','stroke-linecap':'round'},svg);
    // training pts
    train.forEach(p=>{
      el('circle',{cx:xToPx(p[0]),cy:yToPx(p[1]),r:6,fill:cssVar('--coral'),stroke:'#fff','stroke-width':1.5},svg);
    });

    const mse = (pts) => pts.reduce((s,p)=> s + (p[1]-f(p[0]))**2, 0)/pts.length;
    const trL = mse(train), teL = mse(test);
    trLabel.textContent = trL.toFixed(2);
    teLabel.textContent = teL.toFixed(2);
  }
  degI.addEventListener('input',()=>{ degV.textContent = degI.value; draw(); });
  noiseI.addEventListener('input',()=>{ noiseV.textContent = parseFloat(noiseI.value).toFixed(2); sampleAll(); draw(); });
  resampleBtn.addEventListener('click',()=>{ seed++; sampleAll(); draw(); });
  draw();
})();

/* ══════════════════════════════════════════════════════════════
   Slide 10 · Gaussian Process
   ══════════════════════════════════════════════════════════════ */
(() => {
  const svg = document.getElementById('gp-svg');
  if (!svg) return;
  const W=600,H=400,PAD=40;
  const xToPx=(x)=>PAD+((x+5)/10)*(W-2*PAD);
  const yToPx=(y)=>H-PAD-((y+2.5)/5)*(H-2*PAD);
  const pxToX=(px)=>(px-PAD)/(W-2*PAD)*10-5;
  const pxToY=(py)=>(H-PAD-py)/(H-2*PAD)*5-2.5;

  const lI = document.getElementById('gp-l'), lV=document.getElementById('gp-l-v');
  const nI = document.getElementById('gp-n'), nV=document.getElementById('gp-n-v');
  const clearBtn = document.getElementById('gp-clear');

  let obs = [[-3, -0.8], [-1, 1.1], [2, -0.5]];

  function rbf(a,b,l){ return Math.exp(-((a-b)*(a-b))/(2*l*l)); }
  function cholSolve(L, b){
    const n=L.length, y=new Array(n), x=new Array(n);
    for (let i=0;i<n;i++){ let s=b[i]; for(let j=0;j<i;j++) s-=L[i][j]*y[j]; y[i]=s/L[i][i]; }
    for (let i=n-1;i>=0;i--){ let s=y[i]; for(let j=i+1;j<n;j++) s-=L[j][i]*x[j]; x[i]=s/L[i][i]; }
    return x;
  }
  function cholesky(A){
    const n=A.length, L = Array.from({length:n},()=>new Array(n).fill(0));
    for (let i=0;i<n;i++){
      for (let j=0;j<=i;j++){
        let s=A[i][j];
        for (let k=0;k<j;k++) s -= L[i][k]*L[j][k];
        if (i===j) L[i][j]=Math.sqrt(Math.max(s,1e-10));
        else L[i][j]=s/L[j][j];
      }
    }
    return L;
  }

  function posterior(xs){
    const l = parseFloat(lI.value), sn = parseFloat(nI.value);
    if (obs.length===0){
      return xs.map(()=>[0, 1]);
    }
    const n = obs.length;
    const K = Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=> rbf(obs[i][0],obs[j][0],l) + (i===j?sn*sn:0)));
    const L = cholesky(K);
    const y = obs.map(p=>p[1]);
    const alpha = cholSolve(L, y);
    return xs.map(x=>{
      const ks = obs.map(p=> rbf(p[0], x, l));
      const mean = ks.reduce((s,k,i)=> s + k*alpha[i], 0);
      const v = cholSolve(L, ks);
      let varr = 1 - ks.reduce((s,k,i)=> s+k*v[i],0);
      varr = Math.max(varr, 1e-6);
      return [mean, Math.sqrt(varr)];
    });
  }

  function draw(){
    clear(svg); svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
    for (let x=-5;x<=5;x++) el('line',{x1:xToPx(x),y1:PAD,x2:xToPx(x),y2:H-PAD,stroke:cssVar('--rule'),'stroke-width':1},svg);
    for (let y=-2;y<=2;y++) el('line',{x1:PAD,y1:yToPx(y),x2:W-PAD,y2:yToPx(y),stroke:cssVar('--rule'),'stroke-width':1},svg);
    el('line',{x1:PAD,y1:yToPx(0),x2:W-PAD,y2:yToPx(0),stroke:cssVar('--ink-soft'),'stroke-width':1.2},svg);

    const xs = Array.from({length:120},(_,i)=> -5+10*i/119);
    const post = posterior(xs);

    // band
    let dBand='';
    xs.forEach((x,i)=>{ const [m,s]=post[i]; dBand += (i===0?'M':'L') + xToPx(x)+','+yToPx(m+2*s)+' '; });
    for (let i=xs.length-1;i>=0;i--){ const x=xs[i], [m,s]=post[i]; dBand += 'L'+xToPx(x)+','+yToPx(m-2*s)+' '; }
    dBand += 'Z';
    el('path',{d:dBand, fill:cssVar('--mint'), opacity:0.22, stroke:'none'},svg);

    // mean
    let dM='';
    xs.forEach((x,i)=>{ const [m]=post[i]; dM += (i===0?'M':'L')+xToPx(x)+','+yToPx(m)+' '; });
    el('path',{d:dM, stroke:cssVar('--violet'),'stroke-width':3.5,fill:'none','stroke-linecap':'round'},svg);

    // observations
    obs.forEach(p => {
      el('circle',{cx:xToPx(p[0]),cy:yToPx(p[1]),r:8,fill:cssVar('--coral'),stroke:'#fff','stroke-width':2},svg);
    });
  }

  svg.addEventListener('click',(e)=>{
    const pt = svg.createSVGPoint(); pt.x=e.clientX; pt.y=e.clientY;
    const loc = pt.matrixTransform(svg.getScreenCTM().inverse());
    const x = pxToX(loc.x), y = pxToY(loc.y);
    if (x>-5 && x<5 && y>-2.5 && y<2.5) { obs.push([x,y]); draw(); }
  });
  lI.addEventListener('input',()=>{ lV.textContent = parseFloat(lI.value).toFixed(2); draw(); });
  nI.addEventListener('input',()=>{ nV.textContent = parseFloat(nI.value).toFixed(2); draw(); });
  clearBtn.addEventListener('click',()=>{ obs=[]; draw(); });
  draw();
})();

/* ══════════════════════════════════════════════════════════════
   Slide 11 · PINN (toy: fit sin(x), physics = u''+u=0)
   ══════════════════════════════════════════════════════════════ */
(() => {
  const svg = document.getElementById('pi-svg');
  if (!svg) return;
  const W=600,H=400,PAD=40;
  const xToPx=(x)=>PAD+((x+4)/8)*(W-2*PAD);
  const yToPx=(y)=>H-PAD-((y+1.5)/3)*(H-2*PAD);

  const dI=document.getElementById('pi-d'); const dV=document.getElementById('pi-d-v');
  const pI=document.getElementById('pi-p'); const pV=document.getElementById('pi-p-v');
  const trainBtn=document.getElementById('pi-train');
  const resetBtn=document.getElementById('pi-reset');

  // Tiny polynomial-in-features model: u(x) = sum_k a_k * phi_k(x) where phi_k are Chebyshev-ish basis
  const K = 8;
  let a = new Array(K).fill(0).map(()=> (Math.random()*0.4-0.2));

  function basis(x){
    // x in [-4,4] → scale
    const arr = new Array(K);
    const xs = x/4;
    arr[0]=1; arr[1]=xs;
    for (let k=2;k<K;k++) arr[k] = 2*xs*arr[k-1]-arr[k-2]; // Chebyshev T
    return arr;
  }
  function u(x){ const b = basis(x); let s=0; for(let k=0;k<K;k++) s+=a[k]*b[k]; return s; }
  // numerical second derivative
  function u2(x){ const h=0.05; return (u(x+h)-2*u(x)+u(x-h))/(h*h); }

  // training data: only a few points near x=0
  const data = [[-0.5, Math.sin(-0.5)], [0.0, 0.0], [0.7, Math.sin(0.7)]];

  function gradStep(lr){
    const ld = parseFloat(dI.value);
    const lp = parseFloat(pI.value);
    // Gradients via finite diff on a (cheap; K small)
    const eps = 1e-3;
    const loss = ()=> {
      let L=0;
      data.forEach(([x,y])=> L += ld*(u(x)-y)**2);
      // physics: u'' + u = 0 sampled on grid
      for (let i=0;i<20;i++){ const x = -4+8*i/19; L += lp*(u2(x)+u(x))**2; }
      return L;
    };
    const L0 = loss();
    for (let k=0;k<K;k++){
      a[k]+=eps;
      const L1 = loss();
      a[k]-=eps;
      const g = (L1-L0)/eps;
      a[k] -= lr*g;
    }
  }

  function draw(){
    clear(svg); svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
    for (let x=-4;x<=4;x++) el('line',{x1:xToPx(x),y1:PAD,x2:xToPx(x),y2:H-PAD,stroke:cssVar('--rule'),'stroke-width':1},svg);
    [-1,0,1].forEach(y=> el('line',{x1:PAD,y1:yToPx(y),x2:W-PAD,y2:yToPx(y),stroke:cssVar('--rule'),'stroke-width':1},svg));
    el('line',{x1:PAD,y1:yToPx(0),x2:W-PAD,y2:yToPx(0),stroke:cssVar('--ink-soft'),'stroke-width':1.2},svg);

    // truth
    let dt='';
    for (let i=0;i<=200;i++){ const x=-4+8*i/200; const y=Math.sin(x); dt+=(i===0?'M':'L')+xToPx(x)+','+yToPx(y)+' '; }
    el('path',{d:dt,stroke:cssVar('--coral'),'stroke-width':2.5,'stroke-dasharray':'6 5',fill:'none'},svg);
    // network
    let dm='';
    for (let i=0;i<=200;i++){ const x=-4+8*i/200; const y=Math.max(-1.4,Math.min(1.4,u(x))); dm+=(i===0?'M':'L')+xToPx(x)+','+yToPx(y)+' '; }
    el('path',{d:dm,stroke:cssVar('--violet'),'stroke-width':3.5,fill:'none','stroke-linecap':'round'},svg);
    // data
    data.forEach(([x,y])=> el('circle',{cx:xToPx(x),cy:yToPx(y),r:8,fill:cssVar('--mint'),stroke:'#fff','stroke-width':2},svg));
  }

  trainBtn.addEventListener('click',()=>{
    for (let i=0;i<200;i++) gradStep(0.01);
    draw();
  });
  resetBtn.addEventListener('click',()=>{ a = new Array(K).fill(0).map(()=> (Math.random()*0.4-0.2)); draw(); });
  dI.addEventListener('input',()=> dV.textContent = parseFloat(dI.value).toFixed(2));
  pI.addEventListener('input',()=> pV.textContent = parseFloat(pI.value).toFixed(2));
  draw();
})();
