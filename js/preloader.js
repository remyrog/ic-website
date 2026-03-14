(() => {
    class PremiumLoader {
        constructor(options = {}) {
            this.options = {
                rootSelector: "#preloader",
                duration: 5000,
                ...options
            };

            this.root = document.querySelector(this.options.rootSelector);
            this.orbital = this.root?.querySelector(".loader-orbital");
            this.outerRing = this.root?.querySelector(".loader-ring--outer");
            this.midRing = this.root?.querySelector(".loader-ring--mid");
            this.innerRing = this.root?.querySelector(".loader-ring--inner");
            this.compass = this.root?.querySelector(".loader-compass");
            this.core = this.root?.querySelector(".loader-core");
            this.corePulse = this.root?.querySelector(".loader-core__pulse");
            this.coreGlow = this.root?.querySelector(".loader-core__glow");
            this.coreScan = this.root?.querySelector(".loader-core__scan");
            this.label = this.root?.querySelector(".loader-label");
            this.particles = this.root ? [...this.root.querySelectorAll(".loader-particle")] : [];

            this.tl = null;
            this.done = false;
        }

        init() {
            if (!this.root || typeof gsap === "undefined") return;
            this.setInitialState();
            this.play();
        }

        setInitialState() {
            gsap.set(this.orbital, { scale: 0.92, opacity: 0 });
            gsap.set(this.outerRing, { rotate: 0 });
            gsap.set(this.midRing, { rotate: 0 });
            gsap.set(this.innerRing, { rotate: 0 });
            gsap.set(this.compass, { rotate: 0, opacity: 0.45 });
            gsap.set(this.core, { scale: 0.88 });
            gsap.set(this.coreGlow, { opacity: 0.55 });
            gsap.set(this.coreScan, { yPercent: -55 });
            gsap.set(this.label, { y: 8, opacity: 0 });
            gsap.set(this.particles[0], { x: 150, y: 0 });
            gsap.set(this.particles[1], { x: -95, y: 105 });
            gsap.set(this.particles[2], { x: -118, y: -82 });
        }

        play() {
            this.tl = gsap.timeline({
                onComplete: () => this.finish()
            });

            this.tl
                .to(this.orbital, {
                    opacity: 1,
                    scale: 1,
                    duration: 0.9,
                    ease: "power2.out"
                })
                .to(this.label, {
                    opacity: 1,
                    y: 0,
                    duration: 0.5,
                    ease: "power2.out"
                }, "-=0.45");

            gsap.to(this.outerRing, {
                rotate: 360,
                duration: 9,
                ease: "none",
                repeat: -1
            });

            gsap.to(this.midRing, {
                rotate: -360,
                duration: 6.4,
                ease: "none",
                repeat: -1
            });

            gsap.to(this.innerRing, {
                rotate: 360,
                duration: 14,
                ease: "none",
                repeat: -1
            });

            gsap.to(this.compass, {
                rotate: 180,
                duration: 10,
                ease: "none",
                repeat: -1
            });

            gsap.to(this.core, {
                scale: 1.06,
                duration: 1.2,
                yoyo: true,
                repeat: -1,
                ease: "sine.inOut"
            });

            gsap.to(this.coreGlow, {
                opacity: 0.9,
                duration: 1.3,
                yoyo: true,
                repeat: -1,
                ease: "sine.inOut"
            });

            gsap.to(this.coreScan, {
                yPercent: 55,
                duration: 1.8,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut"
            });

            this.animateParticle(this.particles[0], 150, 0, 5.2, 0);
            this.animateParticle(this.particles[1], 105, 105, 6.4, 0.4);
            this.animateParticle(this.particles[2], 118, -82, 7.2, 0.8);

            this.tl.to({}, { duration: Math.max(0, this.options.duration / 1000 - 1.4) });

            this.tl.to(this.orbital, {
                scale: 0.86,
                opacity: 0,
                duration: 0.85,
                ease: "power2.inOut"
            });

            this.tl.to(this.label, {
                opacity: 0,
                y: 6,
                duration: 0.45,
                ease: "power2.inOut"
            }, "<");
        }

        animateParticle(el, radiusX, radiusY, duration, delay) {
            if (!el) return;
            gsap.to(el, {
                motionPath: {
                    path: [
                        { x: radiusX, y: 0 },
                        { x: 0, y: radiusY },
                        { x: -radiusX, y: 0 },
                        { x: 0, y: -radiusY },
                        { x: radiusX, y: 0 }
                    ],
                    curviness: 1.25
                },
                duration,
                delay,
                repeat: -1,
                ease: "none"
            });

            gsap.to(el, {
                scale: 1.3,
                duration: duration / 2,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut",
                delay
            });
        }

        finish() {
            if (this.done || !this.root) return;
            this.done = true;
            this.root.classList.add("is-done");
        }
    }

    window.initPremiumLoader = function initPremiumLoader(options = {}) {
        const loader = new PremiumLoader(options);
        loader.init();
        window.__premiumLoader = loader;
        return loader;
    };
})();