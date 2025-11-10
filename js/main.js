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

gsap.registerPlugin(MotionPathPlugin, ScrollTrigger);

gsap.to("#sun", {
  motionPath: { path: "#sunPath", align: "#sunPath", autoRotate: true, alignOrigin: [0.5, 0.5] },
  ease: "none",
  scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom bottom", scrub: true }
});

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