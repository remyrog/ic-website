/* ========= Helpers ========= */
const $$ = (s, c=document)=>Array.from(c.querySelectorAll(s));
const $  = (s, c=document)=>c.querySelector(s);

/* 🔧 Nettoyage d’anciens overlays (sécurité) */
(function killLegacyRoadOverlay(){
  document.querySelectorAll('#pageRoad, .page-road').forEach(el => el.remove());
})();

/* ========= Preloader ========= */
window.addEventListener('load', () => {
  const pre = $('#preloader');
  if(pre){ pre.style.opacity = '0'; setTimeout(() => pre.remove(), 350); }
});

/* Footer year */
const yearEl = $('#year'); if(yearEl) yearEl.textContent = new Date().getFullYear();

/* Scroll progress */
const progress = document.querySelector('.progress span');
if(progress){
  document.addEventListener('scroll', () => {
    const h = document.documentElement;
    const scrolled = (h.scrollTop) / (h.scrollHeight - h.clientHeight);
    progress.style.width = (scrolled * 100).toFixed(2) + '%';
  }, { passive: true });
}

/* ========= GSAP ========= */
gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

/* ===== Soleil (position + rayons + clignement) ===== */
function positionSun(){
  const sunPath = document.getElementById('sunPath');
  const sun = document.getElementById('sun');
  if(!sunPath || !sun) return;
  const start = sunPath.getPointAtLength(0);
  gsap.set(sun, { x: start.x, y: start.y, transformOrigin:'center center' });
}
positionSun();
window.addEventListener('resize', positionSun);
gsap.to('#sunRays', { rotation:360, transformOrigin:'center center', duration:40, repeat:-1, ease:'none' });
(function blinkSun(){
  const L = $('#sun .eyeL'), R = $('#sun .eyeR');
  if(!L || !R) return;
  function doBlink(){ gsap.to([L,R], { duration:0.08, scaleY:0.1, transformOrigin:"center center", yoyo:true, repeat:1, ease:"power2.inOut" }); }
  setInterval(doBlink, 2600 + Math.random()*900);
})();

/* ===== HERO : pin + soleil + dash + voiture ===== */
(function animateHero(){
  const pin = $("#hero .hero__pin");
  if(!pin) return;
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: pin,
      start: "top top",
      end: () => "+=" + (window.innerHeight * 3.0),
      scrub: 1,
      pin: true,
      anticipatePin: 1,
      pinSpacing: true
    }
  });
  tl.to("#sun", { duration:1, ease:"none", motionPath:{ path:"#sunPath", autoRotate:false }}, 0);
  const dashTotal = 64; // 36 + 28
  tl.fromTo("#roadDash", { strokeDashoffset: 0 }, { strokeDashoffset: dashTotal*40, ease:"none", duration:1 }, 0);
  tl.to("#carHero", { duration:1, ease:"none",
    motionPath:{ path:"#roadPathHero", align:"#roadPathHero", autoRotate:true, alignOrigin:[0.5,0.5] }}, 0);
})();

/* ===== Effet titres "voiture qui arrive" ===== */
/* Remplace l'ancien split: on cible h1/h2/h3 [data-split] ou [data-speed] */
/* ===== Effet titres "voiture qui arrive" — NEON RIBBON ===== */
function setupSpeedTitles(){
  const titles = $$('h1[data-split], h2[data-split], h3[data-split], h1[data-speed], h2[data-speed], h3[data-speed]');
  titles.forEach(el=>{
    // init unique
    if(!el.classList.contains('speed-title')){
      el.classList.add('speed-title');
      const trail = document.createElement('span'); trail.className = 'trail';
      const glow  = document.createElement('span'); glow.className  = 'glow';
      el.appendChild(trail); el.appendChild(glow);
      // 4 étincelles
      for(let i=0;i<4;i++){
        const s = document.createElement('span'); s.className = 'spark';
        el.appendChild(s);
      }
    }
    const trail = el.querySelector('.trail');
    const glow  = el.querySelector('.glow');
    const sparks = $$('.spark', el);

    // Timeline principale
    const tl = gsap.timeline({ paused:true });

    // Arrivée rapide du titre (skew + blur + spacing)
    tl.fromTo(el, {
      x:-120, skewX:-18, letterSpacing:'0.08em',
      filter:'blur(2px) brightness(1.1)', opacity:0
    },{
      x:0, skewX:0, letterSpacing:'0em',
      filter:'blur(0px) brightness(1)', opacity:1,
      duration:0.9, ease:'expo.out'
    }, 0);

    // Ruban néon
    tl.fromTo(trail, {
      opacity:.95, scaleX:.18, x:-40
    },{
      opacity:0, scaleX:1.75, x:220,
      duration:.58, ease:'power2.out'
    }, 0.04);

    // Lueur
    tl.fromTo(glow, {
      width:'0%', opacity:0, x:-30
    },{
      width:'70%', opacity:.28, x:140,
      duration:.55, ease:'power2.out'
    }, 0.08).to(glow, { opacity:0, duration:.25, ease:'power1.out' }, 0.5);

    // Étincelles (positions/rotations aléatoires, super légères)
    gsap.set(sparks, {
      yPercent: ()=> gsap.utils.random(-60, 60),
      rotation: ()=> gsap.utils.random(-35, 35),
      scale: ()=> gsap.utils.random(0.8, 1.25)
    });
    tl.fromTo(sparks, {
      opacity:0, x:-12
    },{
      opacity:0, x: gsap.utils.random(120, 180),
      duration:.46, ease:'power2.out', stagger:0.04
    }, 0.06);

    // Petit freinage final
    tl.to(el, { x:0, skewX:0, duration:.28, ease:'back.out(2)' }, 0.56);

    // ScrollTrigger (ré-animable dans les deux sens)
    ScrollTrigger.create({
      trigger: el, start: "top 80%", end: "bottom 10%",
      onEnter:     () => tl.restart(true),
      onEnterBack: () => tl.restart(true),
      onLeave:     () => tl.pause(0),
      onLeaveBack: () => tl.pause(0)
    });
  });
}
setupSpeedTitles();

