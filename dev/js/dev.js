// Animations d’entrée et de scroll haut de gamme via GSAP
window.addEventListener("DOMContentLoaded", () => {
    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;
    gsap.registerPlugin(ScrollTrigger);

    // ====== Magnet / tilt (desktop only) — GSAP-friendly ======
    const isTouch =
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        window.matchMedia("(hover: none) and (pointer: coarse)").matches;

    function initMagnets(root = document) {
        if (isTouch) return;

        root.querySelectorAll("[data-magnet]").forEach((el) => {
            if (el.__magnetInit) return;
            el.__magnetInit = true;

            const strength = parseFloat(el.dataset.magnet);
            const maxRot = parseFloat(el.dataset.rotate);

            const s = Number.isFinite(strength) ? strength : 20; // px
            const r = Number.isFinite(maxRot) ? maxRot : 4; // deg

            // Quick setters (super smooth)
            const toX = gsap.quickTo(el, "x", { duration: 0.25, ease: "power2.out" });
            const toY = gsap.quickTo(el, "y", { duration: 0.25, ease: "power2.out" });
            const toR = gsap.quickTo(el, "rotation", { duration: 0.25, ease: "power2.out" });

            const onMove = (e) => {
                const rect = el.getBoundingClientRect();
                const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2; // -1..1
                const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2; // -1..1

                toX(nx * s);
                toY(ny * s * 0.6);
                toR(-nx * r);
            };

            const reset = () => {
                toX(0);
                toY(0);
                toR(0);
            };

            el.addEventListener("mousemove", onMove);
            el.addEventListener("mouseleave", reset);

            // Petit polish : si on clique pendant le hover, on reset immédiatement
            el.addEventListener("pointerdown", reset);
        });
    }

    initMagnets();

    // ====== Animations d’arrivée ======
    gsap.from(".hero-inner", {
        opacity: 0,
        y: 60,
        duration: 1.3,
        ease: "power3.out",
    });

    // Apparition en cascade des cartes de sommaire
    // -> on initMagnets après l'anim pour éviter un ressenti "bizarre" au tout début
    gsap.from(".toc-card", {
        opacity: 0,
        y: 40,
        duration: 1,
        ease: "power3.out",
        stagger: 0.15,
        delay: 0.3,
        onComplete: () => initMagnets(),
    });

    // Révélations au scroll des blocs principaux
    document.querySelectorAll(".block").forEach((el) => {
        gsap.from(el, {
            opacity: 0,
            y: 80,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: {
                trigger: el,
                start: "top 80%",
                end: "bottom 60%",
                toggleActions: "play none none reverse",
            },
        });
    });

    // Animation des soulignages décoratifs sous les titres
    document.querySelectorAll(".block-underline").forEach((underline) => {
        gsap.fromTo(
            underline,
            { scaleX: 0 },
            {
                scaleX: 1,
                duration: 0.8,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: underline.parentElement?.parentElement || underline,
                    start: "top 80%",
                    toggleActions: "play none none reverse",
                },
            }
        );
    });

    // Animation d'apparition des icônes de section
    document.querySelectorAll(".block-icon").forEach((icon) => {
        gsap.from(icon, {
            opacity: 0,
            y: 20,
            rotation: -15,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
                trigger: icon.parentElement?.parentElement || icon,
                start: "top 80%",
                toggleActions: "play none none reverse",
            },
        });
    });

    // Animation de tracé des icônes (dessin au trait)
    document.querySelectorAll(".block-icon path").forEach((path) => {
        const length = path.getTotalLength ? path.getTotalLength() : 300;
        path.style.strokeDasharray = String(length);
        path.style.strokeDashoffset = String(length);

        gsap.to(path, {
            strokeDashoffset: 0,
            duration: 1.2,
            ease: "power2.out",
            scrollTrigger: {
                trigger: path.closest(".block") || path,
                start: "top 80%",
                toggleActions: "play none none reverse",
            },
        });
    });

    // ====== Animation premium : poignée de main et personnages ======
    const clientPerson = document.getElementById("client-person");
    const providerPerson = document.getElementById("provider-person");
    const leftArm = document.getElementById("left-arm");
    const rightArm = document.getElementById("right-arm");
    const labelContainer = document.querySelector(".handshake-labels");

    if (clientPerson && providerPerson && leftArm && rightArm && labelContainer) {
        gsap.set([clientPerson, leftArm], { x: -200, opacity: 0 });
        gsap.set([providerPerson, rightArm], { x: 200, opacity: 0 });
        gsap.set(labelContainer, { opacity: 0, y: 20 });
        gsap.set("#handshake-svg", { opacity: 1 });

        gsap.timeline({
            scrollTrigger: {
                trigger: document.getElementById("hero"),
                start: "top top",
                end: "+=400",
                scrub: true,
            },
        })
            .to(clientPerson, { x: 0, opacity: 1, ease: "power2.out" }, 0)
            .to(providerPerson, { x: 0, opacity: 1, ease: "power2.out" }, 0)
            .to(leftArm, { x: 0, opacity: 1, ease: "power2.out" }, 0.15)
            .to(rightArm, { x: 0, opacity: 1, ease: "power2.out" }, 0.15)
            .to(labelContainer, { opacity: 1, y: -10, ease: "power2.out" }, 0.3);
    }

    // ====== Sticky navigation et scrollspy ======
    const tocSection = document.getElementById("sommaire");
    const stickyNav = document.getElementById("stickyNav");
    const currentSpan = stickyNav ? stickyNav.querySelector(".current-section") : null;
    const prevLink = stickyNav ? stickyNav.querySelector(".prev-section") : null;
    const nextLink = stickyNav ? stickyNav.querySelector(".next-section") : null;

    const cards = Array.from(document.querySelectorAll(".toc-card"));
    const sections = Array.from(document.querySelectorAll(".grid .block"));
    const sectionIds = sections.map((s) => s.id);

    if (tocSection && stickyNav) {
        ScrollTrigger.create({
            trigger: tocSection,
            start: "bottom top-=80",
            end: "bottom top",
            onEnter: () => stickyNav.classList.add("show"),
            onLeaveBack: () => stickyNav.classList.remove("show"),
        });
    }

    function updateNav(section) {
        const id = section.id;

        // Carte active
        cards.forEach((card) => {
            card.classList.toggle("active", card.getAttribute("href") === `#${id}`);
        });

        // Sticky nav
        if (stickyNav && currentSpan) {
            const titleEl = section.querySelector(".block-title");
            currentSpan.textContent = titleEl ? titleEl.textContent.trim() : "";

            const index = sectionIds.indexOf(id);
            const prevId = sectionIds[index - 1];
            const nextId = sectionIds[index + 1];

            if (prevLink) {
                if (prevId) {
                    prevLink.href = `#${prevId}`;
                    prevLink.style.visibility = "visible";
                } else {
                    prevLink.href = "#";
                    prevLink.style.visibility = "hidden";
                }
            }

            if (nextLink) {
                if (nextId) {
                    nextLink.href = `#${nextId}`;
                    nextLink.style.visibility = "visible";
                } else {
                    nextLink.href = "#";
                    nextLink.style.visibility = "hidden";
                }
            }
        }
    }

    // ===== Fix scroll offset sticky-nav + sommaire (évite titres coupés) =====
    function getTopOffset() {
        const topBar = document.querySelector(".top-bar");
        const h = topBar ? topBar.getBoundingClientRect().height : 0;
        return h + 18;
    }

    function scrollToSection(id) {
        const section = document.getElementById(id);
        if (!section) return;

        const target =
            section.querySelector(".block-header") ||
            section.querySelector(".block-title") ||
            section;

        const y = target.getBoundingClientRect().top + window.pageYOffset - getTopOffset();
        window.scrollTo({ top: y, behavior: "smooth" });
        history.replaceState(null, "", `#${id}`);
    }

    function bindSmartAnchor(a) {
        if (!a || a.__scrollInit) return;
        a.__scrollInit = true;

        a.addEventListener(
            "click",
            (e) => {
                const href = a.getAttribute("href") || "";
                if (!href.startsWith("#") || href === "#") return;
                e.preventDefault();
                scrollToSection(href.slice(1));
            },
            { passive: false }
        );
    }

    // 1) Sticky nav prev/next + home
    bindSmartAnchor(document.querySelector("#stickyNav .prev-section"));
    bindSmartAnchor(document.querySelector("#stickyNav .next-section"));
    bindSmartAnchor(document.querySelector("#stickyNav .nav-home"));

    // 2) Tous les liens internes marqués data-scrolllink (cohérent avec main.js)
    document.querySelectorAll('[data-scrolllink][href^="#"]').forEach(bindSmartAnchor);

    // ScrollTrigger pour chaque section (maj sticky-nav dès que le titre devient visible)
    sections.forEach((section) => {
        const titleTrigger = section.querySelector(".block-title") || section;

        ScrollTrigger.create({
            trigger: titleTrigger,
            start: "top 85%",
            end: "bottom 20%",
            onEnter: () => updateNav(section),
            onEnterBack: () => updateNav(section),
        });
    });

    // ====== Tech stack -> tags ======
    (function () {
        const p = document.querySelector(".tech-stack");
        if (!p) return;

        const raw = p.textContent || "";
        const split = raw.split(":");
        if (split.length < 2) return;

        const label = split[0].trim() + " :";
        const rest = split.slice(1).join(":").trim();

        const cut = rest
            .split(/\bainsi que\b|\bavec des outils\b|\bavec un outil\b/i)[0]
            .trim()
            .replace(/\.$/, "");

        const tokens = cut
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
            .flatMap((s) => (s.includes(" / ") ? s.split(" / ").map((x) => x.trim()) : [s]));

        p.innerHTML = `<span class="tech-label">${label}</span>`;

        const wrap = document.createElement("div");
        wrap.className = "tech-tags";

        tokens.forEach((t) => {
            const tag = document.createElement("span");
            tag.className = "tech-tag";
            tag.setAttribute("data-magnet");
            tag.textContent = t;
            wrap.appendChild(tag);
        });

        p.appendChild(wrap);
        initMagnets(wrap);
    })();
});