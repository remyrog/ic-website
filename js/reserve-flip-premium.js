/**
 * Réserver : Flip card modal (GSAP)
 * - Trigger: #reserve-btn (garde le mailto en fallback si JS off)
 * - Animation: "fly" depuis le bouton + flip 3D
 * - UX: close (click outside / ESC), focus basic, copy mail, WhatsApp deep-link
 */
(function () {
  "use strict";

  const TRIGGER_ID = "reserve-btn";
  const EMAIL = "informatiquecerdagne@gmail.com";
  const PHONE_FR = "0698998001";
  const WA_E164 = "33698998001"; // sans "+" et sans espaces
  const WA_PREFILL = "Bonjour, je souhaite réserver un créneau pour parler de mon projet.";
  const WA_URL = `https://wa.me/${WA_E164}?text=${encodeURIComponent(WA_PREFILL)}`;

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

  function waitForGSAP(cb) {
    if (window.gsap && typeof window.gsap.timeline === "function") return cb();
    let tries = 0;
    (function tick() {
      tries += 1;
      if (window.gsap && typeof window.gsap.timeline === "function") return cb();
      if (tries > 120) return;
      requestAnimationFrame(tick);
    })();
  }

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
              <div class="reserve-front-sub">Un message suffit — réponse sous 24h ouvrées.</div>
              <div class="reserve-front-meta">Flip premium pour révéler mes coordonnées.</div>
            </div>

            <div class="reserve-face reserve-back" aria-hidden="true">
              <h3 id="reserve-title" class="reserve-title">Contact direct</h3>
              <p class="reserve-subtitle">Choisis ton canal — réponse rapide et cadrée.</p>

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
      .filter(el => !el.hasAttribute("disabled") && !el.getAttribute("aria-hidden"));

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

  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.top = "-9999px";
    ta.setAttribute("readonly", "true");
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch (e) { }
    document.body.removeChild(ta);
    return Promise.resolve();
  }

  function init() {
    const trigger = q(TRIGGER_ID);
    if (!trigger) return;

    let overlay = q("reserve-overlay");
    if (!overlay) overlay = createModal();

    const dialog = overlay.querySelector(".reserve-dialog");
    const inner = overlay.querySelector(".reserve-flip-inner");
    const back = overlay.querySelector(".reserve-back");
    const front = overlay.querySelector(".reserve-front");

    function syncCardHeight() {
      // Assure que le back est mesurable (même si aria-hidden)
      // Les faces sont souvent en absolute => on fixe la hauteur du conteneur inner.
      // On prend la hauteur réelle du contenu (scrollHeight est plus fiable ici).
      const hFront = front ? front.scrollHeight : 0;
      const hBack = back ? back.scrollHeight : 0;
      const h = Math.max(hFront, hBack);

      if (h > 0) {
        inner.style.setProperty("--reserve-card-h", `${h}px`);
      }
    }

    let lastFocus = null;
    let isOpen = false;
    let tl = null;

    function setFaceState(isBackVisible) {
      front.setAttribute("aria-hidden", String(isBackVisible));
      back.setAttribute("aria-hidden", String(!isBackVisible));
    }

    function open() {
      if (isOpen) return;
      isOpen = true;
      lockScroll();
      lastFocus = document.activeElement;

      overlay.hidden = false;
      // Calcule la vraie hauteur avant l’anim (après affichage)
      syncCardHeight();
      requestAnimationFrame(syncCardHeight);
      setTimeout(syncCardHeight, 60);

      const btnRect = trigger.getBoundingClientRect();
      const btnCx = btnRect.left + btnRect.width / 2;
      const btnCy = btnRect.top + btnRect.height / 2;
      const vpCx = window.innerWidth / 2;
      const vpCy = window.innerHeight / 2;
      const dx = btnCx - vpCx;
      const dy = btnCy - vpCy;

      const reduce = prefersReducedMotion();

      setFaceState(false);
      gsap.set(overlay, { opacity: 0 });
      gsap.set(dialog, {
        x: dx, y: dy, scale: 0.22,
        rotateX: 18, rotateY: -14, rotateZ: -2,
        z: -220,
        transformPerspective: 1200,
        transformOrigin: "50% 50%",
        filter: "blur(10px)"
      });
      gsap.set(inner, { rotateY: 0, rotateX: 8, transformOrigin: "50% 50%" });

      if (tl) tl.kill();

      tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.to(overlay, { opacity: 1, duration: 0.18, ease: "power2.out" });

      const FACE_SWAP_AT = 1.5; // <-- en secondes : augmente pour garder le front plus longtemps
      tl.call(() => {
        setFaceState(true);
        const closeBtn = overlay.querySelector(".reserve-close");
        closeBtn && closeBtn.focus();
      }, null, FACE_SWAP_AT);

      if (reduce) {
        tl.to(dialog, { x: 0, y: 0, scale: 1, rotateX: 0, rotateY: 0, rotateZ: 0, z: 0, filter: "blur(0px)", duration: 0.25 }, 0);
        tl.set(inner, { rotateY: 180, rotateX: 0 }, 0.02);
      } else {
        // Fly-in premium
        tl.to(dialog, {
          x: 0, y: 0, scale: 1,
          rotateX: 0, rotateY: 0, rotateZ: 0,
          z: 0,
          filter: "blur(0px)",
          duration: 0.7,
          ease: "expo.out"
        }, 0);

        // Flip spectaculaire : dépassement puis verrouillage à 180°
        tl.to(inner, {
          keyframes: [
            { rotateY: 220, rotateX: -10, duration: 0.42, ease: "power4.in" },
            { rotateY: 180, rotateX: 0, duration: 0.38, ease: "elastic.out(1, 0.65)" }
          ]
        }, 0.18);
      }

      document.addEventListener("keydown", onKeydown, true);
    }

    function close() {
      if (!isOpen) return;
      isOpen = false;

      document.removeEventListener("keydown", onKeydown, true);

      const reduce = prefersReducedMotion();

      // Recalcule la trajectoire vers le bouton (responsive / resize-safe)
      const btnRect = trigger.getBoundingClientRect();
      const btnCx = btnRect.left + btnRect.width / 2;
      const btnCy = btnRect.top + btnRect.height / 2;
      const vpCx = window.innerWidth / 2;
      const vpCy = window.innerHeight / 2;
      const dx = btnCx - vpCx;
      const dy = btnCy - vpCy;

      const finalize = () => {
        overlay.hidden = true;
        // Remet à zéro l’opacité pour la prochaine ouverture
        gsap.set(overlay, { opacity: 0 });
        unlockScroll();
        if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
      };

      if (tl) tl.kill();

      if (reduce) {
        setFaceState(false);
        finalize();
        return;
      }

      setFaceState(false);

      // Assure un point de départ propre
      gsap.set(inner, { rotateY: 180, rotateX: 0, transformOrigin: "50% 50%" });

      tl = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        onComplete: finalize
      });

      // Flip spectaculaire (retour vers la face avant) + retour vers le bouton
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

    trigger.addEventListener("click", (e) => {
      e.preventDefault();
      open();
    }, { passive: false });

    overlay.addEventListener("click", (e) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      if (target.closest("[data-reserve-close='true']")) close();
    });

    overlay.addEventListener("click", (e) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      const btn = target.closest("[data-copy]");
      if (!btn) return;

      const value = btn.getAttribute("data-copy") || "";
      copyToClipboard(value).then(() => {
        const old = btn.textContent;
        btn.textContent = "Copié ✓";
        setTimeout(() => { btn.textContent = old; }, 900);
      });
    });

    window.addEventListener("resize", () => {
      if (!overlay.hidden) {
        syncCardHeight();
      }
    }, { passive: true });
  }

  function boot() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => waitForGSAP(init), { once: true });
    } else {
      waitForGSAP(init);
    }
  }

  boot();
})();
