// Preloader
(() => {
  if (typeof window.initPremiumLoader === "function") {
    window.initPremiumLoader({
      duration: 5000
    });
  }
})();

// Main
(() => {
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const hasGSAP = typeof window.gsap !== "undefined";

  // Année footer
  const y = $("#year");
  if (y) y.textContent = new Date().getFullYear();

  function getScrollOffset() {
    const nav = document.querySelector(".nav");
    if (!nav) return 24;

    const navRect = nav.getBoundingClientRect();
    return Math.ceil(navRect.height + 24);
  }

  function scrollToTarget(target) {
    if (!target) return;

    const offset = getScrollOffset();
    const y = window.scrollY + target.getBoundingClientRect().top - offset;

    window.scrollTo({
      top: Math.max(0, y),
      behavior: "smooth"
    });
  }

  $$("[data-scrolllink]").forEach((a) => {
    if (a.closest(".mnav")) return;

    a.addEventListener(
      "click",
      (e) => {
        const href = a.getAttribute("href");
        if (!href || !href.startsWith("#")) return;

        e.preventDefault();
        const target = $(href);
        scrollToTarget(target);
      },
      { passive: false }
    );
  });

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

  const isTouch =
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    window.matchMedia("(hover: none) and (pointer: coarse)").matches;

  function initMagnets(root = document) {
    if (isTouch) return;

    const magnets = root.querySelectorAll("[data-magnet]");
    magnets.forEach((el) => {
      if (el.__magnetInit) return;
      el.__magnetInit = true;

      const strength = parseFloat(el.dataset.magnet) || 30;
      const maxRot = parseFloat(el.dataset.rotate) || 6;
      const damp = 0.14;

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

      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const nx = ((e.clientX - r.left) / r.width - 0.5) * 2;
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

  window.siteUtils = {
    $,
    $$,
    hasGSAP,
    scrollToTarget,
    initMagnets
  };
})();

// Hero : Soleil & Voiture
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
  const sunSprite = $("#sunSprite");
  const sunFace = $("#sunFace");
  const roadBg = $("#roadBg");
  const roadDash = $("#roadDash");
  const roadPathHero = $("#roadPathHero");
  const car = $("#carHero");
  const hero = $("#hero");

  if (
    !scene ||
    !sun ||
    !sunPath ||
    !sunSprite ||
    !sunFace ||
    !roadBg ||
    !roadDash ||
    !roadPathHero ||
    !car ||
    !hero
  ) return;

  let heroSunTween = null;
  let heroSunSpinTween = null;
  let heroFaceCounterTween = null;
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
        sunPath: "M 220 165 C 520 95 900 120 1240 245",
        road: "M-50,760 C200,700 300,740 420,720 C550,700 620,640 720,650 C850,660 930,740 1040,730 C1150,720 1300,680 1500,700",
        carTransform: "translate(-100,760) scale(1)",
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
        sunPath: "M 390 150 C 555 115 740 110 915 118 C 1035 124 1135 138 1220 158",
        road: "M-120,870 C60,838 210,848 360,848 C520,848 635,753 760,718 C900,688 1025,778 1150,818 C1270,854 1390,814 1605,790",
        carTransform: "translate(-118,870) scale(0.68)",
        sunScale: 0.46,
        sunStart: 0.10,
        sunEnd: 0.62,
        sunDuration: 8.8
      };
    }

    return {
      viewBox: "0 0 1440 860",
      preserve: "xMidYMid slice",
      sunPath: "M 380 145 C 590 100 820 92 1030 108 C 1175 118 1285 140 1370 170",
      road: "M-110,835 C70,805 220,815 380,813 C545,811 665,723 795,687 C935,657 1060,741 1185,783 C1300,821 1410,789 1610,761",
      carTransform: "translate(-108,835) scale(0.74)",
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

    gsap.set(sunSprite, {
      scale: cfg.sunScale,
      svgOrigin: "0 0",
      force3D: false
    });

    gsap.set(sunFace, {
      svgOrigin: "0 0",
      force3D: false
    });
  }

  function initHeroSunMotion() {
    if (!(hasGSAP && hasMotionPath)) return;

    const cfg = getHeroConfig();

    heroSunTween?.kill();
    heroSunSpinTween?.kill();
    heroFaceCounterTween?.kill();

    gsap.set(sun, {
      clearProps: "transform,x,y,rotation,rotate",
      force3D: false
    });

    gsap.set(sunSprite, {
      clearProps: "rotation,rotate",
      svgOrigin: "0 0",
      force3D: false
    });

    gsap.set(sunFace, {
      clearProps: "rotation,rotate",
      svgOrigin: "0 0",
      force3D: false
    });

    heroSunTween = gsap.to(sun, {
      duration: cfg.sunDuration,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      motionPath: {
        path: sunPath,
        autoRotate: false,
        start: cfg.sunStart,
        end: cfg.sunEnd
      }
    });

    heroSunSpinTween = gsap.to(sunSprite, {
      rotation: 360,
      duration: 18,
      repeat: -1,
      ease: "none",
      svgOrigin: "0 0"
    });

    heroFaceCounterTween = gsap.to(sunFace, {
      rotation: -360,
      duration: 18,
      repeat: -1,
      ease: "none",
      svgOrigin: "0 0"
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

    if (mqMobile.matches && !widthChanged && !heightChanged) return;

    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      initHeroAll();
    }, 140);
  }, { passive: true });
})();

// Mobile Menu
(() => {

  const { hasGSAP, scrollToTarget } = window.siteUtils || {};

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
              scrollToTarget(targetEl);
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
})();

//  Avis Google
(() => {
  const { initMagnets, scrollToTarget } = window.siteUtils || {};

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
      scrollToTarget(section);
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
})();
