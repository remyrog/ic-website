(() => {
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  // 1) Année footer
  const y = $("#year");
  if (y) y.textContent = new Date().getFullYear();

  // 2) Preloader : disparaît après un petit délai (comportement actuel conservé)
  setTimeout(() => {
    const pre = document.getElementById("preloader");
    if (pre) pre.classList.add("is-done");
  }, 3000);

  // 3) Scroll doux sur les liens internes
  $$("[data-scrolllink]").forEach((a) => {
    if (a.closest(".mnav")) return;

    a.addEventListener(
      "click",
      (e) => {
        const href = a.getAttribute("href");
        if (!href || !href.startsWith("#")) return;
        e.preventDefault();
        const target = $(href);
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      },
      { passive: false }
    );
  });

  // 4) Barre de progression en bas de la nav
  const bar = $(".progress span");
  const updateProgress = () => {
    if (!bar) return;
    const h = document.documentElement;
    const scrolled = h.scrollTop || document.body.scrollTop || 0;
    const height = h.scrollHeight - h.clientHeight;
    const pct = height > 0 ? Math.min(100, Math.max(0, (scrolled / height) * 100)) : 0;
    bar.style.width = pct + "%";
  };
  window.addEventListener("scroll", updateProgress, { passive: true });
  updateProgress();

  // 5) Effet “magnet” — inertie + rotation (desktop only)
  const isTouch =
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    window.matchMedia("(hover: none) and (pointer: coarse)").matches;

  function initMagnets(root = document) {
    if (isTouch) return; // on évite sur tactile

    const magnets = root.querySelectorAll("[data-magnet]");
    magnets.forEach((el) => {
      // empêche une double initialisation
      if (el.__magnetInit) return;
      el.__magnetInit = true;

      const strength = parseFloat(el.dataset.magnet) || 30; // translation max (px)
      const maxRot = parseFloat(el.dataset.rotate) || 6; // rotation max (deg)
      const damp = 0.14; // 0.10–0.20 = plus ou moins “ressort”

      let tx = 0,
        ty = 0,
        rx = 0;
      let txT = 0,
        tyT = 0,
        rxT = 0;
      let raf = 0;

      const animate = () => {
        tx += (txT - tx) * damp;
        ty += (tyT - ty) * damp;
        rx += (rxT - rx) * damp;

        // NOTE: écrase transform inline sur l'élément (comme ta version actuelle)
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

      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const nx = ((e.clientX - r.left) / r.width - 0.5) * 2; // -1..1
        const ny = ((e.clientY - r.top) / r.height - 0.5) * 2;
        txT = nx * strength;
        tyT = ny * strength;
        rxT = -nx * maxRot;
        if (!raf) raf = requestAnimationFrame(animate);
      });

      el.addEventListener("mouseleave", () => {
        txT = 0;
        tyT = 0;
        rxT = 0;
        if (!raf) raf = requestAnimationFrame(animate);
      });
    });
  }

  initMagnets();

  const hasGSAP = typeof window.gsap !== "undefined";

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

    // Éléments du résumé (compteurs + étoiles)
    const countEl = section.querySelector('[data-counter="count"]');
    const ratingEl = section.querySelector('[data-counter="rating"]');
    const summaryStars = section.querySelectorAll(".reviews__summary-star");

    // Stats globales
    const TOTAL_REVIEWS_COUNT = 55;
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
        review.comment && review.comment.trim().length ? review.comment.trim() : "Avis sans commentaire texte.";

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
        reviewsContainer.appendChild(createReviewElement(review));
      });

      // Applique les effets "magnet" aux nouveaux blocs
      initMagnets(reviewsContainer);
    }

    function nextPage() {
      const totalPages = Math.ceil(reviews.length / REVIEWS_PER_PAGE) || 1;
      currentPage = (currentPage + 1) % totalPages;
      renderPage();
    }

    function prevPage() {
      const totalPages = Math.ceil(reviews.length / REVIEWS_PER_PAGE) || 1;
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
      section.scrollIntoView({ behavior: "smooth", block: "start" });
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

    // ---- Compteurs + étoiles ----

    function animateCounter(el, target, duration) {
      if (!el) return;
      const start = 0;
      const startTime = performance.now();

      function frame(now) {
        const t = Math.min(1, (now - startTime) / duration);
        const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
        const value = Math.round(start + (target - start) * eased);
        el.textContent = value.toString();
        if (t < 1) requestAnimationFrame(frame);
      }

      requestAnimationFrame(frame);
    }

    function animateStars(starsNodeList, max) {
      const stars = Array.from(starsNodeList);
      stars.forEach((star) => star.classList.remove("is-active"));
      stars.forEach((star, index) => {
        if (index < max) {
          setTimeout(() => star.classList.add("is-active"), 180 * index);
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

      // premier run immédiat
      runCountersOnce();

      // puis relance régulièrement
      countersLoopId = setInterval(runCountersOnce, 4000);
    }

    function startSummaryLoop() {
      if (summaryLoopId) return;
      const summaryBlock = section.querySelector(".reviews__summary");
      if (!summaryBlock) return;

      summaryLoopId = setInterval(() => {
        summaryBlock.classList.add("reviews__summary--bounce");
        setTimeout(() => summaryBlock.classList.remove("reviews__summary--bounce"), 700);
      }, 12000);
    }

    function startCountersIfNeeded() {
      if (countersStarted) return;
      countersStarted = true;

      startCountersLoop();
      startSummaryLoop();
    }

    function setupCountersTrigger() {
      if (!countEl || !ratingEl || !summaryStars.length) return;

      if ("IntersectionObserver" in window) {
        const io = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                startCountersIfNeeded();
                io.disconnect();
              }
            });
          },
          { threshold: 0.4 }
        );
        io.observe(section);
      } else {
        startCountersIfNeeded();
      }
    }

    // Charge les avis depuis le JSON local
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
        setupCountersTrigger();
      })
      .catch((err) => {
        console.error("Erreur chargement avis :", err);
        reviewsContainer.textContent = "Impossible de charger les avis Google pour le moment.";
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

    // Helpers: lock/unlock scroll (iOS safe)
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

    // Magnet / tilt: only desktop (pas sur tactile)
    const isTouchLocal =
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia("(hover: none) and (pointer: coarse)").matches;

    if (!isTouchLocal) {
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
            if (!hasGSAP) return;
            gsap.to(el, { x: dx * 0.35, y: dy * 0.25, duration: 0.25, ease: "power2.out" });
            if (icon) gsap.to(icon, { rotate: dx * 0.35, y: -Math.abs(dy) * 0.12, duration: 0.25, ease: "power2.out" });
          });
        };

        const leave = () => {
          if (!hasGSAP) return;
          gsap.to(el, { x: 0, y: 0, duration: 0.35, ease: "elastic.out(1, 0.7)" });
          if (icon) gsap.to(icon, { rotate: 0, y: 0, duration: 0.35, ease: "elastic.out(1, 0.7)" });
        };

        el.addEventListener("mousemove", move);
        el.addEventListener("mouseleave", leave);

        el.addEventListener("mouseenter", () => {
          if (!hasGSAP || !icon) return;
          gsap.fromTo(
            icon,
            { rotate: -6 },
            { rotate: 6, duration: 0.18, yoyo: true, repeat: 3, ease: "power1.inOut" }
          );
        });
      });
    }

    // Open/close
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

      if (!hasGSAP) return;

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
      if (!isOpen) {
        if (typeof afterClose === "function") afterClose();
        return;
      }
      isOpen = false;

      btn.setAttribute("aria-expanded", "false");

      if (!hasGSAP) {
        mnav.classList.remove("is-open");
        nav.classList.remove("is-menu-open");
        mnav.setAttribute("aria-hidden", "true");
        unlockScroll();
        if (typeof afterClose === "function") afterClose();
        return;
      }

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
        },
      });

      if (navigator.vibrate) navigator.vibrate(8);
    };

    // Events
    btn.addEventListener("click", () => (isOpen ? closeMenu() : openMenu()));
    backdrop.addEventListener("click", () => closeMenu());
    closeEls.forEach((el) => el.addEventListener("click", () => closeMenu()));

    // clic sur un lien interne => fermer puis scroll (sinon unlockScroll remet au scroll précédent)
    links.forEach((a) => {
      a.addEventListener(
        "click",
        (e) => {
          const href = a.getAttribute("href");
          if (!href || !href.startsWith("#")) return;

          // IMPORTANT: on neutralise le handler global [data-scrolllink]
          e.preventDefault();
          e.stopPropagation();

          const targetEl = document.querySelector(href);

          // on ferme d'abord, puis on scroll après unlock
          closeMenu(() => {
            if (!targetEl) return;
            requestAnimationFrame(() => {
              targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
            });
          });
        },
        { passive: false }
      );
    });

    // CTA contact (data-reserve-trigger) => fermer puis laisser reserve-modal ouvrir
    mnav.addEventListener(
      "click",
      (e) => {
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
          setTimeout(() => {
            trigger.click();
            trigger.dataset.rmForward = "";
          }, 0);
        });
      },
      { passive: false }
    );

    // ESC
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMenu();
    });

    // Peek (optionnel)
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
          if (hasGSAP) gsap.fromTo(btn, { y: 0 }, { y: -6, duration: 0.18, yoyo: true, repeat: 1, ease: "power2.out" });
          setTimeout(() => (peeked = false), 1600);
        }
      },
      { passive: true }
    );
  })();

  window.initMagnets = initMagnets;
})();

