(() => {
    class PreloaderSceneController {
        constructor(options = {}) {
            this.options = {
                rootSelector: "#preloader",
                stageSelector: "#loaderPixiStage",
                labelSelector: "#loaderLabel",
                actionSelector: "#loaderAction",
                autoStart: true,
                debug: false,
                ...options
            };

            this.root = document.querySelector(this.options.rootSelector);
            this.stageEl = document.querySelector(this.options.stageSelector);
            this.labelEl = document.querySelector(this.options.labelSelector);
            this.actionEl = document.querySelector(this.options.actionSelector);

            this.app = null;
            this.resizeRaf = 0;

            this.state = {
                phase: "boot", // boot | idle | greeting | handoff | done
                isBusy: false,
                greeted: false
            };

            this.refs = {
                scene: null,
                glowBack: null,
                desk: null,
                screen: null,
                screenGlow: null,
                chair: null,
                avatarWrap: null,
                torso: null,
                neck: null,
                head: null,
                hairBack: null,
                hairTop: null,
                bun: null,
                beard: null,
                glassesLeft: null,
                glassesRight: null,
                glassesBridge: null,
                eyeLeft: null,
                eyeRight: null,
                mouth: null,
                armLeft: null,
                armRightWrap: null,
                armRightUpper: null,
                armRightForearm: null,
                handRight: null,
                bubblesWrap: null,
                shoulderHit: null
            };

            this.onResize = this.onResize.bind(this);
            this.onAction = this.onAction.bind(this);
        }

        async init() {
            if (!this.root || !this.stageEl || !window.PIXI || !window.gsap) return;

            await this.setupPixi();
            this.buildScene();
            this.bindEvents();
            this.onResize();

            if (this.options.autoStart) {
                this.enterIdle();
            }
        }

        async setupPixi() {
            this.app = new PIXI.Application();

            await this.app.init({
                resizeTo: this.stageEl,
                backgroundAlpha: 0,
                antialias: true,
                autoDensity: true,
                resolution: Math.min(window.devicePixelRatio || 1, 2)
            });

            this.stageEl.appendChild(this.app.canvas);
            this.refs.scene = new PIXI.Container();
            this.app.stage.addChild(this.refs.scene);
        }

        buildScene() {
            const scene = this.refs.scene;

            const glowBack = new PIXI.Graphics();
            glowBack.circle(0, 0, 260).fill({ color: 0xf7c600, alpha: 0.08 });
            glowBack.position.set(0, 0);
            scene.addChild(glowBack);
            this.refs.glowBack = glowBack;

            const desk = new PIXI.Container();
            scene.addChild(desk);
            this.refs.desk = desk;

            const deskTop = new PIXI.Graphics();
            deskTop.roundRect(-250, -18, 500, 36, 10).fill(0x2a1c18);
            desk.addChild(deskTop);

            const legColor = 0x17223d;
            [-210, -70, 70, 210].forEach((x) => {
                const leg = new PIXI.Graphics();
                leg.roundRect(-10, 0, 20, 140, 6).fill(legColor);
                leg.position.set(x, 16);
                desk.addChild(leg);
            });

            const screen = new PIXI.Container();
            scene.addChild(screen);
            this.refs.screen = screen;

            const screenFrame = new PIXI.Graphics();
            screenFrame.roundRect(-112, -70, 224, 140, 14).fill(0x1b1723);
            screen.addChild(screenFrame);

            const screenInner = new PIXI.Graphics();
            screenInner.roundRect(-96, -54, 192, 108, 10).fill(0x2a3361);
            screen.addChild(screenInner);
            this.refs.screenGlow = screenInner;

            const screenStand = new PIXI.Graphics();
            screenStand.roundRect(-8, 70, 16, 46, 8).fill(0x202840);
            screen.addChild(screenStand);

            const bubblesWrap = new PIXI.Container();
            screen.addChild(bubblesWrap);
            this.refs.bubblesWrap = bubblesWrap;

            const bubbleColors = [0xec4899, 0xf7c600, 0xec4899];
            const bubbleXs = [-38, 0, 38];
            bubbleXs.forEach((x, index) => {
                const b = new PIXI.Graphics();
                b.circle(0, 0, 12).fill(bubbleColors[index]);
                b.position.set(x, -2);
                bubblesWrap.addChild(b);

                gsap.to(b, {
                    pixi: { y: b.y - 8 },
                    duration: 0.8,
                    repeat: -1,
                    yoyo: true,
                    ease: "sine.inOut",
                    delay: index * 0.1
                });

                gsap.to(b.scale, {
                    x: 1.12,
                    y: 1.12,
                    duration: 0.8,
                    repeat: -1,
                    yoyo: true,
                    ease: "sine.inOut",
                    delay: index * 0.1
                });
            });

            const chair = new PIXI.Container();
            scene.addChild(chair);
            this.refs.chair = chair;

            const chairBack = new PIXI.Graphics();
            chairBack.roundRect(-34, -86, 68, 106, 22).fill(0x17223d);
            chair.addChild(chairBack);

            const chairSeat = new PIXI.Graphics();
            chairSeat.roundRect(-44, 6, 88, 24, 12).fill(0x1e2946);
            chair.addChild(chairSeat);

            const chairStem = new PIXI.Graphics();
            chairStem.roundRect(-6, 28, 12, 58, 6).fill(0x111827);
            chair.addChild(chairStem);

            const avatarWrap = new PIXI.Container();
            scene.addChild(avatarWrap);
            this.refs.avatarWrap = avatarWrap;

            const torso = new PIXI.Graphics();
            torso.roundRect(-48, -10, 96, 180, 46).fill(0xd9aa2f);
            avatarWrap.addChild(torso);
            this.refs.torso = torso;

            const neck = new PIXI.Graphics();
            neck.roundRect(-10, -34, 20, 18, 8).fill(0xd9b79f);
            avatarWrap.addChild(neck);
            this.refs.neck = neck;

            const hairBack = new PIXI.Graphics();
            hairBack.ellipse(0, -82, 42, 48).fill(0x1b1723);
            avatarWrap.addChild(hairBack);
            this.refs.hairBack = hairBack;

            const head = new PIXI.Graphics();
            head.ellipse(0, -74, 46, 58).fill(0xd9b79f);
            avatarWrap.addChild(head);
            this.refs.head = head;

            const hairTop = new PIXI.Graphics();
            hairTop.moveTo(-34, -98);
            hairTop.bezierCurveTo(-28, -130, 28, -130, 34, -98);
            hairTop.bezierCurveTo(18, -108, -18, -108, -34, -98);
            hairTop.fill(0x1b1723);
            avatarWrap.addChild(hairTop);
            this.refs.hairTop = hairTop;

            const bun = new PIXI.Graphics();
            bun.circle(0, -124, 12).fill(0x1b1723);
            avatarWrap.addChild(bun);
            this.refs.bun = bun;

            const beard = new PIXI.Graphics();
            beard.ellipse(0, -48, 30, 18).fill(0x1b1723);
            avatarWrap.addChild(beard);
            this.refs.beard = beard;

            const eyeLeft = new PIXI.Graphics();
            eyeLeft.circle(0, 0, 3).fill(0x181818);
            eyeLeft.position.set(-14, -80);
            avatarWrap.addChild(eyeLeft);
            this.refs.eyeLeft = eyeLeft;

            const eyeRight = new PIXI.Graphics();
            eyeRight.circle(0, 0, 3).fill(0x181818);
            eyeRight.position.set(14, -80);
            avatarWrap.addChild(eyeRight);
            this.refs.eyeRight = eyeRight;

            const glassesLeft = new PIXI.Graphics();
            glassesLeft.circle(0, 0, 12).stroke({ color: 0x161616, width: 2 });
            glassesLeft.position.set(-14, -80);
            avatarWrap.addChild(glassesLeft);
            this.refs.glassesLeft = glassesLeft;

            const glassesRight = new PIXI.Graphics();
            glassesRight.circle(0, 0, 12).stroke({ color: 0x161616, width: 2 });
            glassesRight.position.set(14, -80);
            avatarWrap.addChild(glassesRight);
            this.refs.glassesRight = glassesRight;

            const glassesBridge = new PIXI.Graphics();
            glassesBridge.moveTo(-2, -80);
            glassesBridge.lineTo(2, -80);
            glassesBridge.stroke({ color: 0x161616, width: 2 });
            avatarWrap.addChild(glassesBridge);
            this.refs.glassesBridge = glassesBridge;

            const mouth = new PIXI.Graphics();
            mouth.arc(0, -60, 10, 0.15 * Math.PI, 0.85 * Math.PI);
            mouth.stroke({ color: 0xea580c, width: 2.5 });
            avatarWrap.addChild(mouth);
            this.refs.mouth = mouth;

            const armLeft = new PIXI.Container();
            const armLeftUpper = new PIXI.Graphics();
            armLeftUpper.roundRect(-11, -8, 22, 92, 11).fill(0x17223d);
            armLeft.addChild(armLeftUpper);
            armLeft.position.set(-58, 20);
            armLeft.rotation = 0.48;
            avatarWrap.addChild(armLeft);
            this.refs.armLeft = armLeft;

            const armRightWrap = new PIXI.Container();
            armRightWrap.position.set(58, 18);
            avatarWrap.addChild(armRightWrap);
            this.refs.armRightWrap = armRightWrap;

            const armRightUpper = new PIXI.Graphics();
            armRightUpper.roundRect(-10, -8, 20, 76, 10).fill(0x17223d);
            armRightUpper.rotation = -0.55;
            armRightWrap.addChild(armRightUpper);
            this.refs.armRightUpper = armRightUpper;

            const armRightForearm = new PIXI.Graphics();
            armRightForearm.roundRect(-9, -8, 18, 68, 10).fill(0xd9b79f);
            armRightForearm.position.set(26, -8);
            armRightForearm.rotation = -0.75;
            armRightWrap.addChild(armRightForearm);
            this.refs.armRightForearm = armRightForearm;

            const handRight = new PIXI.Graphics();
            handRight.ellipse(0, 0, 12, 10).fill(0xd9b79f);
            handRight.position.set(49, -28);
            armRightWrap.addChild(handRight);
            this.refs.handRight = handRight;

            const shoulderHit = new PIXI.Graphics();
            shoulderHit.circle(0, 0, 26).fill({ color: 0xffffff, alpha: 0.001 });
            shoulderHit.position.set(58, 18);
            shoulderHit.eventMode = "static";
            shoulderHit.cursor = "pointer";
            avatarWrap.addChild(shoulderHit);
            this.refs.shoulderHit = shoulderHit;

            this.refs.shoulderHit.on("pointertap", () => {
                this.handleSolicit();
            });
        }

        bindEvents() {
            window.addEventListener("resize", this.onResize, { passive: true });
            this.actionEl?.addEventListener("click", this.onAction);
        }

        onAction() {
            this.handleSolicit();
        }

        onResize() {
            cancelAnimationFrame(this.resizeRaf);
            this.resizeRaf = requestAnimationFrame(() => {
                this.layoutScene();
            });
        }

        layoutScene() {
            const w = this.stageEl.clientWidth;
            const h = this.stageEl.clientHeight;
            const cx = w * 0.5;
            const deskY = h * 0.78;
            const avatarY = h * 0.57;
            const scale = Math.max(0.78, Math.min(1.15, w / 1280));

            this.refs.glowBack.position.set(cx, h * 0.53);
            this.refs.glowBack.scale.set(scale * 1.35);

            this.refs.screen.position.set(cx, h * 0.60);
            this.refs.screen.scale.set(scale);

            this.refs.desk.position.set(cx, deskY);
            this.refs.desk.scale.set(scale * 1.05, scale);

            this.refs.chair.position.set(cx, avatarY + 64);
            this.refs.chair.scale.set(scale);

            this.refs.avatarWrap.position.set(cx, avatarY);
            this.refs.avatarWrap.scale.set(scale);
        }

        enterIdle() {
            this.state.phase = "idle";
            this.state.isBusy = false;

            if (this.labelEl) {
                this.labelEl.textContent = "Touchez Rémy pour le solliciter.";
            }

            if (this.actionEl) {
                this.actionEl.classList.remove("is-hidden");
                this.actionEl.disabled = false;
            }

            gsap.to(this.refs.avatarWrap, {
                pixi: { y: this.refs.avatarWrap.y - 4 },
                duration: 1.6,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut"
            });

            gsap.to(this.refs.head.scale, {
                x: 0.992,
                y: 1.02,
                duration: 1.7,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut"
            });

            gsap.to(this.refs.screenGlow, {
                alpha: 0.92,
                duration: 1.4,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut"
            });

            gsap.to(this.refs.glowBack.scale, {
                x: this.refs.glowBack.scale.x * 1.03,
                y: this.refs.glowBack.scale.y * 1.03,
                duration: 1.8,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut"
            });
        }

        handleSolicit() {
            if (this.state.isBusy || this.state.phase === "handoff" || this.state.phase === "done") return;
            this.playGreetingAndExit();
        }

        playGreetingAndExit() {
            this.state.isBusy = true;
            this.state.phase = "greeting";

            if (this.actionEl) {
                this.actionEl.disabled = true;
                this.actionEl.classList.add("is-hidden");
            }

            if (this.labelEl) {
                this.labelEl.textContent = "Rémy vous salue…";
            }

            gsap.killTweensOf(this.refs.avatarWrap);
            gsap.killTweensOf(this.refs.head.scale);
            gsap.killTweensOf(this.refs.screenGlow);
            gsap.killTweensOf(this.refs.glowBack.scale);

            const tl = gsap.timeline({
                defaults: { ease: "power2.out" },
                onComplete: () => {
                    this.playHandoff();
                }
            });

            tl.to(this.refs.avatarWrap, {
                pixi: { x: this.refs.avatarWrap.x + 18 },
                duration: 0.28
            });

            tl.to(this.refs.head, {
                rotation: -0.10,
                duration: 0.22
            }, "<");

            tl.to(this.refs.armRightWrap, {
                rotation: -0.9,
                duration: 0.32
            }, "<");

            tl.to(this.refs.armRightWrap, {
                rotation: -0.62,
                duration: 0.18,
                repeat: 2,
                yoyo: true,
                ease: "sine.inOut"
            });

            tl.to(this.refs.head, {
                rotation: 0,
                duration: 0.22
            }, "<");

            tl.to(this.refs.armRightWrap, {
                rotation: -0.12,
                duration: 0.3
            });

            tl.to(this.refs.avatarWrap, {
                pixi: { x: this.refs.avatarWrap.x },
                duration: 0.24
            }, "<");
        }

        playHandoff() {
            this.state.phase = "handoff";
            this.root.classList.add("is-handoff");

            if (this.labelEl) {
                this.labelEl.textContent = "Bienvenue 👋";
            }

            const tl = gsap.timeline({
                defaults: { ease: "power2.inOut" },
                onComplete: () => {
                    this.root.classList.add("is-done");
                    this.state.phase = "done";
                    this.destroy();
                }
            });

            tl.to(this.refs.bubblesWrap.children, {
                pixi: { y: -26 },
                alpha: 0,
                scaleX: 2.4,
                scaleY: 2.4,
                duration: 0.42,
                stagger: 0.04
            });

            tl.to(this.refs.scene, {
                alpha: 0,
                duration: 0.62
            }, "-=0.12");

            tl.to(this.root, {
                opacity: 0,
                duration: 0.72
            }, "-=0.25");
        }

        destroy() {
            window.removeEventListener("resize", this.onResize);
            this.actionEl?.removeEventListener("click", this.onAction);

            if (this.app) {
                this.app.destroy(true, { children: true, texture: true });
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