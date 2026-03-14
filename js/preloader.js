(() => {
    class PremiumLoaderController {
        constructor(options = {}) {
            this.options = {
                rootSelector: "#preloader",
                duration: 5200,
                ...options
            };

            this.root = document.querySelector(this.options.rootSelector);
            this.timeline = null;
            this.endTimer = null;
            this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        }

        init() {
            if (!this.root || typeof gsap === "undefined") return;
            this.play();
        }

        play() {
            const loader = this.root.querySelector(".magic-loader");
            const core = this.root.querySelector(".magic-loader__core");
            const rings = this.root.querySelectorAll(".magic-loader__ring");
            const particles = this.root.querySelectorAll(".magic-loader__particles b");
            const label = this.root.querySelector(".loader-label");
            const subline = this.root.querySelector(".loader-subline");
            const bgOrbs = this.root.querySelectorAll(".loader-bg-orb");
            const ticks = this.root.querySelectorAll(".magic-loader__ticks span");

            this.timeline = gsap.timeline();

            this.timeline
                .fromTo(
                    loader,
                    { scale: 0.78, opacity: 0, rotate: -10 },
                    {
                        scale: 1,
                        opacity: 1,
                        rotate: 0,
                        duration: this.reducedMotion ? 0.45 : 1.1,
                        ease: "power3.out"
                    }
                )
                .fromTo(
                    label,
                    { y: 18, opacity: 0 },
                    {
                        y: 0,
                        opacity: 1,
                        duration: this.reducedMotion ? 0.3 : 0.8,
                        ease: "power2.out"
                    },
                    "-=0.55"
                )
                .fromTo(
                    subline,
                    { y: 12, opacity: 0 },
                    {
                        y: 0,
                        opacity: 1,
                        duration: this.reducedMotion ? 0.25 : 0.7,
                        ease: "power2.out"
                    },
                    "-=0.55"
                )
                .fromTo(
                    bgOrbs,
                    { scale: 0.8, opacity: 0 },
                    {
                        scale: 1,
                        opacity: (i) => [0.22, 0.16, 0.1][i],
                        duration: this.reducedMotion ? 0.35 : 1.4,
                        stagger: 0.08,
                        ease: "power2.out"
                    },
                    "-=0.9"
                );

            if (!this.reducedMotion) {
                gsap.to(core, {
                    scale: 1.05,
                    duration: 1.6,
                    repeat: -1,
                    yoyo: true,
                    ease: "sine.inOut"
                });

                gsap.to(rings[0], {
                    rotate: "+=30",
                    duration: 2.8,
                    repeat: -1,
                    yoyo: true,
                    ease: "sine.inOut"
                });

                gsap.to(rings[1], {
                    rotate: "-=24",
                    duration: 2.2,
                    repeat: -1,
                    yoyo: true,
                    ease: "sine.inOut"
                });

                gsap.to(ticks, {
                    opacity: 1,
                    duration: 0.9,
                    stagger: {
                        each: 0.18,
                        repeat: -1,
                        yoyo: true
                    },
                    ease: "sine.inOut"
                });

                gsap.to(particles, {
                    y: (i) => (i % 2 === 0 ? -6 : 6),
                    x: (i) => (i % 2 === 0 ? 4 : -4),
                    duration: 1.8,
                    repeat: -1,
                    yoyo: true,
                    stagger: 0.12,
                    ease: "sine.inOut"
                });
            }

            this.endTimer = window.setTimeout(() => {
                this.finish();
            }, this.options.duration);
        }

        finish() {
            if (!this.root) return;

            this.root.classList.add("is-handoff");

            window.setTimeout(() => {
                this.root.classList.add("is-done");
            }, this.reducedMotion ? 350 : 900);
        }

        destroy() {
            if (this.timeline) this.timeline.kill();
            if (this.endTimer) clearTimeout(this.endTimer);
        }
    }

    window.initPreloaderScene = function initPreloaderScene(options = {}) {
        const controller = new PremiumLoaderController(options);
        controller.init();
        window.__premiumLoaderController = controller;
        return controller;
    };
})();