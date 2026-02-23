(() => {
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  // 1) AnnÃ©e footer
  const y = $("#year");
  if (y) y.textContent = new Date().getFullYear();

  // 2) Preloader : disparaÃ®t dÃ¨s que tout est prÃªt
  setTimeout(() => {
    const pre = document.getElementById("preloader");
    if (pre) pre.classList.add("is-done");
  }, 3000);

  // 3) Scroll doux sur les liens internes
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

  // 5) Effet â€œmagnetâ€ â€” inertie + rotation
  const isTouch = "ontouchstart" in window;

  function initMagnets(root = document) {
    if (isTouch) return; // on Ã©vite sur mobile

    const magnets = root.querySelectorAll("[data-magnet]");
    magnets.forEach(el => {
      // empÃªchez une double initialisation
      if (el.__magnetInit) return;
      el.__magnetInit = true;

      const strength = parseFloat(el.dataset.magnet) || 30; // translation max (px)
      const maxRot = parseFloat(el.dataset.rotate) || 6;  // rotation max (deg)
      const damp = 0.14; // 0.10â€“0.20 = plus ou moins â€œressortâ€

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
        const nx = ((e.clientX - r.left) / r.width - 0.5) * 2; // -1..1
        const ny = ((e.clientY - r.top) / r.height - 0.5) * 2;
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

  // appel initial pour tout ce qui est dÃ©jÃ  en DOM
  initMagnets();

  // Soleil : dÃ©rive lente indÃ©pendante du scroll (aller-retour)
  (() => {
    const sun = document.getElementById('sun');
    if (!sun) return;

    const svg = sun.ownerSVGElement;
    const base = sun.getAttribute('transform') || '';

    // RÃ©glages (modifiable aussi via data-attrs)
    const duration = parseFloat(sun.dataset.sunDuration || '30'); // secondes pour lâ€™aller (gauche -> droite)
    const arc = parseFloat(sun.dataset.sunArc || '22');      // amplitude de lâ€™arc vertical
    const marginR = parseFloat(sun.dataset.sunMargin || '12');   // marge Ã  droite
    const offsetY = parseFloat(sun.dataset.offsetY || '108');     // â€œmarge hauteâ€ (pousse vers le bas)

    let maxX = 0;

    function computeBounds() {
      if (!svg) return;

      const vb = svg.viewBox && svg.viewBox.baseVal ? svg.viewBox.baseVal : null;
      const width = vb ? vb.width : svg.clientWidth;

      let bb;
      try {
        bb = sun.getBBox();
      } catch (e) {
        // Chrome peut throw si pas “rendered” au moment T → on réessaie au prochain frame
        requestAnimationFrame(computeBounds);
        return;
      }

      maxX = Math.max(0, (width - marginR) - (bb.x + bb.width));
    }

    // anim: on part de x=0 (position actuelle), on va jusquâ€™Ã  maxX, puis on revient (ping-pong)
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
      if (x <= 0) { x = 0; dir = 1; }

      const p = maxX > 0 ? (x / maxX) : 0;                  // 0..1 sur lâ€™aller
      const y = offsetY + Math.sin(p * Math.PI) * -arc;     // petit arc solaire
      const r = p * 180;                                    // rotation lÃ©gÃ¨re

      // ConcatÃ¨ne Ã  la transform dâ€™origine (ne casse pas la position de base)
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
      endTrigger: endEl,
      end: "top top",
      scrub: true,
      invalidateOnRefresh: true,
      fastScrollEnd: true
    }
  });

  // =========================
  //  Avis locaux Google
  // =========================
  (function initLocalReviews() {
    const section = document.getElementById("avis");
    if (!section) return;

    const reviewsContainer = section.querySelector(".reviews");
    const prevBtn = section.querySelector(".reviews__controls .prev");
    const nextBtn = section.querySelector(".reviews__controls .next");
    const avatarTemplate = document.getElementById("review-avatar-template");

    if (!reviewsContainer || !prevBtn || !nextBtn || !avatarTemplate) return;

    // Ã‰lÃ©ment du rÃ©sumÃ© (compteurs + Ã©toiles)
    const countEl = section.querySelector('[data-counter="count"]');
    const ratingEl = section.querySelector('[data-counter="rating"]');
    const summaryStars = section.querySelectorAll(".reviews__summary-star");

    // Stats globales
    const TOTAL_REVIEWS_COUNT = 52;
    const AVERAGE_RATING = 5;
    const REVIEWS_PER_PAGE = 5;

    let reviews = [];
    let currentPage = 0;
    let autoplayId = null;
    let countersStarted = false;
    let summaryLoopId = null;
    let countersLoopId = null;


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
      const stars = "\u2605\u2605\u2605\u2605\u2605".slice(0, rating);

      if (review.date) {
        const d = new Date(review.date);
        const formatted = d.toLocaleDateString("fr-FR");
        metaEl.textContent = `${name} \u2022 ${formatted} \u2022 ${stars}`;
      } else {
        metaEl.textContent = `${name} \u2022 ${stars}`;
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

      // Applique les effets "magnet" aux nouveaux blocs si la fonction existe
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

    // ---- Compteurs + Ã©toiles ----

    function animateCounter(el, target, duration) {
      if (!el) return;
      const start = 0;
      const startTime = performance.now();

      function frame(now) {
        const t = Math.min(1, (now - startTime) / duration);
        // easing type "easeOutCubic"
        const eased = 1 - Math.pow(1 - t, 3);
        const value = Math.round(start + (target - start) * eased);
        el.textContent = value.toString();
        if (t < 1) {
          requestAnimationFrame(frame);
        }
      }

      requestAnimationFrame(frame);
    }

    function animateStars(starsNodeList, max) {
      const stars = Array.from(starsNodeList);

      // reset
      stars.forEach((star) => {
        star.classList.remove("is-active");
      });

      // puis on rallume 1 par 1
      stars.forEach((star, index) => {
        if (index < max) {
          setTimeout(() => {
            star.classList.add("is-active");
          }, 180 * index);
        }
      });
    }

    function runCountersOnce() {
      animateCounter(countEl, TOTAL_REVIEWS_COUNT, 1100);
      animateCounter(ratingEl, AVERAGE_RATING, 800);
      animateStars(summaryStars, AVERAGE_RATING);
    }

    function startCountersLoop() {
      if (countersLoopId) return;

      // premier run immÃ©diat
      runCountersOnce();

      // puis relance toutes les 9 secondes
      countersLoopId = setInterval(runCountersOnce, 4000);
    }

    function startSummaryLoop() {
      if (summaryLoopId) return;
      const summaryBlock = section.querySelector(".reviews__summary");
      if (!summaryBlock) return;

      summaryLoopId = setInterval(() => {
        summaryBlock.classList.add("reviews__summary--bounce");
        setTimeout(() => {
          summaryBlock.classList.remove("reviews__summary--bounce");
        }, 700);
      }, 12000); // toutes les 12 secondes environ
    }

    function startCountersOnce() {
      if (countersStarted) return;
      countersStarted = true;

      startCountersLoop(); // compteurs + Ã©toiles en boucle
      startSummaryLoop();  // rebond en boucle du badge
    }


    function setupCountersTrigger() {
      if (!countEl || !ratingEl || !summaryStars.length) {
        return;
      }

      if ("IntersectionObserver" in window) {
        const io = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                startCountersOnce();
                io.disconnect();
              }
            });
          },
          { threshold: 0.4 }
        );
        io.observe(section);
      } else {
        // fallback : on lance directement
        startCountersOnce();
      }
    }

    // Charge les avis depuis le JSON local
    fetch("/reviews.json") // adapte si tu l'as mis ailleurs
      .then((res) => res.json())
      .then((data) => {
        reviews = Array.isArray(data.reviews) ? data.reviews : [];

        if (!reviews.length) {
          reviewsContainer.textContent = "Pas encore d'avis Ã  afficher.";
          prevBtn.disabled = true;
          nextBtn.disabled = true;
          return;
        }

        currentPage = 0;
        renderPage();
        startAutoplay();
        setupCountersTrigger();
      })
      .catch((err) => {
        console.error("Erreur chargement avis :", err);
        reviewsContainer.textContent =
          "Impossible de charger les avis Google pour le moment.";
        prevBtn.disabled = true;
        nextBtn.disabled = true;
      });
  })();

  // =========================
  // Mobile Menu (Apple vibe)
  // =========================
  (function initMobileMenu() {
    const nav = document.querySelector(".nav");
    const btn = document.querySelector(".nav__burger");
    const mnav = document.getElementById("mnav");
    if (!nav || !btn || !mnav) return;

    const sheet = mnav.querySelector(".mnav__sheet");
    const backdrop = mnav.querySelector(".mnav__backdrop");
    const closeEls = mnav.querySelectorAll("[data-close]");
    const links = mnav.querySelectorAll("a[data-scrolllink]");

    if (!sheet || !backdrop) return;

    // -------------------------
    // Helpers: lock/unlock scroll (iOS safe)
    // -------------------------
    let scrollY = 0;
    const lockScroll = () => {
      scrollY = window.scrollY || document.documentElement.scrollTop || 0;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.width = "100%";
    };

    const unlockScroll = () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.width = "";
      window.scrollTo(0, scrollY);
    };

    // -------------------------
    // Magnet / tilt: only desktop (pas sur tactile)
    // -------------------------
    const isTouch =
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia("(hover: none) and (pointer: coarse)").matches;

    if (!isTouch) {
      const magnets = mnav.querySelectorAll("[data-magnet]");
      magnets.forEach((el) => {
        const icon = el.querySelector(".mnav__icon svg");
        let raf = null;

        const move = (ev) => {
          const r = el.getBoundingClientRect();
          const x = ev.clientX - (r.left + r.width / 2);
          const y = ev.clientY - (r.top + r.height / 2);

          const dx = Math.max(-18, Math.min(18, (x / (r.width / 2)) * 18));
          const dy = Math.max(-10, Math.min(10, (y / (r.height / 2)) * 10));

          if (raf) cancelAnimationFrame(raf);
          raf = requestAnimationFrame(() => {
            gsap.to(el, { x: dx * 0.35, y: dy * 0.25, duration: 0.25, ease: "power2.out" });
            if (icon) gsap.to(icon, { rotate: dx * 0.35, y: -Math.abs(dy) * 0.12, duration: 0.25, ease: "power2.out" });
          });
        };

        const leave = () => {
          gsap.to(el, { x: 0, y: 0, duration: 0.35, ease: "elastic.out(1, 0.7)" });
          if (icon) gsap.to(icon, { rotate: 0, y: 0, duration: 0.35, ease: "elastic.out(1, 0.7)" });
        };

        el.addEventListener("mousemove", move);
        el.addEventListener("mouseleave", leave);

        el.addEventListener("mouseenter", () => {
          if (!icon) return;
          gsap.fromTo(
            icon,
            { rotate: -6 },
            { rotate: 6, duration: 0.18, yoyo: true, repeat: 3, ease: "power1.inOut" }
          );
        });
      });
    }

    // -------------------------
    // Open/close
    // -------------------------
    let isOpen = false;

    const openMenu = () => {
      if (isOpen) return;
      isOpen = true;

      // State + a11y
      mnav.classList.add("is-open");
      nav.classList.add("is-menu-open");
      btn.setAttribute("aria-expanded", "true");
      mnav.setAttribute("aria-hidden", "false");

      // Lock page scroll
      lockScroll();

      if (navigator.vibrate) navigator.vibrate(12);

      // Animations
      gsap.killTweensOf(sheet);
      gsap.fromTo(
        sheet,
        { y: -14, scale: 0.985, opacity: 0 },
        { y: 0, scale: 1, opacity: 1, duration: 0.55, ease: "elastic.out(1, 0.85)" }
      );

      mnav.querySelectorAll(".mnav__item").forEach((el, idx) => el.style.setProperty("--i", idx));

      const items = mnav.querySelectorAll(".mnav__item");
      gsap.fromTo(
        items,
        { y: 18, opacity: 0, scale: 0.985, rotateX: -8, transformOrigin: "50% 0%" },
        { y: 0, opacity: 1, scale: 1, rotateX: 0, duration: 0.38, ease: "power3.out", stagger: 0.06, delay: 0.05 }
      );

      const icons = mnav.querySelectorAll(".mnav__icon svg");
      gsap.fromTo(
        icons,
        { scale: 0.6, rotate: -18, y: 6, opacity: 0 },
        { scale: 1, rotate: 0, y: 0, opacity: 1, duration: 0.55, ease: "elastic.out(1, 0.55)", stagger: 0.05, delay: 0.12 }
      );
    };

    const closeMenu = (afterClose) => {
      if (!isOpen) { if (typeof afterClose === "function") afterClose(); return; }
      isOpen = false;

      btn.setAttribute("aria-expanded", "false");

      gsap.killTweensOf(sheet);
      gsap.to(sheet, {
        y: -16,
        scale: 0.985,
        opacity: 0,
        duration: 0.22,
        ease: "power2.in",
        onComplete: () => {
          mnav.classList.remove("is-open");
          nav.classList.remove("is-menu-open");
          mnav.setAttribute("aria-hidden", "true");

          unlockScroll();

          if (typeof afterClose === "function") afterClose();
        }
      });

      if (navigator.vibrate) navigator.vibrate(8);
    };

    // -------------------------
    // Events
    // -------------------------
    btn.addEventListener("click", () => (isOpen ? closeMenu() : openMenu()));
    backdrop.addEventListener("click", closeMenu);
    closeEls.forEach((el) => el.addEventListener("click", closeMenu));

    // clic sur un lien interne => fermer puis scroll (sinon unlockScroll remet au scroll précédent)
    links.forEach((a) => {
      a.addEventListener("click", (e) => {
        const href = a.getAttribute("href");
        if (!href || !href.startsWith("#")) return;

        // IMPORTANT: on neutralise le handler global [data-scrolllink]
        e.preventDefault();
        e.stopPropagation();

        const targetEl = document.querySelector(href);

        // on ferme d'abord, puis on scroll après unlock
        closeMenu(() => {
          if (!targetEl) return;
          // laisse un micro temps au repaint iOS
          requestAnimationFrame(() => {
            targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
          });
        });
      }, { passive: false });
    });

    // CTA contact (data-reserve-trigger) => fermer puis laisser reserve-modal ouvrir
    mnav.addEventListener("click", (e) => {
      const target = e.target;
      if (!(target instanceof Element)) return;

      const trigger = target.closest("[data-reserve-trigger]");
      if (!trigger) return;

      // anti-boucle: 2e clic programmatique doit passer au plugin reserve-modal
      if (trigger.dataset.rmForward === "1") return;

      e.preventDefault();
      e.stopPropagation();

      trigger.dataset.rmForward = "1";

      closeMenu(() => {
        // après fermeture: on relance le click pour que reserve-modal.js ouvre la modale
        setTimeout(() => {
          trigger.click();
          trigger.dataset.rmForward = "";
        }, 0);
      });
    }, { passive: false });

    // ESC
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMenu();
    });

    // Peek (optionnel, tu peux supprimer ce bloc si tu veux)
    let lastScroll = window.scrollY;
    let peeked = false;
    window.addEventListener(
      "scroll",
      () => {
        if (isOpen) return;
        const now = window.scrollY;
        const up = now < lastScroll;
        lastScroll = now;

        if (window.matchMedia("(max-width: 760px)").matches && up && now > 120 && !peeked) {
          peeked = true;
          gsap.fromTo(btn, { y: 0 }, { y: -6, duration: 0.18, yoyo: true, repeat: 1, ease: "power2.out" });
          setTimeout(() => (peeked = false), 1600);
        }
      },
      { passive: true }
    );
  })();

})();