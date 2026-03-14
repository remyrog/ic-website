(() => {
    class PreloaderSceneController {
        constructor(options = {}) {
            this.options = {
                rootSelector: "#preloader",
                canvasSelector: "#loaderCanvas",
                ctaSelector: "#loaderCta",
                autoStart: true,
                debug: false,
                ...options
            };

            this.root = document.querySelector(this.options.rootSelector);
            this.canvas = this.root?.querySelector(this.options.canvasSelector);
            this.sceneRoot = this.root?.querySelector(".loader-scene");
            this.cta = this.root?.querySelector(this.options.ctaSelector);

            this.app = null;
            this.stage = null;
            this.rafId = 0;

            this.state = {
                started: false,
                greetingPlayed: false,
                exiting: false,
                reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches
            };

            this.refs = {
                scene: null,
                desk: null,
                monitorWrap: null,
                monitorInner: null,
                monitorGlow: null,
                chair: null,
                avatarWrap: null,
                torso: null,
                neck: null,
                head: null,
                hairMass: null,
                hairTop: null,
                bun: null,
                fringeLeft: null,
                fringeRight: null,
                beard: null,
                browLeft: null,
                browRight: null,
                eyeLeft: null,
                eyeRight: null,
                glassesLeft: null,
                glassesRight: null,
                glassesBridge: null,
                nose: null,
                mouth: null,
                armLeft: null,
                forearmLeft: null,
                handLeft: null,
                armRightPivot: null,
                armRightUpper: null,
                armRightForearm: null,
                armRightHand: null,
                mug: null,
                lampWrap: null,
                screenDot1: null,
                screenDot2: null,
                screenDot3: null,
                screenLine1: null,
                screenLine2: null,
                screenLine3: null,
                shoulderHit: null
            };

            this.boundResize = this.onResize.bind(this);
            this.boundPointerDown = this.onPointerDown.bind(this);
            this.boundCtaClick = this.onCtaClick.bind(this);
        }

        async init() {
            if (
                !this.root ||
                !this.canvas ||
                !this.sceneRoot ||
                typeof PIXI === "undefined" ||
                typeof gsap === "undefined"
            ) {
                return;
            }

            await this.setupApp();
            this.buildScene();
            this.layoutScene();
            this.bindEvents();
            this.startTicker();

            if (this.options.autoStart) {
                this.playIntro();
            }
        }

        async setupApp() {
            this.app = new PIXI.Application();

            await this.app.init({
                canvas: this.canvas,
                width: Math.max(1, this.sceneRoot.clientWidth),
                height: Math.max(1, this.sceneRoot.clientHeight),
                backgroundAlpha: 0,
                antialias: true,
                resolution: Math.min(window.devicePixelRatio || 1, 2)
            });

            this.stage = this.app.stage;
            this.stage.sortableChildren = true;
        }

        buildScene() {
            const scene = new PIXI.Container();
            this.stage.addChild(scene);
            this.refs.scene = scene;

            // ===== Monitor =====
            const monitorWrap = new PIXI.Container();
            scene.addChild(monitorWrap);
            this.refs.monitorWrap = monitorWrap;

            const monitorShadow = new PIXI.Graphics();
            monitorShadow.roundRect(-126, -78, 252, 156, 20).fill({ color: 0x000000, alpha: 0.16 });
            monitorShadow.position.set(0, 8);
            monitorWrap.addChild(monitorShadow);

            const monitorFrame = new PIXI.Graphics();
            monitorFrame.roundRect(-120, -74, 240, 148, 20).fill(0x111827);
            monitorWrap.addChild(monitorFrame);

            const monitorBorder = new PIXI.Graphics();
            monitorBorder.roundRect(-120, -74, 240, 148, 20).stroke({ color: 0xf7c600, alpha: 0.16, width: 2 });
            monitorWrap.addChild(monitorBorder);

            const monitorInner = new PIXI.Graphics();
            monitorInner.roundRect(-102, -56, 204, 112, 12).fill(0x273252);
            monitorWrap.addChild(monitorInner);
            this.refs.monitorInner = monitorInner;

            const monitorGlow = new PIXI.Graphics();
            monitorGlow.roundRect(-102, -56, 204, 112, 12).fill({ color: 0xffffff, alpha: 0.02 });
            monitorWrap.addChild(monitorGlow);
            this.refs.monitorGlow = monitorGlow;

            const screenLine1 = new PIXI.Graphics();
            screenLine1.roundRect(-60, -16, 78, 7, 4).fill({ color: 0xf7c600, alpha: 0.55 });
            monitorWrap.addChild(screenLine1);
            this.refs.screenLine1 = screenLine1;

            const screenLine2 = new PIXI.Graphics();
            screenLine2.roundRect(-60, 2, 116, 7, 4).fill({ color: 0xec4899, alpha: 0.48 });
            monitorWrap.addChild(screenLine2);
            this.refs.screenLine2 = screenLine2;

            const screenLine3 = new PIXI.Graphics();
            screenLine3.roundRect(-60, 20, 70, 7, 4).fill({ color: 0xffffff, alpha: 0.20 });
            monitorWrap.addChild(screenLine3);
            this.refs.screenLine3 = screenLine3;

            const screenDot1 = new PIXI.Graphics();
            screenDot1.circle(42, -2, 14).fill(0xec4899);
            monitorWrap.addChild(screenDot1);
            this.refs.screenDot1 = screenDot1;

            const screenDot2 = new PIXI.Graphics();
            screenDot2.circle(80, -2, 11).fill(0xf0d5c3);
            monitorWrap.addChild(screenDot2);
            this.refs.screenDot2 = screenDot2;

            const screenDot3 = new PIXI.Graphics();
            screenDot3.circle(0, -38, 8).fill(0xf7c600);
            monitorWrap.addChild(screenDot3);
            this.refs.screenDot3 = screenDot3;

            const monitorStem = new PIXI.Graphics();
            monitorStem.roundRect(-10, 74, 20, 42, 8).fill(0x1b2438);
            monitorWrap.addChild(monitorStem);

            const monitorBase = new PIXI.Graphics();
            monitorBase.roundRect(-42, 112, 84, 12, 6).fill(0x1b2438);
            monitorWrap.addChild(monitorBase);

            // ===== Desk =====
            const desk = new PIXI.Container();
            scene.addChild(desk);
            this.refs.desk = desk;

            const deskTopShadow = new PIXI.Graphics();
            deskTopShadow.roundRect(-300, -12, 600, 24, 12).fill({ color: 0x000000, alpha: 0.18 });
            deskTopShadow.position.set(0, 8);
            desk.addChild(deskTopShadow);

            const deskTop = new PIXI.Graphics();
            deskTop.roundRect(-300, -12, 600, 24, 12).fill(0x2d2a24);
            desk.addChild(deskTop);

            const deskTopLine = new PIXI.Graphics();
            deskTopLine.roundRect(-300, -12, 600, 24, 12).stroke({ color: 0xf7c600, alpha: 0.14, width: 2 });
            desk.addChild(deskTopLine);

            const legLeft = new PIXI.Graphics();
            legLeft.roundRect(-260, 12, 24, 146, 10).fill(0x141c30);
            desk.addChild(legLeft);

            const legMidLeft = new PIXI.Graphics();
            legMidLeft.roundRect(-84, 12, 24, 146, 10).fill(0x141c30);
            desk.addChild(legMidLeft);

            const legMidRight = new PIXI.Graphics();
            legMidRight.roundRect(60, 12, 24, 146, 10).fill(0x141c30);
            desk.addChild(legMidRight);

            const legRight = new PIXI.Graphics();
            legRight.roundRect(236, 12, 24, 146, 10).fill(0x141c30);
            desk.addChild(legRight);

            // ===== Mug =====
            const mug = new PIXI.Container();
            scene.addChild(mug);
            this.refs.mug = mug;

            const mugBody = new PIXI.Graphics();
            mugBody.roundRect(-22, -18, 44, 36, 10).fill(0xec4899);
            mug.addChild(mugBody);

            const mugHandle = new PIXI.Graphics();
            mugHandle.circle(24, 0, 10).stroke({ color: 0xec4899, width: 7 });
            mug.addChild(mugHandle);

            // ===== Lamp =====
            const lampWrap = new PIXI.Container();
            scene.addChild(lampWrap);
            this.refs.lampWrap = lampWrap;

            const lampBase = new PIXI.Graphics();
            lampBase.roundRect(-18, 22, 36, 12, 5).fill(0x1a2236);
            lampWrap.addChild(lampBase);

            const lampRod = new PIXI.Graphics();
            lampRod.roundRect(-3, -16, 6, 44, 3).fill(0x1a2236);
            lampRod.rotation = -0.22;
            lampWrap.addChild(lampRod);

            const lampHead = new PIXI.Graphics();
            lampHead.moveTo(-18, -28);
            lampHead.lineTo(16, -34);
            lampHead.lineTo(8, -10);
            lampHead.lineTo(-16, -8);
            lampHead.closePath();
            lampHead.fill(0xf7c600);
            lampWrap.addChild(lampHead);

            // ===== Chair =====
            const chair = new PIXI.Container();
            scene.addChild(chair);
            this.refs.chair = chair;

            const chairBack = new PIXI.Graphics();
            chairBack.roundRect(-92, -34, 184, 116, 56).fill(0x25243a);
            chair.addChild(chairBack);

            const chairSeat = new PIXI.Graphics();
            chairSeat.ellipse(0, 96, 108, 46).fill(0x2e2d46);
            chair.addChild(chairSeat);

            // ===== Avatar =====
            const avatarWrap = new PIXI.Container();
            avatarWrap.eventMode = "static";
            avatarWrap.cursor = "pointer";
            scene.addChild(avatarWrap);
            this.refs.avatarWrap = avatarWrap;

            const torso = new PIXI.Graphics();
            torso.roundRect(-52, -8, 104, 204, 50).fill(0xc8a028);
            avatarWrap.addChild(torso);
            this.refs.torso = torso;

            const neck = new PIXI.Graphics();
            neck.roundRect(-11, -34, 22, 20, 9).fill(0xd9b79f);
            avatarWrap.addChild(neck);
            this.refs.neck = neck;

            const head = new PIXI.Graphics();
            head.ellipse(0, -82, 52, 62).fill(0xd9b79f);
            avatarWrap.addChild(head);
            this.refs.head = head;

            const hairMass = new PIXI.Graphics();
            hairMass.ellipse(0, -96, 54, 46).fill(0x17141d);
            avatarWrap.addChildAt(hairMass, avatarWrap.getChildIndex(head));
            this.refs.hairMass = hairMass;

            const hairTop = new PIXI.Graphics();
            hairTop.moveTo(-36, -106);
            hairTop.bezierCurveTo(-20, -126, 20, -126, 36, -106);
            hairTop.bezierCurveTo(26, -94, 14, -90, 0, -90);
            hairTop.bezierCurveTo(-14, -90, -26, -94, -36, -106);
            hairTop.fill(0x17141d);
            avatarWrap.addChild(hairTop);
            this.refs.hairTop = hairTop;

            const bun = new PIXI.Graphics();
            bun.circle(0, -130, 12).fill(0x17141d);
            avatarWrap.addChild(bun);
            this.refs.bun = bun;

            const earLeft = new PIXI.Graphics();
            earLeft.ellipse(0, 0, 6, 10).fill(0xd9b79f);
            earLeft.position.set(-45, -82);
            avatarWrap.addChild(earLeft);

            const earRight = new PIXI.Graphics();
            earRight.ellipse(0, 0, 6, 10).fill(0xd9b79f);
            earRight.position.set(45, -82);
            avatarWrap.addChild(earRight);

            const beard = new PIXI.Graphics();
            beard.ellipse(0, -42, 27, 20).fill(0x17141d);
            avatarWrap.addChild(beard);
            this.refs.beard = beard;

            const eyeLeft = new PIXI.Graphics();
            eyeLeft.circle(0, 0, 3).fill(0x111111);
            eyeLeft.position.set(-12, -84);
            avatarWrap.addChild(eyeLeft);
            this.refs.eyeLeft = eyeLeft;

            const eyeRight = new PIXI.Graphics();
            eyeRight.circle(0, 0, 3).fill(0x111111);
            eyeRight.position.set(12, -84);
            avatarWrap.addChild(eyeRight);
            this.refs.eyeRight = eyeRight;

            const browLeft = new PIXI.Graphics();
            browLeft.roundRect(-22, -100, 14, 3, 2).fill(0x111111);
            avatarWrap.addChild(browLeft);
            this.refs.browLeft = browLeft;

            const browRight = new PIXI.Graphics();
            browRight.roundRect(8, -100, 14, 3, 2).fill(0x111111);
            avatarWrap.addChild(browRight);
            this.refs.browRight = browRight;

            const glassesLeft = new PIXI.Graphics();
            glassesLeft.circle(0, 0, 12).stroke({ color: 0x111111, width: 2 });
            glassesLeft.position.set(-12, -84);
            avatarWrap.addChild(glassesLeft);
            this.refs.glassesLeft = glassesLeft;

            const glassesRight = new PIXI.Graphics();
            glassesRight.circle(0, 0, 12).stroke({ color: 0x111111, width: 2 });
            glassesRight.position.set(12, -84);
            avatarWrap.addChild(glassesRight);
            this.refs.glassesRight = glassesRight;

            const glassesBridge = new PIXI.Graphics();
            glassesBridge.moveTo(-1.5, -84);
            glassesBridge.lineTo(1.5, -84);
            glassesBridge.stroke({ color: 0x111111, width: 2 });
            avatarWrap.addChild(glassesBridge);
            this.refs.glassesBridge = glassesBridge;

            const nose = new PIXI.Graphics();
            nose.roundRect(-2.5, -72, 5, 12, 3).fill({ color: 0xc99f82, alpha: 0.5 });
            avatarWrap.addChild(nose);
            this.refs.nose = nose;

            const mouth = new PIXI.Graphics();
            mouth.arc(0, -57, 8, 0.18 * Math.PI, 0.82 * Math.PI);
            mouth.stroke({ color: 0xea580c, width: 2.2 });
            avatarWrap.addChild(mouth);
            this.refs.mouth = mouth;

            const armLeft = new PIXI.Graphics();
            armLeft.roundRect(-20, -12, 26, 92, 13).fill(0xc8a028);
            armLeft.rotation = 0.45;
            armLeft.position.set(-58, 28);
            avatarWrap.addChild(armLeft);
            this.refs.armLeft = armLeft;

            const forearmLeft = new PIXI.Graphics();
            forearmLeft.roundRect(-10, -10, 20, 58, 10).fill(0xd9b79f);
            forearmLeft.rotation = -0.18;
            forearmLeft.position.set(-76, 88);
            avatarWrap.addChild(forearmLeft);
            this.refs.forearmLeft = forearmLeft;

            const handLeft = new PIXI.Graphics();
            handLeft.circle(0, 0, 12).fill(0xd9b79f);
            handLeft.position.set(-74, 132);
            avatarWrap.addChild(handLeft);
            this.refs.handLeft = handLeft;

            const armRightPivot = new PIXI.Container();
            armRightPivot.position.set(58, 28);
            avatarWrap.addChild(armRightPivot);
            this.refs.armRightPivot = armRightPivot;

            const armRightUpper = new PIXI.Graphics();
            armRightUpper.roundRect(-6, -6, 24, 92, 13).fill(0xc8a028);
            armRightUpper.rotation = -0.45;
            armRightPivot.addChild(armRightUpper);
            this.refs.armRightUpper = armRightUpper;

            const armRightForearm = new PIXI.Graphics();
            armRightForearm.roundRect(-4, -4, 20, 62, 10).fill(0xd9b79f);
            armRightForearm.rotation = -0.25;
            armRightForearm.position.set(32, 36);
            armRightPivot.addChild(armRightForearm);
            this.refs.armRightForearm = armRightForearm;

            const armRightHand = new PIXI.Graphics();
            armRightHand.circle(0, 0, 11).fill(0xd9b79f);
            armRightHand.position.set(64, 62);
            armRightPivot.addChild(armRightHand);
            this.refs.armRightHand = armRightHand;

            const shoulderHit = new PIXI.Graphics();
            shoulderHit.circle(0, 0, 26).fill({ color: 0xffffff, alpha: 0.001 });
            shoulderHit.position.set(58, 30);
            shoulderHit.eventMode = "static";
            shoulderHit.cursor = "pointer";
            avatarWrap.addChild(shoulderHit);
            this.refs.shoulderHit = shoulderHit;

            this.reorderScene();
        }

        reorderScene() {
            const scene = this.refs.scene;
            if (!scene) return;

            scene.removeChildren();
            scene.addChild(
                this.refs.chair,
                this.refs.monitorWrap,
                this.refs.desk,
                this.refs.mug,
                this.refs.lampWrap,
                this.refs.avatarWrap
            );
        }

        layoutScene() {
            const w = this.sceneRoot.clientWidth;
            const h = this.sceneRoot.clientHeight;
            const cx = w * 0.5;
            const scale = Math.max(0.86, Math.min(1.16, w / 1280));

            this.refs.monitorWrap.position.set(cx, h * 0.59);
            this.refs.monitorWrap.scale.set(scale * 1.0);

            this.refs.chair.position.set(cx, h * 0.72);
            this.refs.chair.scale.set(scale * 1.0);

            this.refs.desk.position.set(cx, h * 0.80);
            this.refs.desk.scale.set(scale * 1.0);

            this.refs.mug.position.set(cx - 138 * scale, h * 0.745);
            this.refs.mug.scale.set(scale);

            this.refs.lampWrap.position.set(cx + 176 * scale, h * 0.738);
            this.refs.lampWrap.scale.set(scale);

            this.refs.avatarWrap.position.set(cx, h * 0.67);
            this.refs.avatarWrap.scale.set(scale * 1.04);
        }

        bindEvents() {
            window.addEventListener("resize", this.boundResize, { passive: true });
            this.canvas.addEventListener("pointerdown", this.boundPointerDown, { passive: true });
            this.cta?.addEventListener("click", this.boundCtaClick);
        }

        onResize() {
            if (!this.app || !this.sceneRoot) return;

            const w = Math.max(1, this.sceneRoot.clientWidth);
            const h = Math.max(1, this.sceneRoot.clientHeight);

            this.app.renderer.resize(w, h);
            this.layoutScene();
        }

        onPointerDown(event) {
            if (this.state.exiting) return;

            const rect = this.canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            const global = new PIXI.Point(x, y);

            const shoulderBounds = this.refs.shoulderHit?.getBounds();
            const avatarBounds = this.refs.avatarWrap?.getBounds();

            const hitShoulder =
                shoulderBounds &&
                x >= shoulderBounds.x &&
                x <= shoulderBounds.x + shoulderBounds.width &&
                y >= shoulderBounds.y &&
                y <= shoulderBounds.y + shoulderBounds.height;

            const hitAvatar =
                avatarBounds &&
                x >= avatarBounds.x &&
                x <= avatarBounds.x + avatarBounds.width &&
                y >= avatarBounds.y &&
                y <= avatarBounds.y + avatarBounds.height;

            if (hitShoulder || hitAvatar) {
                this.onSolicit();
            }
        }

        onCtaClick() {
            this.onSolicit();
        }

        startTicker() {
            const tick = () => {
                this.rafId = requestAnimationFrame(tick);

                const t = performance.now() * 0.001;

                if (this.refs.avatarWrap && !this.state.exiting) {
                    this.refs.avatarWrap.y += Math.sin(t * 1.8) * 0.08;
                    this.refs.head.rotation = Math.sin(t * 1.25) * 0.02;
                    this.refs.armLeft.rotation = 0.45 + Math.sin(t * 1.4) * 0.02;
                }

                if (this.refs.screenDot1) this.refs.screenDot1.alpha = 0.82 + Math.sin(t * 2.1) * 0.10;
                if (this.refs.screenDot2) this.refs.screenDot2.alpha = 0.78 + Math.sin(t * 1.7 + 0.6) * 0.10;
                if (this.refs.screenDot3) this.refs.screenDot3.alpha = 0.70 + Math.sin(t * 2.4 + 1.2) * 0.10;
            };

            tick();
        }

        playIntro() {
            if (this.state.started) return;
            this.state.started = true;

            gsap.set(this.refs.avatarWrap, {
                pixi: { y: this.refs.avatarWrap.y + 18, alpha: 0 }
            });

            gsap.set(this.refs.monitorWrap, {
                pixi: { y: this.refs.monitorWrap.y + 12, alpha: 0 }
            });

            gsap.set(this.refs.desk, {
                pixi: { y: this.refs.desk.y + 10, alpha: 0 }
            });

            gsap.set([this.refs.mug, this.refs.lampWrap], {
                pixi: { alpha: 0 }
            });

            const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

            tl.to(this.refs.monitorWrap, {
                duration: this.state.reducedMotion ? 0.25 : 0.7,
                pixi: { y: this.refs.monitorWrap.y, alpha: 1 }
            });

            tl.to(this.refs.desk, {
                duration: this.state.reducedMotion ? 0.25 : 0.55,
                pixi: { y: this.refs.desk.y, alpha: 1 }
            }, "-=0.35");

            tl.to([this.refs.mug, this.refs.lampWrap], {
                duration: this.state.reducedMotion ? 0.2 : 0.4,
                pixi: { alpha: 1 },
                stagger: 0.05
            }, "-=0.18");

            tl.to(this.refs.avatarWrap, {
                duration: this.state.reducedMotion ? 0.3 : 0.8,
                pixi: { y: this.refs.avatarWrap.y, alpha: 1 }
            }, "-=0.15");

            tl.fromTo(
                this.refs.armRightPivot,
                { rotation: -0.18 },
                {
                    rotation: 0.12,
                    duration: this.state.reducedMotion ? 0.2 : 0.35,
                    yoyo: true,
                    repeat: 1,
                    ease: "sine.inOut"
                }
            );
        }

        onSolicit() {
            if (this.state.exiting) return;

            const tl = gsap.timeline({
                defaults: { ease: "power2.out" },
                onComplete: () => this.exitLoader()
            });

            tl.to(this.refs.armRightPivot, {
                rotation: -0.95,
                duration: 0.22
            });

            tl.to(this.refs.armRightPivot, {
                rotation: -0.58,
                duration: 0.18,
                yoyo: true,
                repeat: 2,
                ease: "sine.inOut"
            });

            tl.to(this.refs.armRightPivot, {
                rotation: -0.10,
                duration: 0.26
            });

            tl.to(this.refs.head, {
                rotation: 0.03,
                duration: 0.18
            }, "<");
        }

        exitLoader() {
            if (this.state.exiting) return;
            this.state.exiting = true;

            gsap.timeline({
                defaults: { ease: "power2.inOut" },
                onComplete: () => {
                    this.root.classList.add("is-done");
                    this.dispose();
                }
            })
                .to(this.root, {
                    opacity: 0,
                    duration: 0.52
                });
        }

        dispose() {
            window.removeEventListener("resize", this.boundResize);
            this.canvas?.removeEventListener("pointerdown", this.boundPointerDown);
            this.cta?.removeEventListener("click", this.boundCtaClick);

            if (this.rafId) {
                cancelAnimationFrame(this.rafId);
                this.rafId = 0;
            }

            if (this.app) {
                this.app.destroy(true, { children: true });
                this.app = null;
            }
        }
    }

    window.initPreloaderScene = function initPreloaderScene(options = {}) {
        const controller = new PreloaderSceneController(options);
        controller.init();
        window.__preloaderSceneController = controller;
        return controller;
    };
})();