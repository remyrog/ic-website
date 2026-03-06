window.addEventListener("DOMContentLoaded", () => {
    initStickyNav();
    initAnimations();
});

function initStickyNav() {
    const stickyNav = document.getElementById("stickyNav");
    if (!stickyNav) return;

    const currentSectionLabel = stickyNav.querySelector(".current-section");
    const prevButton = stickyNav.querySelector(".prev-section");
    const nextButton = stickyNav.querySelector(".next-section");

    if (!currentSectionLabel || !prevButton || !nextButton) return;

    const sections = [
        document.getElementById("role"),
        document.getElementById("approche"),
        document.getElementById("solutions"),
        document.getElementById("audit"),
        document.getElementById("budgets"),
        document.getElementById("autonomie"),
        document.getElementById("mvp"),
        document.getElementById("agile"),
        document.getElementById("seo"),
        document.getElementById("risques"),
        document.getElementById("parcours"),
    ].filter(Boolean);

    if (!sections.length) return;

    const getScrollOffset = () => {
        const cssOffset = getComputedStyle(document.documentElement)
            .getPropertyValue("--scroll-offset")
            .trim();

        const parsed = Number.parseFloat(cssOffset);
        return Number.isFinite(parsed) ? parsed : 75;
    };

    const getSectionTitle = (section) => {
        const title = section.querySelector(".block-title");
        return title ? title.textContent.replace(/\s+/g, " ").trim() : "";
    };

    const scrollToSection = (section) => {
        if (!section) return;

        const offset = getScrollOffset();
        const top = window.scrollY + section.getBoundingClientRect().top - offset;

        window.scrollTo({
            top,
            behavior: "smooth",
        });
    };

    const setButtonState = (button, targetSection, disabled) => {
        if (!button) return;

        if (disabled || !targetSection) {
            button.setAttribute("aria-disabled", "true");
            button.classList.add("is-disabled");
            button.removeAttribute("href");
            return;
        }

        button.setAttribute("aria-disabled", "false");
        button.classList.remove("is-disabled");
        button.setAttribute("href", `#${targetSection.id}`);
    };

    let activeIndex = 0;
    let ticking = false;

    const updateStickyNav = () => {
        const offset = getScrollOffset();
        const activationLine = offset + 12;

        let bestIndex = 0;
        let bestDistance = Number.POSITIVE_INFINITY;

        sections.forEach((section, index) => {
            const rect = section.getBoundingClientRect();
            const distance = Math.abs(rect.top - activationLine);

            if (rect.top <= activationLine && distance < bestDistance) {
                bestDistance = distance;
                bestIndex = index;
            }
        });

        const firstRect = sections[0].getBoundingClientRect();
        const shouldShow = firstRect.top <= activationLine;

        stickyNav.classList.toggle("show", shouldShow);

        activeIndex = bestIndex;

        const currentSection = sections[activeIndex];
        const previousSection = sections[activeIndex - 1] || null;
        const nextSection = sections[activeIndex + 1] || null;

        currentSectionLabel.textContent = getSectionTitle(currentSection) || "Section";

        setButtonState(prevButton, previousSection, !previousSection);
        setButtonState(nextButton, nextSection, !nextSection);
    };

    const requestUpdate = () => {
        if (ticking) return;

        ticking = true;
        window.requestAnimationFrame(() => {
            updateStickyNav();
            ticking = false;
        });
    };

    prevButton.addEventListener("click", (event) => {
        const targetSection = sections[activeIndex - 1];
        if (!targetSection) {
            event.preventDefault();
            return;
        }

        event.preventDefault();
        scrollToSection(targetSection);
    });

    nextButton.addEventListener("click", (event) => {
        const targetSection = sections[activeIndex + 1];
        if (!targetSection) {
            event.preventDefault();
            return;
        }

        event.preventDefault();
        scrollToSection(targetSection);
    });

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    updateStickyNav();
}

function initAnimations() {
    if (typeof window.gsap === "undefined" || typeof window.ScrollTrigger === "undefined") {
        return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const isTouch =
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        window.matchMedia("(hover: none) and (pointer: coarse)").matches;

    function initMagnets(root = document) {
        if (isTouch) return;

        root.querySelectorAll("[data-magnet]").forEach((element) => {
            if (element.__magnetInit) return;
            element.__magnetInit = true;

            const strength = parseFloat(element.dataset.magnet);
            const maxRotation = parseFloat(element.dataset.rotate);

            const magnetStrength = Number.isFinite(strength) ? strength : 20;
            const rotationStrength = Number.isFinite(maxRotation) ? maxRotation : 4;

            const animateX = gsap.quickTo(element, "x", {
                duration: 0.25,
                ease: "power2.out",
            });
            const animateY = gsap.quickTo(element, "y", {
                duration: 0.25,
                ease: "power2.out",
            });
            const animateRotation = gsap.quickTo(element, "rotation", {
                duration: 0.25,
                ease: "power2.out",
            });

            const onMove = (event) => {
                const rect = element.getBoundingClientRect();
                const normalizedX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
                const normalizedY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;

                animateX(normalizedX * magnetStrength);
                animateY(normalizedY * magnetStrength * 0.6);
                animateRotation(-normalizedX * rotationStrength);
            };

            const reset = () => {
                animateX(0);
                animateY(0);
                animateRotation(0);
            };

            element.addEventListener("mousemove", onMove);
            element.addEventListener("mouseleave", reset);
            element.addEventListener("pointerdown", reset);
        });
    }

    initMagnets();

    gsap.from(".hero-inner", {
        opacity: 0,
        y: 60,
        duration: 1.3,
        ease: "power3.out",
    });

    gsap.from(".toc-card", {
        opacity: 0,
        y: 40,
        duration: 1,
        ease: "power3.out",
        stagger: 0.15,
        delay: 0.3,
        onComplete: () => initMagnets(),
    });

    document.querySelectorAll(".block").forEach((element) => {
        gsap.from(element, {
            opacity: 0,
            y: 80,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: {
                trigger: element,
                start: "top 80%",
                end: "bottom 60%",
                toggleActions: "play none none reverse",
            },
        });
    });

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

    (() => {
        const paragraph = document.querySelector(".tech-stack");
        if (!paragraph) return;

        const raw = paragraph.textContent || "";
        const split = raw.split(":");
        if (split.length < 2) return;

        const label = `${split[0].trim()} :`;
        const rest = split.slice(1).join(":").trim();

        const trimmedList = rest
            .split(/\bainsi que\b|\bavec des outils\b|\bavec un outil\b/i)[0]
            .trim()
            .replace(/\.$/, "");

        const tokens = trimmedList
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
            .flatMap((item) => (item.includes(" / ") ? item.split(" / ").map((sub) => sub.trim()) : [item]));

        paragraph.innerHTML = `<span class="tech-label">${label}</span>`;

        const wrapper = document.createElement("div");
        wrapper.className = "tech-tags";

        tokens.forEach((token) => {
            const tag = document.createElement("span");
            tag.className = "tech-tag";
            tag.setAttribute("data-magnet", "");
            tag.textContent = token;
            wrapper.appendChild(tag);
        });

        paragraph.appendChild(wrapper);
        initMagnets(wrapper);
    })();
}