(() => {
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  // 1) Année footer
  const y = $("#year");
  if (y) y.textContent = new Date().getFullYear();

  // 2) Preloader : disparaît dès que tout est prêt
  window.addEventListener("load", () => {
    const pre = $("#preloader");
    if (pre) pre.remove();
  });

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

// 6) Parallax "sun" + léger mouvement de la voiture
(() => {
  const $ = (s) => document.querySelector(s);
  const sun = $('[data-sun], .scene__sun, .sun, #sun');         // essaie plusieurs sélecteurs
  const car = $('[data-car], .scene .carSprite, .scene .car');   // idem pour la voiture

  if (!sun && !car) return;

  let raf = 0;
  const setT = (el, tx, ty, rotDeg = 0) => {
    if (!el) return;
    if (el.ownerSVGElement) {
      // Élément SVG → via l’attribut transform
      el.setAttribute('transform', `translate(${tx}, ${ty}) rotate(${rotDeg})`);
    } else {
      // Élément HTML classique
      el.style.transform = `translate3d(${tx}px, ${ty}px,0) rotate(${rotDeg}deg)`;
    }
  };

  const tick = () => {
    raf = 0;
    const h = document.documentElement;
    const scrolled = (h.scrollTop || document.body.scrollTop);
    const height = h.scrollHeight - h.clientHeight;
    const p = height > 0 ? Math.min(1, Math.max(0, scrolled / height)) : 0;

    // Soleil : arc + légère rotation
    const sunX = -40 + p * 80;                 // traverse l’écran
    const sunY = Math.sin(p * Math.PI) * -22;  // arc discret
    const sunR = p * 180;                      // un demi-tour sur la page
    setT(sun, sunX, sunY, sunR);

    // Voiture : petit défilement + tangage subtil
    const carX = p * 120;
    const carY = Math.sin(p * 6.283) * 1.5;
    const carR = Math.sin(p * 6.283) * 1.2;
    setT(car, carX, carY, carR);
  };

  const onScroll = () => { if (!raf) raf = requestAnimationFrame(tick); };
  window.addEventListener('scroll', onScroll, { passive: true });
  tick();
})();


})();