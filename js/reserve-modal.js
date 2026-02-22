/**
 * Réserver : Flip card modal (GSAP)
 * - Triggers: #reserve-btn (mailto fallback) + [data-reserve-trigger]
 * - Robust: event delegation (works even if href="" or elements injected later)
 * - UX: close (click outside / ESC), focus trap, copy email, WhatsApp deep-link
 */
(() => {
  "use strict";

  const TRIGGER_SELECTOR = "#reserve-btn, [data-reserve-trigger]";
  const EMAIL = "informatiquecerdagne@gmail.com";
  const PHONE_FR = "0698998001";
  const WA_E164 = "33698998001"; // sans "+" et sans espaces
  const WA_PREFILL = "Bonjour, je souhaite réserver un créneau pour parler de mon projet.";
  const WA_URL = `https://wa.me/${WA_E164}?text=${encodeURIComponent(WA_PREFILL)}`;

  // Réglages timing
  const FLIP_START_AT = 5;     // seconds (front visible before flip)
  const FLIP_DUR_IN = 0.55;
  const FLIP_DUR_OUT = 0.55;
  const FACE_SWAP_EPS = 0.05;

  // Scroll lock (préserve la position, iOS-friendly)
  let scrollYBeforeLock = 0;
  function lockScroll() {
    scrollYBeforeLock = window.scrollY || window.pageYOffset || 0;
    document.documentElement.classList.add("reserve-scroll-lock");
    document.body.classList.add("reserve-scroll-lock");
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollYBeforeLock}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
  }

  function unlockScroll() {
    document.documentElement.classList.remove("reserve-scroll-lock");
    document.body.classList.remove("reserve-scroll-lock");
    const top = document.body.style.top;
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    document.body.style.width = "";
    const y = top ? Math.abs(parseInt(top, 10)) : scrollYBeforeLock;
    window.scrollTo(0, Number.isFinite(y) ? y : scrollYBeforeLock);
  }

  const focusableSelector = [
    'a[href]:not([tabindex="-1"])',
    'button:not([disabled])',
    'input:not([disabled])',
    'textarea:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(",");

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function q(id) { return document.getElementById(id); }

  function createModal() {
    const overlay = document.createElement("div");
    overlay.className = "reserve-overlay";
    overlay.id = "reserve-overlay";
    overlay.hidden = true;

    overlay.innerHTML = `
      <div class="reserve-backdrop" data-reserve-close="true"></div>

      <div class="reserve-dialog" role="dialog" aria-modal="true" aria-labelledby="reserve-title">
        <button class="reserve-close" type="button" aria-label="Fermer" data-reserve-close="true">×</button>

        <div class="reserve-flip">
          <div class="reserve-flip-inner">
            <div class="reserve-face reserve-front" aria-hidden="false">
              <div class="reserve-front-badge">Réservation</div>
              <div class="reserve-front-title">Parlons de votre projet</div>
              <div class="reserve-front-sub">Réponse sous 48h ouvrées.</div>
              <div class="reserve-front-meta">Le premier contact ne vend rien : il ouvre une confiance.</div>
              <div class="reserve-front-loader" aria-hidden="true">
                <span class="reserve-front-loader-label">Chargement de la confiance...</span>
                <span class="reserve-front-dots" aria-hidden="true">
                  <i></i><i></i><i></i>
                </span>
              </div>
            </div>

            <div class="reserve-face reserve-back" aria-hidden="true">
              <h3 id="reserve-title" class="reserve-title">Contact direct</h3>
              <p class="reserve-subtitle">La relation commence au moment où l’on se sent écouté.</p>

              <div class="reserve-block">
                <div class="reserve-row">
                  <a href="mailto:${EMAIL}" class="reserve-mail">${EMAIL}</a>
                  <button class="reserve-btn reserve-btn--ghost reserve-btn--sm" type="button" data-copy="${EMAIL}">
                    Copier l’email
                  </button>
                </div>
              </div>

              <div class="reserve-actions">
                <a class="reserve-btn reserve-btn--primary" href="${WA_URL}" target="_blank" rel="noopener">
                  Écrire sur WhatsApp
                </a>
                <a class="reserve-btn reserve-btn--ghost" href="tel:${PHONE_FR}">
                  Appeler : ${PHONE_FR}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    `.trim();

    document.body.appendChild(overlay);
    return overlay;
  }

  function trapFocus(container, e) {
    if (e.key !== "Tab") return;
    const focusables = Array.from(container.querySelectorAll(focusableSelector))
      .filter(el => !el.hasAttribute("disabled") && el.getAttribute("aria-hidden") !== "true");

    if (!focusables.length) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  async function copyToClipboard(text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (_) { }

    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.top = "-9999px";
    ta.setAttribute("readonly", "true");
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      return true;
    } catch (_) {
      return false;
    } finally {
      document.body.removeChild(ta);
    }
  }

  function boot() {
    const triggersNow = Array.from(document.querySelectorAll(TRIGGER_SELECTOR));
    if (!triggersNow.length) return;

    let overlay = q("reserve-overlay");
    if (!overlay) overlay = createModal();

    const dialog = overlay.querySelector(".reserve-dialog");
    const inner = overlay.querySelector(".reserve-flip-inner");
    const back = overlay.querySelector(".reserve-back");
    const front = overlay.querySelector(".reserve-front");

    function syncCardHeight() {
      const hFront = front ? front.scrollHeight : 0;
      const hBack = back ? back.scrollHeight : 0;
      const h = Math.max(hFront, hBack);
      if (h > 0) inner.style.setProperty("--reserve-card-h", `${h}px`);
    }

    function resetFrontState() {
      // Toujours repartir “front” visible et flip à 0
      setFaceState(false);

      // Reset inline styles du dialog/overlay (au cas où)
      overlay.style.opacity = "";
      dialog.style.transform = "";

      const loader = overlay.querySelector(".reserve-front-loader");
      if (loader) {
        // Remet le loader visible
        loader.style.opacity = "1";
        loader.style.transform = "translateY(0)";
      }

      // Relance l’animation CSS des dots (utile si certains navigateurs figent)
      const dots = overlay.querySelector(".reserve-front-dots");
      if (dots) {
        dots.style.animation = "none";
        // force reflow
        void dots.offsetHeight;
        dots.style.animation = "";
      }
    }

    function resetGsapFrontState(dx, dy) {
      // Prépare l’état initial “fly-in depuis le bouton”
      window.gsap.set(dialog, {
        x: dx, y: dy, scale: 0.22,
        rotateX: -16, rotateY: 14, rotateZ: 2,
        z: -220,
        filter: "blur(10px)",
        transformOrigin: "50% 50%"
      });
      window.gsap.set(inner, { rotateY: 0, rotateX: 0, transformOrigin: "50% 50%" });
      window.gsap.set(overlay, { opacity: 0 });

      const loader = overlay.querySelector(".reserve-front-loader");
      if (loader) {
        window.gsap.set(loader, { opacity: 1, y: 0, clearProps: "transform" });
      }
    }

    let lastFocus = null;
    let isOpen = false;
    let tl = null;
    let activeTrigger = triggersNow[0];

    function setFaceState(isBackVisible) {
      front?.setAttribute("aria-hidden", String(isBackVisible));
      back?.setAttribute("aria-hidden", String(!isBackVisible));
    }

    function getTriggerGeometry() {
      const el = activeTrigger;
      if (!el || typeof el.getBoundingClientRect !== "function") return { dx: 0, dy: 0 };
      const btnRect = el.getBoundingClientRect();
      const btnCx = btnRect.left + btnRect.width / 2;
      const btnCy = btnRect.top + btnRect.height / 2;
      const vpCx = window.innerWidth / 2;
      const vpCy = window.innerHeight / 2;
      return { dx: btnCx - vpCx, dy: btnCy - vpCy };
    }

    function open(fromEl) {
      if (isOpen) return;
      isOpen = true;
      if (fromEl) activeTrigger = fromEl;

      lockScroll();

      document.querySelector(".mnav")?.classList.remove("is-open");
      document.querySelector(".nav")?.classList.remove("is-menu-open");
      document.querySelector(".nav__burger")?.setAttribute("aria-expanded", "false");
      document.getElementById("mnav")?.setAttribute("aria-hidden", "true");

      lastFocus = document.activeElement;

      overlay.hidden = false;
      document.documentElement.classList.add("reserve-modal-open");

      resetFrontState();

      // Stabilise hauteur
      syncCardHeight();
      requestAnimationFrame(syncCardHeight);
      setTimeout(syncCardHeight, 120);

      const reduce = prefersReducedMotion();
      const { dx, dy } = getTriggerGeometry();

      const hasGSAP = typeof window.gsap !== "undefined";

      if (!hasGSAP || reduce) {
        overlay.style.opacity = "1";
        dialog.style.transform = "";
        setFaceState(true);
        overlay.querySelector(".reserve-close")?.focus();
        document.addEventListener("keydown", onKeydown, true);
        return;
      }

      resetGsapFrontState(dx, dy);

      if (tl) tl.kill();
      tl = window.gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.to(overlay, { opacity: 1, duration: 0.18, ease: "power2.out" }, 0);

      tl.to(dialog, {
        x: 0, y: 0, scale: 1,
        rotateX: 0, rotateY: 0, rotateZ: 0,
        z: 0,
        filter: "blur(0px)",
        duration: 0.7,
        ease: "expo.out"
      }, 0);

      tl.to(inner, {
        keyframes: [
          { rotateY: 220, rotateX: -10, duration: FLIP_DUR_IN, ease: "power4.in" },
          { rotateY: 180, rotateX: 0, duration: FLIP_DUR_OUT, ease: "elastic.out(1, 0.65)" }
        ]
      }, FLIP_START_AT);

      const loader = overlay.querySelector(".reserve-front-loader");
      if (loader) {
        tl.to(loader, { opacity: 0, y: -4, duration: 0.25, ease: "power2.out" }, Math.max(0, FLIP_START_AT - 0.15));
      }

      const FACE_SWAP_AT = FLIP_START_AT + FLIP_DUR_IN + FLIP_DUR_OUT - FACE_SWAP_EPS;
      tl.call(() => {
        setFaceState(true);
        overlay.querySelector(".reserve-close")?.focus();
      }, null, FACE_SWAP_AT);

      document.addEventListener("keydown", onKeydown, true);
    }

    function close() {
      if (!isOpen) return;
      isOpen = false;
      document.removeEventListener("keydown", onKeydown, true);

      const reduce = prefersReducedMotion();
      const hasGSAP = typeof window.gsap !== "undefined";
      const { dx, dy } = getTriggerGeometry();

      const finalize = () => {
        overlay.hidden = true;
        overlay.style.opacity = "";
        unlockScroll();
        document.documentElement.classList.remove("reserve-modal-open");
        if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
      };

      if (!hasGSAP || reduce) {
        setFaceState(false);
        finalize();
        return;
      }

      if (tl) tl.kill();
      setFaceState(false);
      window.gsap.set(inner, { rotateY: 180, rotateX: 0, transformOrigin: "50% 50%" });

      tl = window.gsap.timeline({ defaults: { ease: "power2.inOut" }, onComplete: finalize });

      tl.to(inner, {
        keyframes: [
          { rotateY: 360, rotateX: 10, duration: 0.26, ease: "power3.in" },
          { rotateY: 0, rotateX: 0, duration: 0.26, ease: "power3.out" }
        ]
      }, 0);

      tl.to(dialog, {
        x: dx, y: dy, scale: 0.22,
        rotateX: -16, rotateY: 14, rotateZ: 2,
        z: -220,
        filter: "blur(10px)",
        duration: 0.55,
        ease: "expo.in"
      }, 0.06);

      tl.to(overlay, { opacity: 0, duration: 0.22, ease: "power1.out" }, 0.32);
    }

    function onKeydown(e) {
      if (!isOpen) return;
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      trapFocus(dialog, e);
    }

    // Event delegation (capture) : capte aussi le cas href="" et les éléments dans le menu mobile
    document.addEventListener("click", (e) => {
      const target = e.target;
      if (!(target instanceof Element)) return;

      const triggerEl = target.closest(TRIGGER_SELECTOR);
      if (triggerEl) {
        e.preventDefault();
        e.stopPropagation();
        if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
        open(triggerEl);
        return;
      }

      if (!isOpen) return;

      if (target.closest("[data-reserve-close='true']")) {
        e.preventDefault();
        close();
        return;
      }

      const copyBtn = target.closest("[data-copy]");
      if (copyBtn) {
        e.preventDefault();
        const value = copyBtn.getAttribute("data-copy") || "";
        copyToClipboard(value).then((ok) => {
          const old = copyBtn.textContent;
          copyBtn.textContent = ok ? "Copié ✓" : "Impossible";
          window.setTimeout(() => { copyBtn.textContent = old; }, 900);
        });
      }
    }, { capture: true });

  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
