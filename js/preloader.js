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
                isBusy: false
            };

            this.refs = {
                scene: null,
                ambience: null,
                floorGlow: null,
                desk: null,
                deskTop: null,
                deskFront: null,
                monitorWrap: null,
                monitorInner: null,
                monitorGlow: null,
                mug: null,
                lampWrap: null,
                chair: null,
                avatarWrap: null,
                capeBack: null,
                torso: null,
                neck: null,
                head: null,
                earLeft: null,
                earRight: null,
                hairMass: null,
                fringeLeft: null,
                fringeRight: null,
                bun: null,
                beard: null,
                eyeLeft: null,
                eyeRight: null,
                browLeft: null,
                browRight: null,
                glassesLeft: null,
                glassesRight: null,
                glassesBridge: null,
                nose: null,
                mouth: null,
                armLeft: null,
                forearmLeft: null,
                handLeft: null,
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

            const scene = new PIXI.Container();
            this.app.stage.addChild(scene);
            this.refs.scene = scene;
        }

        buildScene() {
            const scene = this.refs.scene;

            // Ambiance arrière
            const ambience = new PIXI.Container();
            scene.addChild(ambience);
            this.refs.ambience = ambience;

            const blueAura = new PIXI.Graphics();
            blueAura.circle(0, 0, 260).fill({ color: 0x3460b8, alpha: 0.14 });
            ambience.addChild(blueAura);

            const pinkAura = new PIXI.Graphics();
            pinkAura.circle(0, 0, 160).fill({ color: 0xec4899, alpha: 0.10 });
            pinkAura.position.set(180, 40);
            ambience.addChild(pinkAura);

            const yellowAura = new PIXI.Graphics();
            yellowAura.circle(0, 0, 150).fill({ color: 0xf7c600, alpha: 0.10 });
            yellowAura.position.set(-170, 20);
            ambience.addChild(yellowAura);

            // Sol / glow
            const floorGlow = new PIXI.Graphics();
            floorGlow.ellipse(0, 0, 280, 82).fill({ color: 0xf7c600, alpha: 0.10 });
            scene.addChild(floorGlow);
            this.refs.floorGlow = floorGlow;

            // Bureau
            const desk = new PIXI.Container();
            scene.addChild(desk);
            this.refs.desk = desk;

            const deskTop = new PIXI.Graphics();
            deskTop.roundRect(-255, -18, 510, 36, 12).fill(0x1d2030);
            desk.addChild(deskTop);
            this.refs.deskTop = deskTop;

            const deskTopLine = new PIXI.Graphics();
            deskTopLine.roundRect(-255, -18, 510, 8, 8).fill({ color: 0xf7c600, alpha: 0.18 });
            desk.addChild(deskTopLine);

            const deskFront = new PIXI.Graphics();
            deskFront.roundRect(-230, 18, 460, 72, 14).fill(0x121b31);
            desk.addChild(deskFront);
            this.refs.deskFront = deskFront;

            const deskFrontGlow = new PIXI.Graphics();
            deskFrontGlow.roundRect(-230, 18, 460, 72, 14).stroke({ color: 0xec4899, alpha: 0.18, width: 2 });
            desk.addChild(deskFrontGlow);

            [-220, -90, 90, 220].forEach((x) => {
                const leg = new PIXI.Graphics();
                leg.roundRect(-10, 0, 20, 122, 8).fill(0x101726);
                leg.position.set(x, 16);
                desk.addChild(leg);
            });

            // Moniteur
            const monitorWrap = new PIXI.Container();
            scene.addChild(monitorWrap);
            this.refs.monitorWrap = monitorWrap;

            const monitorShadow = new PIXI.Graphics();
            monitorShadow.roundRect(-118, -72, 236, 148, 18).fill({ color: 0x000000, alpha: 0.22 });
            monitorShadow.position.set(0, 6);
            monitorWrap.addChild(monitorShadow);

            const monitorFrame = new PIXI.Graphics();
            monitorFrame.roundRect(-112, -70, 224, 140, 18).fill(0x131726);
            monitorWrap.addChild(monitorFrame);

            const monitorBorder = new PIXI.Graphics();
            monitorBorder.roundRect(-112, -70, 224, 140, 18).stroke({ color: 0xf7c600, alpha: 0.18, width: 2 });
            monitorWrap.addChild(monitorBorder);

            const monitorInner = new PIXI.Graphics();
            monitorInner.roundRect(-96, -54, 192, 108, 12).fill(0x243057);
            monitorWrap.addChild(monitorInner);
            this.refs.monitorInner = monitorInner;

            const monitorGlow = new PIXI.Graphics();
            monitorGlow.roundRect(-96, -54, 192, 108, 12).fill({ color: 0xf7c600, alpha: 0.10 });
            monitorWrap.addChild(monitorGlow);
            this.refs.monitorGlow = monitorGlow;

            const codeLine1 = new PIXI.Graphics();
            codeLine1.roundRect(-66, -22, 96, 8, 4).fill({ color: 0xf7c600, alpha: 0.60 });
            monitorWrap.addChild(codeLine1);

            const codeLine2 = new PIXI.Graphics();
            codeLine2.roundRect(-66, -3, 132, 8, 4).fill({ color: 0xec4899, alpha: 0.52 });
            monitorWrap.addChild(codeLine2);

            const codeLine3 = new PIXI.Graphics();
            codeLine3.roundRect(-66, 16, 76, 8, 4).fill({ color: 0xffffff, alpha: 0.30 });
            monitorWrap.addChild(codeLine3);

            const monitorStem = new PIXI.Graphics();
            monitorStem.roundRect(-10, 70, 20, 46, 8).fill(0x202840);
            monitorWrap.addChild(monitorStem);

            const monitorBase = new PIXI.Graphics();
            monitorBase.roundRect(-44, 114, 88, 14, 7).fill(0x202840);
            monitorWrap.addChild(monitorBase);

            // Mug
            const mug = new PIXI.Container();
            scene.addChild(mug);
            this.refs.mug = mug;

            const mugBody = new PIXI.Graphics();
            mugBody.roundRect(-18, -16, 36, 32, 10).fill(0xec4899);
            mug.addChild(mugBody);

            const mugHandle = new PIXI.Graphics();
            mugHandle.circle(20, 0, 9).stroke({ color: 0xec4899, width: 5 });
            mug.addChild(mugHandle);

            // Lampe
            const lampWrap = new PIXI.Container();
            scene.addChild(lampWrap);
            this.refs.lampWrap = lampWrap;

            const lampBase = new PIXI.Graphics();
            lampBase.roundRect(-22, 40, 44, 10, 5).fill(0x182033);
            lampWrap.addChild(lampBase);

            const lampRod = new PIXI.Graphics();
            lampRod.roundRect(-4, -6, 8, 52, 4).fill(0x182033);
            lampWrap.addChild(lampRod);

            const lampHead = new PIXI.Graphics();
            lampHead.moveTo(-26, -10);
            lampHead.lineTo(18, -18);
            lampHead.lineTo(8, 10);
            lampHead.lineTo(-24, 8);
            lampHead.closePath();
            lampHead.fill(0xf7c600);
            lampWrap.addChild(lampHead);

            const lampLight = new PIXI.Graphics();
            lampLight.moveTo(-12, 8);
            lampLight.lineTo(32, 8);
            lampLight.lineTo(4, 78);
            lampLight.lineTo(-30, 78);
            lampLight.closePath();
            lampLight.fill({ color: 0xf7c600, alpha: 0.08 });
            lampWrap.addChild(lampLight);

            // Chaise
            const chair = new PIXI.Container();
            scene.addChild(chair);
            this.refs.chair = chair;

            const chairBack = new PIXI.Graphics();
            chairBack.roundRect(-38, -94, 76, 112, 24).fill(0x16213b);
            chair.addChild(chairBack);

            const chairBackGlow = new PIXI.Graphics();
            chairBackGlow.roundRect(-38, -94, 76, 112, 24).stroke({ color: 0xf7c600, alpha: 0.08, width: 2 });
            chair.addChild(chairBackGlow);

            const chairSeat = new PIXI.Graphics();
            chairSeat.roundRect(-48, 8, 96, 24, 14).fill(0x1d2948);
            chair.addChild(chairSeat);

            const chairStem = new PIXI.Graphics();
            chairStem.roundRect(-6, 30, 12, 58, 6).fill(0x111827);
            chair.addChild(chairStem);

            const chairFoot = new PIXI.Graphics();
            chairFoot.roundRect(-28, 86, 56, 8, 4).fill(0x111827);
            chair.addChild(chairFoot);

            // Avatar
            const avatarWrap = new PIXI.Container();
            scene.addChild(avatarWrap);
            this.refs.avatarWrap = avatarWrap;

            // Cape / silhouette arrière
            const capeBack = new PIXI.Graphics();
            capeBack.moveTo(-54, 10);
            capeBack.bezierCurveTo(-72, 72, -62, 138, -22, 170);
            capeBack.lineTo(24, 170);
            capeBack.bezierCurveTo(58, 142, 68, 78, 52, 16);
            capeBack.closePath();
            capeBack.fill({ color: 0x9d7420, alpha: 0.24 });
            avatarWrap.addChild(capeBack);
            this.refs.capeBack = capeBack;

            const torso = new PIXI.Graphics();
            torso.roundRect(-52, 0, 104, 176, 52).fill(0xd6a529);
            avatarWrap.addChild(torso);
            this.refs.torso = torso;

            const torsoShade = new PIXI.Graphics();
            torsoShade.roundRect(-20, 8, 72, 160, 34).fill({ color: 0x000000, alpha: 0.08 });
            avatarWrap.addChild(torsoShade);

            const torsoHighlight = new PIXI.Graphics();
            torsoHighlight.roundRect(-46, 8, 26, 146, 20).fill({ color: 0xffffff, alpha: 0.05 });
            avatarWrap.addChild(torsoHighlight);

            const neck = new PIXI.Graphics();
            neck.roundRect(-10, -32, 20, 18, 8).fill(0xd9b79f);
            avatarWrap.addChild(neck);
            this.refs.neck = neck;

            const hairMass = new PIXI.Graphics();
            hairMass.ellipse(0, -82, 48, 58).fill(0x17141d);
            avatarWrap.addChild(hairMass);
            this.refs.hairMass = hairMass;

            const head = new PIXI.Graphics();
            head.ellipse(0, -78, 45, 57).fill(0xd9b79f);
            avatarWrap.addChild(head);
            this.refs.head = head;

            const earLeft = new PIXI.Graphics();
            earLeft.ellipse(0, 0, 6, 10).fill(0xd9b79f);
            earLeft.position.set(-40, -80);
            avatarWrap.addChild(earLeft);
            this.refs.earLeft = earLeft;

            const earRight = new PIXI.Graphics();
            earRight.ellipse(0, 0, 6, 10).fill(0xd9b79f);
            earRight.position.set(40, -80);
            avatarWrap.addChild(earRight);
            this.refs.earRight = earRight;

            const fringeLeft = new PIXI.Graphics();
            fringeLeft.moveTo(-35, -106);
            fringeLeft.bezierCurveTo(-22, -126, -4, -126, 8, -108);
            fringeLeft.bezierCurveTo(-10, -102, -24, -100, -35, -106);
            fringeLeft.fill(0x17141d);
            avatarWrap.addChild(fringeLeft);
            this.refs.fringeLeft = fringeLeft;

            const fringeRight = new PIXI.Graphics();
            fringeRight.moveTo(35, -106);
            fringeRight.bezierCurveTo(22, -126, 4, -126, -8, -108);
            fringeRight.bezierCurveTo(10, -102, 24, -100, 35, -106);
            fringeRight.fill(0x17141d);
            avatarWrap.addChild(fringeRight);
            this.refs.fringeRight = fringeRight;

            const bun = new PIXI.Graphics();
            bun.circle(0, -132, 13).fill(0x17141d);
            avatarWrap.addChild(bun);
            this.refs.bun = bun;

            const beard = new PIXI.Graphics();
            beard.ellipse(0, -46, 29, 18).fill(0x17141d);
            avatarWrap.addChild(beard);
            this.refs.beard = beard;

            const browLeft = new PIXI.Graphics();
            browLeft.roundRect(-16, -92, 12, 3, 2).fill(0x1a1a1a);
            avatarWrap.addChild(browLeft);
            this.refs.browLeft = browLeft;

            const browRight = new PIXI.Graphics();
            browRight.roundRect(4, -92, 12, 3, 2).fill(0x1a1a1a);
            avatarWrap.addChild(browRight);
            this.refs.browRight = browRight;

            const eyeLeft = new PIXI.Graphics();
            eyeLeft.circle(0, 0, 3).fill(0x111111);
            eyeLeft.position.set(-11, -82);
            avatarWrap.addChild(eyeLeft);
            this.refs.eyeLeft = eyeLeft;

            const eyeRight = new PIXI.Graphics();
            eyeRight.circle(0, 0, 3).fill(0x111111);
            eyeRight.position.set(11, -82);
            avatarWrap.addChild(eyeRight);
            this.refs.eyeRight = eyeRight;

            const glassesLeft = new PIXI.Graphics();
            glassesLeft.circle(0, 0, 12).stroke({ color: 0x151515, width: 2 });
            glassesLeft.position.set(-12, -82);
            avatarWrap.addChild(glassesLeft);
            this.refs.glassesLeft = glassesLeft;

            const glassesRight = new PIXI.Graphics();
            glassesRight.circle(0, 0, 12).stroke({ color: 0x151515, width: 2 });
            glassesRight.position.set(12, -82);
            avatarWrap.addChild(glassesRight);
            this.refs.glassesRight = glassesRight;

            const glassesBridge = new PIXI.Graphics();
            glassesBridge.moveTo(-2, -82);
            glassesBridge.lineTo(2, -82);
            glassesBridge.stroke({ color: 0x151515, width: 2 });
            avatarWrap.addChild(glassesBridge);
            this.refs.glassesBridge = glassesBridge;

            const nose = new PIXI.Graphics();
            nose.roundRect(-2.5, -70, 5, 10, 3).fill({ color: 0xc99f82, alpha: 0.65 });
            avatarWrap.addChild(nose);
            this.refs.nose = nose;

            const mouth = new PIXI.Graphics();
            mouth.arc(0, -56, 9, 0.12 * Math.PI, 0.88 * Math.PI);
            mouth.stroke({ color: 0xea580c, width: 2.4 });
            avatarWrap.addChild(mouth);
            this.refs.mouth = mouth;

            // Bras gauche sur le bureau
            const armLeft = new PIXI.Container();
            armLeft.position.set(-48, 28);
            armLeft.rotation = 0.46;
            avatarWrap.addChild(armLeft);
            this.refs.armLeft = armLeft;

            const armLeftUpper = new PIXI.Graphics();
            armLeftUpper.roundRect(-10, -6, 20, 76, 10).fill(0xc39124);
            armLeft.addChild(armLeftUpper);

            const forearmLeft = new PIXI.Container();
            forearmLeft.position.set(26, 42);
            forearmLeft.rotation = -0.38;
            armLeft.addChild(forearmLeft);
            this.refs.forearmLeft = forearmLeft;

            const forearmLeftShape = new PIXI.Graphics();
            forearmLeftShape.roundRect(-9, -6, 18, 58, 9).fill(0xd9b79f);
            forearmLeft.addChild(forearmLeftShape);

            const handLeft = new PIXI.Graphics();
            handLeft.ellipse(16, 40, 12, 9).fill(0xd9b79f);
            forearmLeft.addChild(handLeft);
            this.refs.handLeft = handLeft;

            // Bras droit animé
            const armRightWrap = new PIXI.Container();
            armRightWrap.position.set(50, 22);
            avatarWrap.addChild(armRightWrap);
            this.refs.armRightWrap = armRightWrap;

            const armRightUpper = new PIXI.Graphics();
            armRightUpper.roundRect(-10, -6, 20, 78, 10).fill(0xc39124);
            armRightUpper.rotation = -0.56;
            armRightWrap.addChild(armRightUpper);
            this.refs.armRightUpper = armRightUpper;

            const armRightForearm = new PIXI.Graphics();
            armRightForearm.roundRect(-9, -6, 18, 64, 9).fill(0xd9b79f);
            armRightForearm.position.set(24, -4);
            armRightForearm.rotation = -0.74;
            armRightWrap.addChild(armRightForearm);
            this.refs.armRightForearm = armRightForearm;

            const handRight = new PIXI.Graphics();
            handRight.ellipse(0, 0, 12, 9).fill(0xd9b79f);
            handRight.position.set(47, -26);
            armRightWrap.addChild(handRight);
            this.refs.handRight = handRight;

            const shoulderHit = new PIXI.Graphics();
            shoulderHit.circle(0, 0, 28).fill({ color: 0xffffff, alpha: 0.001 });
            shoulderHit.position.set(50, 22);
            shoulderHit.eventMode = "static";
            shoulderHit.cursor = "pointer";
            avatarWrap.addChild(shoulderHit);
            this.refs.shoulderHit = shoulderHit;

            shoulderHit.on("pointertap", () => {
                this.handleSolicit();
            });

            // Bulles
            const bubblesWrap = new PIXI.Container();
            monitorWrap.addChild(bubblesWrap);
            this.refs.bubblesWrap = bubblesWrap;

            const bubbleColors = [0xec4899, 0xf7c600, 0xec4899];
            const bubbleXs = [-36, 0, 36];

            bubbleXs.forEach((x, index) => {
                const b = new PIXI.Graphics();
                b.circle(0, 0, 11).fill(bubbleColors[index]);
                b.position.set(x, -2);
                bubblesWrap.addChild(b);

                gsap.to(b, {
                    pixi: { y: b.y - 8 },
                    duration: 0.85,
                    repeat: -1,
                    yoyo: true,
                    ease: "sine.inOut",
                    delay: index * 0.12
                });

                gsap.to(b.scale, {
                    x: 1.14,
                    y: 1.14,
                    duration: 0.85,
                    repeat: -1,
                    yoyo: true,
                    ease: "sine.inOut",
                    delay: index * 0.12
                });
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

            const scale = Math.max(0.78, Math.min(1.14, w / 1280));
            const cx = w * 0.5;

            this.refs.ambience.position.set(cx, h * 0.45);

            this.refs.floorGlow.position.set(cx, h * 0.79);
            this.refs.floorGlow.scale.set(scale * 1.06, scale);

            this.refs.monitorWrap.position.set(cx + 8 * scale, h * 0.56);
            this.refs.monitorWrap.scale.set(scale);

            this.refs.desk.position.set(cx, h * 0.75);
            this.refs.desk.scale.set(scale * 1.02, scale);

            this.refs.mug.position.set(cx - 132 * scale, h * 0.704);
            this.refs.mug.scale.set(scale);

            this.refs.lampWrap.position.set(cx + 200 * scale, h * 0.62);
            this.refs.lampWrap.scale.set(scale);

            this.refs.chair.position.set(cx - 6 * scale, h * 0.61);
            this.refs.chair.scale.set(scale);

            this.refs.avatarWrap.position.set(cx - 2 * scale, h * 0.56);
            this.refs.avatarWrap.scale.set(scale);
        }

        enterIdle() {
            this.state.phase = "idle";
            this.state.isBusy = false;

            if (this.labelEl) {
                this.labelEl.textContent = "Touchez Rémy pour le solliciter.";
            }

            if (this.actionEl) {
                this.actionEl.disabled = false;
                this.actionEl.classList.remove("is-hidden");
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
                y: 1.018,
                duration: 1.7,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut"
            });

            gsap.to(this.refs.monitorGlow, {
                alpha: 0.92,
                duration: 1.5,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut"
            });

            gsap.to(this.refs.floorGlow.scale, {
                x: this.refs.floorGlow.scale.x * 1.03,
                y: this.refs.floorGlow.scale.y * 1.03,
                duration: 1.8,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut"
            });

            gsap.to(this.refs.mug, {
                pixi: { y: this.refs.mug.y - 1.5 },
                duration: 2.1,
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
            gsap.killTweensOf(this.refs.monitorGlow);
            gsap.killTweensOf(this.refs.floorGlow.scale);
            gsap.killTweensOf(this.refs.mug);

            const originX = this.refs.avatarWrap.x;

            const tl = gsap.timeline({
                defaults: { ease: "power2.out" },
                onComplete: () => {
                    this.playHandoff();
                }
            });

            tl.to(this.refs.avatarWrap, {
                pixi: { x: originX + 14 },
                duration: 0.26
            });

            tl.to(this.refs.head, {
                rotation: -0.10,
                duration: 0.2
            }, "<");

            tl.to(this.refs.armRightWrap, {
                rotation: -0.92,
                duration: 0.28
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
                duration: 0.28
            });

            tl.to(this.refs.avatarWrap, {
                pixi: { x: originX },
                duration: 0.22
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
                pixi: { y: -28 },
                alpha: 0,
                scaleX: 2.5,
                scaleY: 2.5,
                duration: 0.42,
                stagger: 0.04
            });

            tl.to(this.refs.scene, {
                alpha: 0,
                duration: 0.62
            }, "-=0.10");

            tl.to(this.root, {
                opacity: 0,
                duration: 0.72
            }, "-=0.22");
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