/* ===== Reveal sections (conserve ton reveal doux) ===== */
$$('.section').forEach(sec => {
  const items = sec.querySelectorAll('.lead, .service, .card, .values li, .chips span');
  if(!items.length) return;
  const anim = gsap.from(items, { y:26, opacity:0, rotateX: gsap.utils.random(-6,6), stagger:.05, duration:.6, ease:"power3.out", paused:true });
  ScrollTrigger.create({
    trigger: sec, start: "top 78%", end:"bottom 15%",
    onEnter: () => anim.restart(true),
    onEnterBack: () => anim.restart(true),
    onLeave: () => anim.pause(0),
    onLeaveBack: () => anim.pause(0)
  });
});

/* ===== Magnetic + shine (boutons/cartes) ===== */
$$('.btn-magnet, .cta-tile').forEach(btn=>{
  let r = null;
  btn.addEventListener('pointerenter', ()=>{ r = btn.getBoundingClientRect(); });
  btn.addEventListener('pointermove', (e)=>{
    if(!r) r = btn.getBoundingClientRect();
    const x = e.clientX - r.left - r.width/2;
    const y = e.clientY - r.top - r.height/2;
    gsap.to(btn, { x: x*0.15, y: y*0.15, rotate: x*0.02, duration:.2 });
  });
  btn.addEventListener('pointerleave', ()=> gsap.to(btn, { x:0, y:0, rotate:0, duration:.25, ease:"power3.out" }));
});
$$('.service').forEach(card=>{
  let r = null;
  card.addEventListener('mousemove', (e)=>{
    if(!r) r = card.getBoundingClientRect();
    const mx = ((e.clientX - r.left) / r.width)*100;
    const my = ((e.clientY - r.top) / r.height)*100;
    card.style.setProperty('--mx', mx+'%'); card.style.setProperty('--my', my+'%');
  });
  card.addEventListener('mouseleave', ()=>{ card.style.removeProperty('--mx'); card.style.removeProperty('--my'); r=null; });
});


/* ===== ROUTES DE SECTION (Hero clone) ===== */
const HERO_PATH_D = "M-50,720 C200,660 300,700 420,680 C550,660 620,600 720,610 C850,620 930,700 1040,690 C1150,680 1300,640 1500,660";
/* On recadre l’SVG des sections sur le BAS du Hero (540 → 810) */
const SECTION_VIEWBOX = { x: 0, y: 540, w: 1440, h: 270 };
/* Portion du chemin visible pour la voiture (segment bas) */
const SECTION_SEGMENT  = { start: 0.34, end: 1.0 };

let sectionRoadST = []; // cleanup

// Voiture IDENTIQUE au Hero, avec wrapper .carSprite (scale éventuel via CSS, ici = 1)
function createCarGroup(){
  const g = document.createElementNS('http://www.w3.org/2000/svg','g');
  g.setAttribute('class','car'); // GSAP anime ce groupe
  g.innerHTML = `
    <g class="carSprite">
      <rect x="-40" y="-20" rx="10" ry="10" width="90" height="38"
            fill="#FF5E8E" stroke="#fff" stroke-width="3"/>
      <rect x="-25" y="-36" rx="8" ry="8" width="60" height="22"
            fill="#ffd6e2" stroke="#fff" stroke-width="3"/>
      <circle cx="-20" cy="20" r="12" fill="#111" stroke="#eee" stroke-width="3"/>
      <circle cx="35"  cy="20" r="12" fill="#111" stroke="#eee" stroke-width="3"/>
      <rect x="40" y="-12" width="12" height="10" fill="#F7C600"/>
    </g>
  `;
  return g;
}

