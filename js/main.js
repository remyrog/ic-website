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

  function applyHeroMobileSceneTuning() {
    const scene = document.querySelector(".scene");
    const sun = document.getElementById("sun");
    const car = document.getElementById("carHero");
    const roadBg = document.getElementById("roadBg");
    const roadDash = document.getElementById("roadDash");
    const roadPathHero = document.getElementById("roadPathHero");

    if (!scene || !sun || !car || !roadBg || !roadDash || !roadPathHero) return;

    const isMobile = window.matchMedia("(max-width: 760px)").matches;
    const isSmallMobile = window.matchMedia("(max-width: 560px)").matches;

    if (!isMobile) {
      scene.setAttribute("viewBox", "0 0 1440 810");

      sun.setAttribute("data-sun-duration", "25");
      sun.setAttribute("data-sun-arc", "15");
      sun.setAttribute("data-sun-margin", "120");
      sun.setAttribute("data-offset-y", "60");

      roadBg.setAttribute(
        "d",
        "M-50,720 C200,660 300,700 420,680 C550,660 620,600 720,610 C850,620 930,700 1040,690 C1150,680 1300,640 1500,660"
      );
      roadDash.setAttribute(
        "d",
        "M-50,720 C200,660 300,700 420,680 C550,660 620,600 720,610 C850,620 930,700 1040,690 C1150,680 1300,640 1500,660"
      );
      roadPathHero.setAttribute(
        "d",
        "M-50,720 C200,660 300,700 420,680 C550,660 620,600 720,610 C850,620 930,700 1040,690 C1150,680 1300,640 1500,660"
      );

      car.setAttribute("transform", "translate(-100,720) scale(1)");
      return;
    }

    if (isSmallMobile) {
      scene.setAttribute("viewBox", "0 0 1440 980");

      sun.setAttribute("data-sun-duration", "18");
      sun.setAttribute("data-sun-arc", "10");
      sun.setAttribute("data-sun-margin", "150");
      sun.setAttribute("data-offset-y", "92");

      roadBg.setAttribute(
        "d",
        "M-80,850 C120,810 250,800 380,780 C520,760 650,720 780,730 C930,742 1080,790 1220,800 C1320,808 1400,804 1520,790"
      );
      roadDash.setAttribute(
        "d",
        "M-80,850 C120,810 250,800 380,780 C520,760 650,720 780,730 C930,742 1080,790 1220,800 C1320,808 1400,804 1520,790"
      );
      roadPathHero.setAttribute(
        "d",
        "M-80,850 C120,810 250,800 380,780 C520,760 650,720 780,730 C930,742 1080,790 1220,800 C1320,808 1400,804 1520,790"
      );

      car.setAttribute("transform", "translate(-100,850) scale(0.78)");
      return;
    }

    scene.setAttribute("viewBox", "0 0 1440 920");

    sun.setAttribute("data-sun-duration", "20");
    sun.setAttribute("data-sun-arc", "12");
    sun.setAttribute("data-sun-margin", "135");
    sun.setAttribute("data-offset-y", "82");

    roadBg.setAttribute(
      "d",
      "M-80,800 C140,750 260,760 390,740 C540,720 650,680 790,690 C930,700 1080,748 1210,758 C1330,766 1420,760 1520,748"
    );
    roadDash.setAttribute(
      "d",
      "M-80,800 C140,750 260,760 390,740 C540,720 650,680 790,690 C930,700 1080,748 1210,758 C1330,766 1420,760 1520,748"
    );
    roadPathHero.setAttribute(
      "d",
      "M-80,800 C140,750 260,760 390,740 C540,720 650,680 790,690 C930,700 1080,748 1210,758 C1330,766 1420,760 1520,748"
    );

    car.setAttribute("transform", "translate(-100,800) scale(0.86)");
  }

  applyHeroMobileSceneTuning();

  (() => {
    const sun = document.getElementById("sun");
    if (!sun) return;

    const svg = sun.ownerSVGElement;
    let maxX = 0;
    let base = "";

    function readSettings() {
      return {
        duration: parseFloat(sun.dataset.sunDuration || "30"),
        arc: parseFloat(sun.dataset.sunArc || "22"),
        marginR: parseFloat(sun.dataset.sunMargin || "12"),
        offsetY: parseFloat(sun.dataset.offsetY || "108"),
      };
    }

    function refreshBaseTransform() {
      const current = sun.getAttribute("transform") || "";
      base = current.replace(/translate\([^)]+\)\s*rotate\([^)]+\)\s*$/i, "").trim();
    }

    function computeBounds() {
      if (!svg) return;

      const { marginR } = readSettings();
      const vb = svg.viewBox && svg.viewBox.baseVal ? svg.viewBox.baseVal : null;
      const width = vb ? vb.width : svg.clientWidth;

      let bb;
      try {
        bb = sun.getBBox();
      } catch {
        requestAnimationFrame(computeBounds);
        return;
      }

      maxX = Math.max(0, width - marginR - (bb.x + bb.width));
      refreshBaseTransform();
    }

    let x = 0;
    let dir = 1;
    let last = 0;

    function step(t) {
      if (!last) last = t;
      const dt = (t - last) / 1000;
      last = t;

      const { duration, arc, offsetY } = readSettings();
      const safeDuration = Math.max(0.1, duration);
      const speed = maxX / safeDuration;

      x += dir * speed * dt;

      if (x >= maxX) {
        x = maxX;
        dir = -1;
      }
      if (x <= 0) {
        x = 0;
        dir = 1;
      }

      const p = maxX > 0 ? x / maxX : 0;
      const y = offsetY + Math.sin(p * Math.PI) * -arc;
      const r = p * 180;

      sun.setAttribute("transform", `${base} translate(${x},${y}) rotate(${r})`.trim());

      requestAnimationFrame(step);
    }

    computeBounds();
    window.addEventListener("resize", computeBounds, { passive: true });
    requestAnimationFrame(step);
  })();

  const hasGSAP = typeof window.gsap !== "undefined";
  const hasScrollTrigger = typeof window.ScrollTrigger !== "undefined";
  const hasMotionPath = typeof window.MotionPathPlugin !== "undefined";

  const endEl =
    document.querySelector("#hero + .section") ||
    document.querySelectorAll(".section")[1] ||
    null;

  if (hasGSAP && hasScrollTrigger) {
    gsap.registerPlugin(window.ScrollTrigger);
  }
  if (hasGSAP && hasMotionPath) {
    gsap.registerPlugin(window.MotionPathPlugin);
  }

  let heroCarTween = null;

  function initHeroCarMotion() {
    if (!(hasGSAP && hasScrollTrigger && hasMotionPath)) return;

    const car = document.querySelector("#carHero");
    const road = document.querySelector("#roadPathHero");
    const hero = document.querySelector("#hero");

    if (!car || !road || !hero) return;

    if (heroCarTween) {
      heroCarTween.scrollTrigger?.kill();
      heroCarTween.kill();
      heroCarTween = null;
    }

    gsap.set(car, { clearProps: "x,y,rotation,rotationZ" });

    heroCarTween = gsap.to(car, {
      motionPath: {
        path: road,
        align: road,
        autoRotate: true,
        alignOrigin: [0.5, 0.5],
      },
      ease: "none",
      scrollTrigger: {
        trigger: hero,
        start: "top top",
        endTrigger: endEl || undefined,
        end: endEl ? "top top" : "+=800",
        scrub: true,
        invalidateOnRefresh: true,
        fastScrollEnd: true,
      },
    });

    window.ScrollTrigger.refresh();
  }

  initHeroCarMotion();

  let heroResizeTimer = null;
  window.addEventListener(
    "resize",
    () => {
      clearTimeout(heroResizeTimer);
      heroResizeTimer = setTimeout(() => {
        applyHeroMobileSceneTuning();
        initHeroCarMotion();
      }, 120);
    },
    { passive: true }
  );

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