(() => {
  const $ = (sel, ctx = document) => ctx.querySelector(sel);

  const hasGSAP = typeof window.gsap !== "undefined";
  const hasScrollTrigger = typeof window.ScrollTrigger !== "undefined";
  const hasMotionPath = typeof window.MotionPathPlugin !== "undefined";

  if (hasGSAP && hasScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);
  if (hasGSAP && hasMotionPath) gsap.registerPlugin(window.MotionPathPlugin);

  const scene = $(".scene");
  const sun = $("#sun");
  const sunPath = $("#sunPath");
  const sunRays = $("#sunRays");
  const roadBg = $("#roadBg");
  const roadDash = $("#roadDash");
  const roadPathHero = $("#roadPathHero");
  const car = $("#carHero");
  const hero = $("#hero");

  if (!scene || !sun || !sunPath || !sunRays || !roadBg || !roadDash || !roadPathHero || !car || !hero) return;

  let heroSunTween = null;
  let heroSunSpinTween = null;
  let heroCarTween = null;

  const mqMobile = window.matchMedia("(max-width: 760px)");
  const mqSmall = window.matchMedia("(max-width: 560px)");

  function getHeroConfig() {
    const isMobile = mqMobile.matches;
    const isSmall = mqSmall.matches;

    if (!isMobile) {
      return {
        viewBox: "0 0 1440 810",
        preserve: "xMidYMid meet",
        sunPath: "M 220 110 C 520 40 900 70 1240 190",
        road: "M-50,720 C200,660 300,700 420,680 C550,660 620,600 720,610 C850,620 930,700 1040,690 C1150,680 1300,640 1500,660",
        carTransform: "translate(-100,720) scale(1)",
        sunScale: 1,
        sunStart: 0.06,
        sunEnd: 0.94,
        sunDuration: 12
      };
    }

    if (isSmall) {
      return {
        viewBox: "0 0 1440 860",
        preserve: "xMidYMid slice",
        sunPath: "M 430 92 C 610 54 820 48 1010 60 C 1140 68 1235 84 1310 106",
        road: "M-120,842 C60,810 210,820 360,820 C520,820 635,725 760,690 C900,660 1025,750 1150,790 C1270,826 1390,786 1605,760",
        carTransform: "translate(-118,842) scale(0.68)",
        sunScale: 0.46,
        sunStart: 0.16,
        sunEnd: 0.74,
        sunDuration: 9.5
      };
    }

    return {
      viewBox: "0 0 1440 860",
      preserve: "xMidYMid slice",
      sunPath: "M 380 98 C 590 52 820 42 1030 56 C 1175 66 1285 86 1370 114",
      road: "M-110,800 C70,770 220,780 380,778 C545,776 665,688 795,652 C935,622 1060,706 1185,748 C1300,786 1410,754 1610,726",
      carTransform: "translate(-108,800) scale(0.74)",
      sunScale: 0.52,
      sunStart: 0.14,
      sunEnd: 0.78,
      sunDuration: 10.2
    };
  }

  function applyHeroGeometry() {
    const cfg = getHeroConfig();

    scene.setAttribute("viewBox", cfg.viewBox);
    scene.setAttribute("preserveAspectRatio", cfg.preserve);

    sunPath.setAttribute("d", cfg.sunPath);
    roadBg.setAttribute("d", cfg.road);
    roadDash.setAttribute("d", cfg.road);
    roadPathHero.setAttribute("d", cfg.road);
    car.setAttribute("transform", cfg.carTransform);

    const sunSprite = $("#sunSprite");
    if (sunSprite) {
      sunSprite.style.transformBox = "fill-box";
      sunSprite.style.transformOrigin = "center";
      sunSprite.style.transform = `scale(${cfg.sunScale})`;
    }
  }

  function initHeroSunMotion() {
    if (!(hasGSAP && hasMotionPath)) return;

    const cfg = getHeroConfig();

    heroSunTween?.kill();
    heroSunSpinTween?.kill();

    // on nettoie seulement ce qui est nécessaire
    gsap.set(sun, {
      clearProps: "x,y,rotation",
      transformOrigin: "50% 50%"
    });

    heroSunTween = gsap.to(sun, {
      duration: cfg.sunDuration,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      motionPath: {
        path: sunPath,
        align: sunPath,
        alignOrigin: [0.5, 0.5],
        autoRotate: false,
        start: cfg.sunStart,
        end: cfg.sunEnd
      }
    });

    // rotation indépendante et persistante des rayons
    heroSunSpinTween = gsap.to(sunRays, {
      rotation: 360,
      transformOrigin: "50% 50%",
      duration: 18,
      repeat: -1,
      ease: "none"
    });
  }

  function initHeroCarMotion() {
    if (!(hasGSAP && hasScrollTrigger && hasMotionPath)) return;

    const endEl =
      document.querySelector("#hero + .section") ||
      document.querySelectorAll(".section")[1] ||
      null;

    heroCarTween?.scrollTrigger?.kill();
    heroCarTween?.kill();

    gsap.set(car, { x: 0, y: 0, rotation: 0, rotationZ: 0 });

    heroCarTween = gsap.to(car, {
      motionPath: {
        path: roadPathHero,
        align: roadPathHero,
        autoRotate: true,
        alignOrigin: [0.5, 0.5]
      },
      ease: "none",
      scrollTrigger: {
        trigger: hero,
        start: "top top",
        endTrigger: endEl || undefined,
        end: endEl ? "top top" : "+=800",
        scrub: true,
        invalidateOnRefresh: true,
        fastScrollEnd: true
      }
    });

    window.ScrollTrigger.refresh();
  }

  function initHeroAll() {
    applyHeroGeometry();
    initHeroSunMotion();
    initHeroCarMotion();
  }

  initHeroAll();

  // IMPORTANT :
  // Sur mobile, le navigateur déclenche des resize pendant le scroll
  // (barres d’URL, viewport dynamique). On ignore ces faux resize.
  let lastWidth = window.innerWidth;
  let lastHeight = window.innerHeight;
  let resizeTimer = null;

  window.addEventListener("resize", () => {
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;

    const widthChanged = Math.abs(newWidth - lastWidth) > 8;
    const heightChanged = Math.abs(newHeight - lastHeight) > 120;

    lastWidth = newWidth;
    lastHeight = newHeight;

    // En mobile, on ne relance pas tout pour les petits changements de hauteur
    // liés au scroll tactile / UI browser.
    if (mqMobile.matches && !widthChanged && !heightChanged) {
      return;
    }

    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      initHeroAll();
    }, 140);
  }, { passive: true });
})();