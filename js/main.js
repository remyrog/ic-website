(() => {
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  // 1) Année footer
  const y = $("#year");
  if (y) y.textContent = new Date().getFullYear();

  // 2) Preloader : disparaît dès que tout est prêt
  setTimeout(() => {
    const pre = document.getElementById("preloader");
    if (pre) pre.classList.add("is-done");
  }, 3000);

  // 3) Scroll doux sur les liens internes (offset géré par scroll-padding-top en CSS)
  $$(".nav [data-scrolllink], [data-scrolllink]").forEach(a => {
    a.addEventListener("click", e => {
      const href = a.getAttribute("href");
      if (!href || !href.startsWith("#")) return;
      e.preventDefault();
      const target = $(href);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  // 4) Barre de progression en bas de la nav
  const bar = $(".progress span");
  const updateProgress = () => {
    if (!bar) return;
    const h = document.documentElement;
    const scrolled = (h.scrollTop || document.body.scrollTop);
    const height = h.scrollHeight - h.clientHeight;
    const pct = height > 0 ? Math.min(100, Math.max(0, (scrolled / height) * 100)) : 0;
    bar.style.width = pct + "%";
  };
  window.addEventListener("scroll", updateProgress, { passive: true });
  updateProgress();

// 5) Effet “magnet” — inertie + rotation
const isTouch = "ontouchstart" in window;
const magnets = document.querySelectorAll("[data-magnet]");
magnets.forEach(el => {
  if (isTouch) return; // évite les saccades sur mobile

  const strength = parseFloat(el.dataset.magnet) || 30; // translation max (px)
  const maxRot   = parseFloat(el.dataset.rotate) || 6;  // rotation max (deg)
  const damp     = 0.14; // 0.10–0.20 = plus ou moins “ressort”

  let tx = 0, ty = 0, rx = 0;            // valeurs actuelles
  let txT = 0, tyT = 0, rxT = 0;         // cibles
  let raf = 0;

  const animate = () => {
    tx += (txT - tx) * damp;
    ty += (tyT - ty) * damp;
    rx += (rxT - rx) * damp;
    el.style.transform = `translate3d(${tx}px, ${ty}px, 0) rotate(${rx}deg)`;
    if (Math.abs(txT - tx) > 0.1 || Math.abs(tyT - ty) > 0.1 || Math.abs(rxT - rx) > 0.1) {
      raf = requestAnimationFrame(animate);
    } else {
      raf = 0;
    }
  };

  el.addEventListener("mousemove", e => {
    const r = el.getBoundingClientRect();
    const nx = ((e.clientX - r.left) / r.width  - 0.5) * 2; // -1..1
    const ny = ((e.clientY - r.top)  / r.height - 0.5) * 2;
    txT = nx * strength;
    tyT = ny * strength;
    rxT = -nx * maxRot; // tourne légèrement selon l’axe X
    if (!raf) raf = requestAnimationFrame(animate);
  });

  el.addEventListener("mouseleave", () => {
    txT = 0; tyT = 0; rxT = 0;
    if (!raf) raf = requestAnimationFrame(animate);
  });
});

// Soleil : dérive lente indépendante du scroll (aller-retour)
(() => {
  const sun = document.getElementById('sun');
  if (!sun) return;

  const svg = sun.ownerSVGElement;
  const base = sun.getAttribute('transform') || '';

  // Réglages (modifiable aussi via data-attrs)
  const duration = parseFloat(sun.dataset.sunDuration || '30'); // secondes pour l’aller (gauche -> droite)
  const arc      = parseFloat(sun.dataset.sunArc || '22');      // amplitude de l’arc vertical
  const marginR  = parseFloat(sun.dataset.sunMargin || '12');   // marge à droite
  const offsetY  = parseFloat(sun.dataset.offsetY || '108');     // “marge haute” (pousse vers le bas)

  let maxX = 0;

  function computeBounds() {
    if (!svg) return;
    const vb = svg.viewBox && svg.viewBox.baseVal ? svg.viewBox.baseVal : null;
    const width = vb ? vb.width : svg.clientWidth;

    const bb = sun.getBBox();
    // Distance restante vers la droite avant de toucher le bord (en tenant compte de la marge)
    maxX = Math.max(0, (width - marginR) - (bb.x + bb.width));
  }

  // anim: on part de x=0 (position actuelle), on va jusqu’à maxX, puis on revient (ping-pong)
  let x = 0;
  let dir = 1;
  let last = 0;

  function step(t) {
    if (!last) last = t;
    const dt = (t - last) / 1000; // secondes
    last = t;

    const speed = maxX / duration; // px/s
    x += dir * speed * dt;

    if (x >= maxX) { x = maxX; dir = -1; }
    if (x <= 0)    { x = 0;    dir =  1; }

    const p = maxX > 0 ? (x / maxX) : 0;                  // 0..1 sur l’aller
    const y = offsetY + Math.sin(p * Math.PI) * -arc;     // petit arc solaire
    const r = p * 180;                                    // rotation légère

    // Concatène à la transform d’origine (ne casse pas la position de base)
    sun.setAttribute('transform', `${base} translate(${x},${y}) rotate(${r})`);

    requestAnimationFrame(step);
  }

  computeBounds();
  window.addEventListener('resize', () => { computeBounds(); });

  requestAnimationFrame(step);
})();

gsap.registerPlugin(MotionPathPlugin, ScrollTrigger);

const endEl =
  document.querySelector("#hero + .section") ||
  document.querySelectorAll(".section")[1];

gsap.to("#carHero", {
  motionPath: {
    path: "#roadPathHero",
    align: "#roadPathHero",
    autoRotate: true,
    alignOrigin: [0.5, 0.5]
  },
  ease: "none",
  scrollTrigger: {
    trigger: "#hero",
    start: "top top",
    endTrigger: endEl,           // la 2e section
    end: "top top",              // fin quand son haut touche le haut du viewport
    scrub: true
  }
});

})();