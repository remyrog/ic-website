(() => {
    class PreloaderSceneController {
        constructor(options = {}) {
            this.options = {
                rootSelector: "#preloader",
                canvasSelector: "#loaderCanvas",
                autoStart: false,
                minDuration: 0,
                debug: false,
                ...options
            };

            this.root = document.querySelector(this.options.rootSelector);
            this.canvas = this.root?.querySelector(this.options.canvasSelector);
            this.sceneRoot = this.root?.querySelector(".loader-scene");

            this.solicitBtn = this.root?.querySelector("#loaderSolicitBtn");
            this.enterBtn = this.root?.querySelector("#loaderEnterBtn");
            this.label = this.root?.querySelector("#loaderLabel");

            this.renderer = null;
            this.scene = null;
            this.camera = null;
            this.clock = null;
            this.rafId = 0;

            this.raycaster = null;
            this.pointer = new THREE.Vector2();

            this.state = {
                phase: "idle", // idle | greeting | ready | handoff | done
                hasGreeted: false,
                isTransitioning: false,
                reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches
            };

            this.groups = {
                world: null,
                desk: null,
                chair: null,
                avatar: null,
                bubbles: [],
                screenGlow: null
            };

            this.parts = {
                torso: null,
                head: null,
                armPivot: null,
                shoulderHit: null,
                screen: null
            };

            this.boundResize = this.onResize.bind(this);
            this.boundPointerDown = this.onPointerDown.bind(this);
        }

        init() {
            if (!this.root || !this.canvas || typeof THREE === "undefined" || typeof gsap === "undefined") {
                return;
            }

            this.setupRenderer();
            this.setupScene();
            this.setupCamera();
            this.setupLights();
            this.buildWorld();
            this.bindEvents();
            this.onResize();
            this.startLoop();
            this.setIdleUI();
        }

        setupRenderer() {
            this.renderer = new THREE.WebGLRenderer({
                canvas: this.canvas,
                antialias: true,
                alpha: true,
                powerPreference: "high-performance"
            });

            this.renderer.outputColorSpace = THREE.SRGBColorSpace;
            this.renderer.setClearColor(0x000000, 0);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.isMobile() ? 1.2 : 1.7));
            this.clock = new THREE.Clock();
            this.raycaster = new THREE.Raycaster();
        }

        setupScene() {
            this.scene = new THREE.Scene();
            this.scene.fog = new THREE.Fog(0x06122d, 8, 22);

            const world = new THREE.Group();
            world.position.set(0, -0.8, 0);
            this.scene.add(world);
            this.groups.world = world;
        }

        setupCamera() {
            this.camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
            this.camera.position.set(0, 1.15, 7.25);
            this.camera.lookAt(0, 0.98, 0.45);
        }

        setupLights() {
            const ambient = new THREE.AmbientLight(0xffffff, 0.95);
            this.scene.add(ambient);

            const keyLight = new THREE.DirectionalLight(0xfff2d6, 1.1);
            keyLight.position.set(3.6, 4.2, 5.5);
            this.scene.add(keyLight);

            const rimLight = new THREE.DirectionalLight(0x5b8cff, 0.55);
            rimLight.position.set(-4.5, 2.6, -2.5);
            this.scene.add(rimLight);

            const pinkFill = new THREE.PointLight(0xec4899, 0.55, 10);
            pinkFill.position.set(2.2, 1.8, 2.4);
            this.scene.add(pinkFill);

            const screenLight = new THREE.PointLight(0xf7c600, 0.95, 8);
            screenLight.position.set(0, 1.55, 1.9);
            this.scene.add(screenLight);
        }

        buildWorld() {
            this.buildFloor();
            this.buildDesk();
            this.buildChair();
            this.buildAvatar();
            this.buildScreenBubbles();
        }

        buildFloor() {
            const floor = new THREE.Mesh(
                new THREE.CircleGeometry(7.4, 64),
                new THREE.MeshStandardMaterial({
                    color: 0x081024,
                    roughness: 0.95,
                    metalness: 0.02
                })
            );
            floor.rotation.x = -Math.PI / 2;
            floor.position.y = -1.6;
            this.groups.world.add(floor);

            const halo = new THREE.Mesh(
                new THREE.CircleGeometry(3.1, 48),
                new THREE.MeshBasicMaterial({
                    color: 0xf7c600,
                    transparent: true,
                    opacity: 0.08
                })
            );
            halo.rotation.x = -Math.PI / 2;
            halo.position.set(0, -1.58, 0.8);
            this.groups.world.add(halo);
        }

        buildDesk() {
            const desk = new THREE.Group();

            const top = new THREE.Mesh(
                new THREE.BoxGeometry(3.8, 0.18, 1.7),
                new THREE.MeshStandardMaterial({
                    color: 0x0d1730,
                    roughness: 0.84,
                    metalness: 0.08
                })
            );
            top.position.set(0, 0.25, 0.55);
            desk.add(top);

            const legGeometry = new THREE.BoxGeometry(0.14, 1.2, 0.14);
            const legMaterial = new THREE.MeshStandardMaterial({
                color: 0x182540,
                roughness: 0.7,
                metalness: 0.25
            });

            const legPositions = [
                [-1.65, -0.4, -0.05],
                [1.65, -0.4, -0.05],
                [-1.65, -0.4, 1.15],
                [1.65, -0.4, 1.15]
            ];

            legPositions.forEach(([x, y, z]) => {
                const leg = new THREE.Mesh(legGeometry, legMaterial);
                leg.position.set(x, y, z);
                desk.add(leg);
            });

            const screenStand = new THREE.Mesh(
                new THREE.CylinderGeometry(0.06, 0.08, 0.5, 20),
                new THREE.MeshStandardMaterial({
                    color: 0x1a2540,
                    roughness: 0.55,
                    metalness: 0.35
                })
            );
            screenStand.position.set(0, 0.68, 0.62);
            desk.add(screenStand);

            const screenFrame = new THREE.Mesh(
                new THREE.BoxGeometry(1.55, 0.95, 0.08),
                new THREE.MeshStandardMaterial({
                    color: 0x0b1220,
                    roughness: 0.45,
                    metalness: 0.2
                })
            );
            screenFrame.position.set(0, 1.22, 0.62);
            desk.add(screenFrame);

            const screen = new THREE.Mesh(
                new THREE.PlaneGeometry(1.34, 0.76),
                new THREE.MeshBasicMaterial({
                    color: 0x18294d
                })
            );
            screen.position.set(0, 1.22, 0.665);
            desk.add(screen);
            this.parts.screen = screen;

            const glow = new THREE.Mesh(
                new THREE.PlaneGeometry(1.55, 0.95),
                new THREE.MeshBasicMaterial({
                    color: 0xf7c600,
                    transparent: true,
                    opacity: 0.08
                })
            );
            glow.position.set(0, 1.22, 0.64);
            desk.add(glow);
            this.groups.screenGlow = glow;

            this.groups.desk = desk;
            this.groups.world.add(desk);
        }

        buildChair() {
            const chair = new THREE.Group();

            const chairMaterial = new THREE.MeshStandardMaterial({
                color: 0x14213d,
                roughness: 0.72,
                metalness: 0.08
            });

            const seat = new THREE.Mesh(
                new THREE.BoxGeometry(0.9, 0.12, 0.9),
                chairMaterial
            );
            seat.position.set(0, -0.25, 0.1);
            chair.add(seat);

            const back = new THREE.Mesh(
                new THREE.BoxGeometry(0.88, 1.1, 0.12),
                chairMaterial
            );
            back.position.set(0, 0.38, -0.28);
            chair.add(back);

            const stem = new THREE.Mesh(
                new THREE.CylinderGeometry(0.06, 0.08, 0.72, 16),
                new THREE.MeshStandardMaterial({
                    color: 0x0f172a,
                    roughness: 0.55,
                    metalness: 0.32
                })
            );
            stem.position.set(0, -0.7, 0.05);
            chair.add(stem);

            chair.position.set(0, -0.15, 1.85);
            this.groups.chair = chair;
            this.groups.world.add(chair);
        }

        buildAvatar() {
            const avatar = new THREE.Group();

            const clothMaterial = new THREE.MeshStandardMaterial({
                color: 0xf0c24f,
                roughness: 0.7,
                metalness: 0.12
            });

            const sleeveMaterial = new THREE.MeshStandardMaterial({
                color: 0x1a2443,
                roughness: 0.82,
                metalness: 0.04
            });

            const skinMaterial = new THREE.MeshStandardMaterial({
                color: 0xd7b49a,
                roughness: 0.95,
                metalness: 0.01
            });

            const hairMaterial = new THREE.MeshStandardMaterial({
                color: 0x111827,
                roughness: 0.92,
                metalness: 0.02
            });

            const glassesMaterial = new THREE.MeshStandardMaterial({
                color: 0x111111,
                roughness: 0.4,
                metalness: 0.6
            });

            const torso = new THREE.Mesh(
                new THREE.CapsuleGeometry(0.33, 0.7, 8, 16),
                clothMaterial
            );
            torso.position.set(0, 0.48, 0);
            torso.scale.set(1, 1.06, 0.82);
            avatar.add(torso);
            this.parts.torso = torso;

            const neck = new THREE.Mesh(
                new THREE.CylinderGeometry(0.08, 0.085, 0.14, 16),
                skinMaterial
            );
            neck.position.set(0, 1.0, 0.04);
            avatar.add(neck);

            const head = new THREE.Mesh(
                new THREE.SphereGeometry(0.29, 28, 28),
                skinMaterial
            );
            head.scale.set(0.94, 1.12, 0.9);
            head.position.set(0, 1.28, 0.08);
            avatar.add(head);
            this.parts.head = head;

            const hairTop = new THREE.Mesh(
                new THREE.SphereGeometry(0.285, 22, 22),
                hairMaterial
            );
            hairTop.scale.set(1.0, 0.48, 0.9);
            hairTop.position.set(0, 1.43, 0.02);
            avatar.add(hairTop);

            const hairSideL = new THREE.Mesh(
                new THREE.SphereGeometry(0.09, 16, 16),
                hairMaterial
            );
            hairSideL.scale.set(0.8, 1.25, 0.7);
            hairSideL.position.set(-0.21, 1.29, 0.0);
            avatar.add(hairSideL);

            const hairSideR = hairSideL.clone();
            hairSideR.position.x = 0.21;
            avatar.add(hairSideR);

            const bun = new THREE.Mesh(
                new THREE.SphereGeometry(0.09, 16, 16),
                hairMaterial
            );
            bun.position.set(0, 1.38, -0.25);
            avatar.add(bun);

            const beard = new THREE.Mesh(
                new THREE.SphereGeometry(0.15, 18, 18),
                hairMaterial
            );
            beard.scale.set(1.08, 0.55, 0.72);
            beard.position.set(0, 1.11, 0.15);
            avatar.add(beard);

            const moustache = new THREE.Mesh(
                new THREE.SphereGeometry(0.065, 14, 14),
                hairMaterial
            );
            moustache.scale.set(1.65, 0.26, 0.4);
            moustache.position.set(0, 1.16, 0.23);
            avatar.add(moustache);

            const leftGlasses = new THREE.Mesh(
                new THREE.TorusGeometry(0.072, 0.008, 10, 28),
                glassesMaterial
            );
            leftGlasses.position.set(-0.085, 1.29, 0.275);
            avatar.add(leftGlasses);

            const rightGlasses = leftGlasses.clone();
            rightGlasses.position.x = 0.085;
            avatar.add(rightGlasses);

            const bridge = new THREE.Mesh(
                new THREE.BoxGeometry(0.05, 0.008, 0.008),
                glassesMaterial
            );
            bridge.position.set(0, 1.29, 0.275);
            avatar.add(bridge);

            const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x1a1a1a });

            const leftEye = new THREE.Mesh(
                new THREE.SphereGeometry(0.011, 10, 10),
                eyeMaterial
            );
            leftEye.position.set(-0.085, 1.285, 0.277);
            avatar.add(leftEye);

            const rightEye = leftEye.clone();
            rightEye.position.x = 0.085;
            avatar.add(rightEye);

            const nose = new THREE.Mesh(
                new THREE.SphereGeometry(0.022, 12, 12),
                skinMaterial
            );
            nose.scale.set(0.75, 1.15, 0.6);
            nose.position.set(0, 1.22, 0.29);
            avatar.add(nose);

            const leftArm = new THREE.Mesh(
                new THREE.CapsuleGeometry(0.078, 0.4, 6, 12),
                sleeveMaterial
            );
            leftArm.rotation.z = 0.42;
            leftArm.position.set(-0.39, 0.72, 0.02);
            avatar.add(leftArm);

            const rightArmPivot = new THREE.Group();
            rightArmPivot.position.set(0.37, 0.88, 0.03);
            avatar.add(rightArmPivot);
            this.parts.armPivot = rightArmPivot;

            const rightUpperArm = new THREE.Mesh(
                new THREE.CapsuleGeometry(0.078, 0.38, 6, 12),
                sleeveMaterial
            );
            rightUpperArm.rotation.z = -0.62;
            rightUpperArm.position.set(0.14, -0.13, 0);
            rightArmPivot.add(rightUpperArm);

            const forearm = new THREE.Mesh(
                new THREE.CapsuleGeometry(0.065, 0.32, 6, 12),
                skinMaterial
            );
            forearm.rotation.z = -0.84;
            forearm.position.set(0.32, 0.0, 0.02);
            rightArmPivot.add(forearm);

            const hand = new THREE.Mesh(
                new THREE.SphereGeometry(0.065, 14, 14),
                skinMaterial
            );
            hand.scale.set(1.0, 0.82, 0.6);
            hand.position.set(0.46, 0.11, 0.05);
            rightArmPivot.add(hand);

            const shoulderHit = new THREE.Mesh(
                new THREE.SphereGeometry(0.22, 14, 14),
                new THREE.MeshBasicMaterial({
                    transparent: true,
                    opacity: 0
                })
            );
            shoulderHit.name = "shoulderHit";
            shoulderHit.position.set(0.39, 0.88, 0.03);
            avatar.add(shoulderHit);
            this.parts.shoulderHit = shoulderHit;

            avatar.position.set(0, -0.02, 1.85);
            avatar.rotation.y = -0.08;

            this.groups.avatar = avatar;
            this.groups.world.add(avatar);
        }

        buildScreenBubbles() {
            const bubbleColors = [0xec4899, 0xf7c600, 0xec4899];
            const xs = [-0.24, 0, 0.24];

            bubbleColors.forEach((color, index) => {
                const bubble = new THREE.Mesh(
                    new THREE.CircleGeometry(0.055, 24),
                    new THREE.MeshBasicMaterial({
                        color,
                        transparent: true,
                        opacity: 0.92
                    })
                );
                bubble.position.set(xs[index], 1.22, 0.69);
                this.groups.world.add(bubble);
                this.groups.bubbles.push(bubble);

                gsap.to(bubble.position, {
                    y: bubble.position.y + 0.04,
                    duration: 0.7,
                    repeat: -1,
                    yoyo: true,
                    ease: "sine.inOut",
                    delay: index * 0.14
                });

                gsap.to(bubble.scale, {
                    x: 1.12,
                    y: 1.12,
                    duration: 0.7,
                    repeat: -1,
                    yoyo: true,
                    ease: "sine.inOut",
                    delay: index * 0.14
                });
            });
        }

        bindEvents() {
            window.addEventListener("resize", this.boundResize, { passive: true });
            this.canvas.addEventListener("pointerdown", this.boundPointerDown, { passive: true });

            this.solicitBtn?.addEventListener("click", () => this.playGreeting());
            this.enterBtn?.addEventListener("click", () => this.playHandoff());
        }

        onResize() {
            if (!this.renderer || !this.camera || !this.sceneRoot) return;

            const rect = this.sceneRoot.getBoundingClientRect();
            const width = Math.max(1, rect.width);
            const height = Math.max(1, rect.height);

            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();

            this.renderer.setSize(width, height, false);
            this.renderer.setPixelRatio(
                Math.min(window.devicePixelRatio || 1, this.isMobile() ? 1.2 : 1.7)
            );
        }

        onPointerDown(event) {
            if (!this.camera || !this.scene || this.state.isTransitioning) return;

            const rect = this.canvas.getBoundingClientRect();
            this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            this.raycaster.setFromCamera(this.pointer, this.camera);

            const targets = [this.parts.shoulderHit].filter(Boolean);
            const hits = this.raycaster.intersectObjects(targets, false);
            if (!hits.length) return;

            const hitName = hits[0].object.name;

            if (hitName === "shoulderHit") {
                this.playGreeting();
            }
        }

        startLoop() {
            const tick = () => {
                this.rafId = requestAnimationFrame(tick);
                const elapsed = this.clock.getElapsedTime();

                if (this.groups.avatar) {
                    this.groups.avatar.position.y = 0.01 * Math.sin(elapsed * 1.7) - 0.02;
                    if (this.parts.head) this.parts.head.rotation.x = 0.02 * Math.sin(elapsed * 1.2);
                    if (this.parts.torso) this.parts.torso.rotation.z = 0.01 * Math.sin(elapsed * 1.1);
                }

                if (this.groups.screenGlow) {
                    this.groups.screenGlow.material.opacity = 0.08 + Math.sin(elapsed * 1.8) * 0.02;
                }

                this.renderer.render(this.scene, this.camera);
            };

            tick();
        }

        setIdleUI() {
            if (this.label) this.label.textContent = "Touchez Rémy pour le solliciter.";
            if (this.solicitBtn) this.solicitBtn.hidden = false;
            if (this.enterBtn) this.enterBtn.hidden = true;
        }

        setReadyUI() {
            if (this.label) this.label.textContent = "Rémy est prêt à vous accueillir.";
            if (this.solicitBtn) this.solicitBtn.hidden = true;
            if (this.enterBtn) this.enterBtn.hidden = false;
        }

        playGreeting() {
            if (this.state.isTransitioning) return;
            if (this.state.phase === "greeting") return;

            this.state.phase = "greeting";

            gsap.killTweensOf(this.parts.armPivot.rotation);
            gsap.killTweensOf(this.parts.head.rotation);
            gsap.killTweensOf(this.groups.avatar.rotation);
            gsap.killTweensOf(this.groups.avatar.position);

            if (this.label) {
                this.label.textContent = "Rémy vous répond…";
            }

            const tl = gsap.timeline({
                defaults: { ease: "power2.out" },
                onComplete: () => {
                    this.state.phase = "ready";
                    this.state.hasGreeted = true;
                    this.setReadyUI();
                }
            });

            tl.to(this.groups.avatar.rotation, {
                y: 0.18,
                duration: 0.38
            });

            tl.to(this.groups.avatar.position, {
                x: 0.18,
                z: 1.98,
                duration: 0.38
            }, "<");

            tl.to(this.parts.head.rotation, {
                y: 0.12,
                x: -0.05,
                duration: 0.18
            }, "<");

            tl.to(this.parts.armPivot.rotation, {
                z: -0.98,
                y: 0.14,
                duration: 0.24
            }, "<+0.05");

            tl.to(this.parts.armPivot.rotation, {
                z: -0.62,
                duration: 0.2,
                repeat: 2,
                yoyo: true,
                ease: "sine.inOut"
            });

            tl.to(this.parts.armPivot.rotation, {
                z: -0.18,
                y: 0,
                duration: 0.32
            });

            tl.to(this.parts.head.rotation, {
                x: 0,
                y: 0.06,
                duration: 0.22
            }, "<");
        }

        playHandoff() {
            if (this.state.isTransitioning || !this.root) return;

            this.state.phase = "handoff";
            this.state.isTransitioning = true;
            this.root.classList.add("is-handoff");

            const tl = gsap.timeline({
                defaults: { ease: "power2.inOut" },
                onComplete: () => {
                    this.root.classList.add("is-done");
                    this.state.phase = "done";
                    this.dispose();
                }
            });

            if (this.label) {
                this.label.textContent = "Bienvenue.";
            }

            if (this.enterBtn) {
                this.enterBtn.disabled = true;
            }

            tl.to(this.groups.screenGlow.material, {
                opacity: 0.42,
                duration: 0.5
            });

            tl.to(this.camera.position, {
                z: 6.8,
                duration: 0.5
            }, "<");

            this.groups.bubbles.forEach((bubble, index) => {
                tl.to(bubble.scale, {
                    x: 2.8,
                    y: 2.8,
                    duration: 0.34
                }, `<+${index * 0.03}`);

                tl.to(bubble.material, {
                    opacity: 0,
                    duration: 0.38
                }, "<");
            });

            tl.to(this.root, {
                opacity: 0,
                duration: 0.72
            }, "-=0.04");
        }

        isMobile() {
            return window.matchMedia("(max-width: 760px)").matches;
        }

        dispose() {
            window.removeEventListener("resize", this.boundResize);
            this.canvas?.removeEventListener("pointerdown", this.boundPointerDown);

            if (this.rafId) {
                cancelAnimationFrame(this.rafId);
                this.rafId = 0;
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