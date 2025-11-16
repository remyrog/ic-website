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

function initMagnets(root = document) {
  if (isTouch) return; // on évite sur mobile

  const magnets = root.querySelectorAll("[data-magnet]");
  magnets.forEach(el => {
    // empêchez une double initialisation
    if (el.__magnetInit) return;
    el.__magnetInit = true;

    const strength = parseFloat(el.dataset.magnet) || 30; // translation max (px)
    const maxRot   = parseFloat(el.dataset.rotate) || 6;  // rotation max (deg)
    const damp     = 0.14; // 0.10–0.20 = plus ou moins “ressort”

    let tx = 0, ty = 0, rx = 0;
    let txT = 0, tyT = 0, rxT = 0;
    let raf = 0;

    const animate = () => {
      tx += (txT - tx) * damp;
      ty += (tyT - ty) * damp;
      rx += (rxT - rx) * damp;
      el.style.transform = `translate3d(${tx}px, ${ty}px, 0) rotate(${rx}deg)`;
      if (
        Math.abs(txT - tx) > 0.1 ||
        Math.abs(tyT - ty) > 0.1 ||
        Math.abs(rxT - rx) > 0.1
      ) {
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
      rxT = -nx * maxRot;
      if (!raf) raf = requestAnimationFrame(animate);
    });

    el.addEventListener("mouseleave", () => {
      txT = 0; tyT = 0; rxT = 0;
      if (!raf) raf = requestAnimationFrame(animate);
    });
  });
}

// appel initial pour tout ce qui est déjà en DOM
initMagnets();

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

// =========================
//  Avis (JSON local simplifié, 5 par 5)
// =========================
(function initLocalReviews() {
  const section = document.getElementById("avis");
  if (!section) return;

  const reviewsContainer = section.querySelector(".reviews");
  const prevBtn = section.querySelector(".reviews__controls .prev");
  const nextBtn = section.querySelector(".reviews__controls .next");
  const avatarTemplate = document.getElementById("review-avatar-template");

  if (!reviewsContainer || !prevBtn || !nextBtn || !avatarTemplate) return;

  const TOTAL_REVIEWS_COUNT = 52;  // info disponible si tu veux l'afficher
  const AVERAGE_RATING = 5;
  const REVIEWS_PER_PAGE = 5;

  let reviews = [];
  let currentPage = 0;
  let autoplayId = null;

  function createAvatarNode() {
    return avatarTemplate.content.firstElementChild.cloneNode(true);
  }

  function createReviewElement(review) {
    const article = document.createElement("article");
    article.className = "review";
    article.setAttribute("data-magnet", "");

    const avatar = createAvatarNode();

    const body = document.createElement("div");
    body.className = "review__body";

    const header = document.createElement("div");
    header.className = "review__header";

    const name = review.author || "Client Google";
    const metaEl = document.createElement("p");
    metaEl.className = "review__meta";

    const rating = parseInt(review.rating, 10) || 0;
    const stars = "★★★★★".slice(0, rating);

    if (review.date) {
      const d = new Date(review.date);
      const formatted = d.toLocaleDateString("fr-FR");
      metaEl.textContent = `${name} • ${formatted} • ${stars}`;
    } else {
      metaEl.textContent = `${name} • ${stars}`;
    }

    const textEl = document.createElement("p");
    textEl.className = "review__text";
    textEl.textContent =
      review.comment && review.comment.trim().length
        ? review.comment.trim()
        : "Avis sans commentaire texte.";

    header.appendChild(metaEl);
    body.appendChild(header);
    body.appendChild(textEl);

    article.appendChild(avatar);
    article.appendChild(body);

    return article;
  }

function renderPage() {
  reviewsContainer.innerHTML = "";

  const totalPages = Math.ceil(reviews.length / REVIEWS_PER_PAGE) || 1;
  const start = currentPage * REVIEWS_PER_PAGE;
  const end = start + REVIEWS_PER_PAGE;
  const slice = reviews.slice(start, end);

  slice.forEach((review) => {
    const el = createReviewElement(review);
    reviewsContainer.appendChild(el);
  });

  // ➜ applique les effets "magnet" aux nouveaux blocs
  if (typeof initMagnets === "function") {
    initMagnets(reviewsContainer);
  }
}

  function nextPage() {
    const totalPages = Math.ceil(reviews.length / REVIEWS_PER_PAGE) || 1;
    if (!totalPages) return;
    currentPage = (currentPage + 1) % totalPages;
    renderPage();
  }

  function prevPage() {
    const totalPages = Math.ceil(reviews.length / REVIEWS_PER_PAGE) || 1;
    if (!totalPages) return;
    currentPage = (currentPage - 1 + totalPages) % totalPages;
    renderPage();
  }

  function startAutoplay() {
    const totalPages = Math.ceil(reviews.length / REVIEWS_PER_PAGE) || 1;
    if (autoplayId || totalPages <= 1) return;
    autoplayId = setInterval(nextPage, 8000); // toutes les 8s
  }

  function stopAutoplay() {
    if (!autoplayId) return;
    clearInterval(autoplayId);
    autoplayId = null;
  }

  function resetAutoplay() {
    stopAutoplay();
    startAutoplay();
  }

  function scrollToSectionTop() {
    section.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  prevBtn.addEventListener("click", () => {
    prevPage();
    resetAutoplay();
    scrollToSectionTop();
  });

  nextBtn.addEventListener("click", () => {
    nextPage();
    resetAutoplay();
    scrollToSectionTop();
  });


  section.addEventListener("mouseenter", stopAutoplay);
  section.addEventListener("mouseleave", startAutoplay);
  section.addEventListener("focusin", stopAutoplay);
  section.addEventListener("focusout", startAutoplay);

  // Charge les avis depuis le JSON local
  // Adapte le chemin si tu l'as mis ailleurs : "/data/reviews.json"
  fetch("/reviews.json")
    .then((res) => res.json())
    .then((data) => {
      reviews = Array.isArray(data.reviews) ? data.reviews : [];

      if (!reviews.length) {
        reviewsContainer.textContent = "Pas encore d'avis à afficher.";
        prevBtn.disabled = true;
        nextBtn.disabled = true;
        return;
      }

      currentPage = 0;
      renderPage();
      startAutoplay();
    })
    .catch((err) => {
      console.error("Erreur chargement avis :", err);
      reviewsContainer.textContent =
        "Impossible de charger les avis Google pour le moment.";
      prevBtn.disabled = true;
      nextBtn.disabled = true;
    });
})();


})();