function addRoadToSection(section, index){
  // wrapper bas de section
  const wrap = document.createElement('div');
  wrap.className = 'section-road';
  if (section.id === 'demarche' || section.id === 'expertise') wrap.classList.add('fullwidth');
  section.classList.add('has-road');
  section.appendChild(wrap);

  // SVG recadré sur le bas du Hero
  const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox', `${SECTION_VIEWBOX.x} ${SECTION_VIEWBOX.y} ${SECTION_VIEWBOX.w} ${SECTION_VIEWBOX.h}`);
  svg.setAttribute('preserveAspectRatio','xMidYMid meet');
  wrap.appendChild(svg);

  // Dégradé identique (fallback stroke dans le CSS)
  const defs = document.createElementNS('http://www.w3.org/2000/svg','defs');
  defs.innerHTML = `
    <linearGradient id="grad-road-sec-${index}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#2b2d3a"/><stop offset="100%" stop-color="#1b1d27"/>
    </linearGradient>`;
  svg.appendChild(defs);

  // Route : fond + pointillés (aucun fill)
  const pathBg   = document.createElementNS('http://www.w3.org/2000/svg','path');
  const pathDash = document.createElementNS('http://www.w3.org/2000/svg','path');
  pathBg.setAttribute('d', HERO_PATH_D);
  pathDash.setAttribute('d', HERO_PATH_D);
  pathBg.setAttribute('class','bg');   pathBg.setAttribute('stroke', `url(#grad-road-sec-${index})`); pathBg.setAttribute('fill','none');
  pathDash.setAttribute('class','dash'); pathDash.setAttribute('stroke', '#F7F7F7'); pathDash.setAttribute('fill','none');
  svg.append(pathBg, pathDash);

  // Chemin central de référence (invisible)
  const pathRef  = document.createElementNS('http://www.w3.org/2000/svg','path');
  pathRef.setAttribute('d', HERO_PATH_D);
  pathRef.setAttribute('fill','none');
  svg.appendChild(pathRef);

  // Voiture
  const car = createCarGroup();
  svg.appendChild(car);

  // Animations au scroll (dash + voiture sur portion visible)
  const dashTotal = 64;
  const tl = gsap.timeline({
    scrollTrigger: { trigger: wrap, start: "top bottom", end: "bottom top", scrub: true }
  });
  tl.fromTo(pathDash, { strokeDashoffset: 0 }, { strokeDashoffset: dashTotal*40, ease:"none" }, 0);
  tl.to(car, {
    ease:"none",
    motionPath:{
      path: pathRef,
      align: pathRef,
      autoRotate: true,
      alignOrigin: [0.5, 0.58], // centrage parfait sur la route dans les sections
      start: SECTION_SEGMENT.start,
      end: SECTION_SEGMENT.end
    }
  }, 0);

  sectionRoadST.push(tl.scrollTrigger);
}

function buildSectionRoads(){
  // cleanup
  sectionRoadST.forEach(st => st && st.kill());
  sectionRoadST = [];
  $$('.section-road').forEach(n => n.remove());
  $$('.section.has-road').forEach(n => n.classList.remove('has-road'));

  // Ajoute une route en bas de CHAQUE section sauf le HERO
  const sections = $$('.section');
  sections.forEach((sec, i) => { if (sec.id !== 'hero') addRoadToSection(sec, i); });
}
buildSectionRoads();
window.addEventListener('resize', buildSectionRoads);

/* Transitions + ancres */
const pageT = $('#pageTransition');
function transitionIn(){ return gsap.to(pageT, { y:0, skewY:6, duration:.35, ease:"power2.in" }); }
function transitionOut(){ return gsap.to(pageT, { y:"-100%", skewY:0, duration:.55, ease:"power3.out", delay:.05 }); }
$$('[data-scrolllink]').forEach(a=>{
  a.addEventListener('click', (e)=>{
    const href = a.getAttribute('href'); if(!href || !href.startsWith('#')) return;
    e.preventDefault(); const target = document.querySelector(href);
    transitionIn().then(()=>{ target?.scrollIntoView({ behavior:'instant', block:'start' }); transitionOut(); });
  });
});

/* Anti-bounce (Safari/iOS overscroll) */
window.addEventListener('scroll', ()=>{ if(window.scrollY < 0) window.scrollTo(0,0); }, { passive:true });