(() => {
    class PreloaderSceneController {
        constructor(options = {}) {
            this.options = {
                rootSelector: "#preloader",
                canvasSelector: "#loaderCanvas",
                autoStart: true,
                minDuration: 4200,
                debug: false,
                ...options
            };

            this.root = document.querySelector(this.options.rootSelector);
            this.canvas = this.root?.querySelector(this.options.canvasSelector);
            this.sceneRoot = this.root?.querySelector(".loader-scene");

            this.renderer = null;
            this.scene = null;
            this.camera = null;
            this.clock = null;
            this.rafId = 0;

            this.raycaster = null;
            this.pointer = new THREE.Vector2();

            this.state = {
                phase: "boot", // boot | loading | greeting | standing | reseating | handoff | done
                canReplayGreeting: false,
                canReplaySeating: false,
                isTransitioning: false,
                hasPlayedIntro: false,
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
                chairSeat: null,
                chairBack: null,
                torso: null,
                head: null,
                armPivot: null,
                shoulderHit: null,
                chairHit: null,
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

            if (this.options.autoStart) {
                this.playIntro();
            }
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
            this.camera.position.set(0, 1.3, 8.2);
            this.camera.lookAt(0, 1.1, 0);
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

            const screenLight = new THREE.PointLight(0xf7c600, 0.8, 8);
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
                    color: 0x231912,
                    roughness: 0.88,
                    metalness: 0.06
                })
            );
            top.position.set(0, 0.25, 0.55);
            desk.add(top);

            const legGeometry = new THREE.BoxGeometry(0.14, 1.2, 0.14);
            const legMaterial = new THREE.MeshStandardMaterial({
                color: 0x131c2e,
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
                    color: 0x131c2e,
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
                    color: 0x0f2448
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

            const seat = new THREE.Mesh(
                new THREE.BoxGeometry(0.9, 0.12, 0.9),
                new THREE.MeshStandardMaterial({
                    color: 0x1a2236,
                    roughness: 0.72,
                    metalness: 0.08
                })
            );
            seat.position.set(0, -0.25, 0.1);
            chair.add(seat);
            this.parts.chairSeat = seat;

            const back = new THREE.Mesh(
                new THREE.BoxGeometry(0.88, 1.1, 0.12),
                new THREE.MeshStandardMaterial({
                    color: 0x1a2236,
                    roughness: 0.72,
                    metalness: 0.08
                })
            );
            back.position.set(0, 0.38, -0.28);
            chair.add(back);
            this.parts.chairBack = back;

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

            const chairHit = new THREE.Mesh(
                new THREE.BoxGeometry(1.2, 1.8, 1.4),
                new THREE.MeshBasicMaterial({
                    transparent: true,
                    opacity: 0
                })
            );
            chairHit.name = "chairHit";
            chairHit.position.set(0, 0.05, 0);
            chair.add(chairHit);
            this.parts.chairHit = chairHit;

            chair.position.set(0, -0.15, 1.85);

            this.groups.chair = chair;
            this.groups.world.add(chair);
        }

        buildAvatar() {
            const avatar = new THREE.Group();

            const bodyMaterial = new THREE.MeshStandardMaterial({
                color: 0x0b0f16,
                roughness: 0.82,
                metalness: 0.03
            });

            const skinMaterial = new THREE.MeshStandardMaterial({
                color: 0xd9b79f,
                roughness: 0.92,
                metalness: 0.01
            });

            const hairMaterial = new THREE.MeshStandardMaterial({
                color: 0x221712,
                roughness: 0.84,
                metalness: 0.02
            });

            const torso = new THREE.Mesh(
                new THREE.CapsuleGeometry(0.42, 0.82, 8, 16),
                bodyMaterial
            );
            torso.position.set(0, 0.55, 0);
            avatar.add(torso);
            this.parts.torso = torso;

            const neck = new THREE.Mesh(
                new THREE.CylinderGeometry(0.11, 0.11, 0.18, 16),
                skinMaterial
            );
            neck.position.set(0, 1.18, 0.04);
            avatar.add(neck);

            const head = new THREE.Mesh(
                new THREE.SphereGeometry(0.34, 24, 24),
                skinMaterial
            );
            head.scale.set(1, 1.08, 0.98);
            head.position.set(0, 1.48, 0.08);
            avatar.add(head);
            this.parts.head = head;

            const beard = new THREE.Mesh(
                new THREE.SphereGeometry(0.23, 18, 18),
                hairMaterial
            );
            beard.scale.set(1.12, 0.65, 1.02);
            beard.position.set(0, 1.29, 0.2);
            avatar.add(beard);

            const hairCap = new THREE.Mesh(
                new THREE.SphereGeometry(0.345, 18, 18),
                hairMaterial
            );
            hairCap.scale.set(1.02, 0.72, 1);
            hairCap.position.set(0, 1.65, 0.03);
            avatar.add(hairCap);

            const bun = new THREE.Mesh(
                new THREE.SphereGeometry(0.12, 14, 14),
                hairMaterial
            );
            bun.position.set(0, 1.72, -0.24);
            avatar.add(bun);

            const glassesMaterial = new THREE.MeshStandardMaterial({
                color: 0x111111,
                roughness: 0.48,
                metalness: 0.55
            });

            const leftGlasses = new THREE.Mesh(
                new THREE.TorusGeometry(0.1, 0.012, 10, 24),
                glassesMaterial
            );
            leftGlasses.position.set(-0.11, 1.49, 0.35);
            avatar.add(leftGlasses);

            const rightGlasses = leftGlasses.clone();
            rightGlasses.position.x = 0.11;
            avatar.add(rightGlasses);

            const bridge = new THREE.Mesh(
                new THREE.BoxGeometry(0.08, 0.01, 0.01),
                glassesMaterial
            );
            bridge.position.set(0, 1.49, 0.35);
            avatar.add(bridge);

            const leftArmBase = new THREE.Mesh(
                new THREE.CapsuleGeometry(0.1, 0.5, 6, 12),
                bodyMaterial
            );
            leftArmBase.rotation.z = 0.35;
            leftArmBase.position.set(-0.48, 0.78, 0.02);
            avatar.add(leftArmBase);

            const rightArmPivot = new THREE.Group();
            rightArmPivot.position.set(0.46, 0.96, 0.02);
            avatar.add(rightArmPivot);
            this.parts.armPivot = rightArmPivot;

            const rightUpperArm = new THREE.Mesh(
                new THREE.CapsuleGeometry(0.1, 0.48, 6, 12),
                bodyMaterial
            );
            rightUpperArm.rotation.z = -0.55;
            rightUpperArm.position.set(0.18, -0.16, 0);
            rightArmPivot.add(rightUpperArm);

            const forearm = new THREE.Mesh(
                new THREE.CapsuleGeometry(0.085, 0.4, 6, 12),
                skinMaterial
            );
            forearm.rotation.z = -0.8;
            forearm.position.set(0.42, -0.03, 0.03);
            rightArmPivot.add(forearm);

            const hand = new THREE.Mesh(
                new THREE.SphereGeometry(0.09, 14, 14),
                skinMaterial
            );
            hand.scale.set(1.1, 0.9, 0.6);
            hand.position.set(0.61, 0.12, 0.08);
            rightArmPivot.add(hand);

            const shoulderHit = new THREE.Mesh(
                new THREE.SphereGeometry(0.22, 14, 14),
                new THREE.MeshBasicMaterial({
                    transparent: true,
                    opacity: 0
                })
            );
            shoulderHit.name = "shoulderHit";
            shoulderHit.position.set(0.48, 0.95, 0.04);
            avatar.add(shoulderHit);
            this.parts.shoulderHit = shoulderHit;

            avatar.position.set(0, -0.02, 1.85);
            avatar.rotation.y = -0.12;

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

            const targets = [this.parts.shoulderHit, this.parts.chairHit].filter(Boolean);
            const hits = this.raycaster.intersectObjects(targets, false);
            if (!hits.length) return;

            const hitName = hits[0].object.name;

            if (hitName === "shoulderHit" && this.state.canReplayGreeting) {
                this.playGreeting();
            }

            if (hitName === "chairHit" && this.state.canReplaySeating) {
                this.playReseat();
            }
        }

        startLoop() {
            const tick = () => {
                this.rafId = requestAnimationFrame(tick);
                const elapsed = this.clock.getElapsedTime();

                if (this.groups.avatar) {
                    this.groups.avatar.position.y = 0.01 * Math.sin(elapsed * 1.7) + 0.02;
                    this.parts.head.rotation.x = 0.03 * Math.sin(elapsed * 1.2);
                    this.parts.torso.rotation.z = 0.015 * Math.sin(elapsed * 1.1);
                }

                if (this.groups.screenGlow) {
                    this.groups.screenGlow.material.opacity = 0.08 + Math.sin(elapsed * 1.8) * 0.02;
                }

                this.renderer.render(this.scene, this.camera);
            };

            tick();
        }

        playIntro() {
            if (this.state.hasPlayedIntro) return;

            this.state.phase = "loading";
            this.state.hasPlayedIntro = true;

            const tl = gsap.timeline({
                delay: this.state.reducedMotion ? 0.4 : 1.0,
                defaults: { ease: "power2.out" }
            });

            tl.to(this.camera.position, {
                z: 7.4,
                duration: 1.2
            });

            tl.to(this.parts.head.rotation, {
                y: 0.45,
                duration: 0.35
            });

            tl.to(this.groups.chair.position, {
                x: -0.12,
                z: 2.15,
                duration: 0.45
            }, "<");

            tl.to(this.groups.avatar.rotation, {
                y: 0.18,
                duration: 0.5
            }, "<");

            tl.to(this.groups.avatar.position, {
                x: 0.42,
                z: 2.08,
                duration: 0.55
            }, "<");

            tl.add(() => this.playGreeting(), "-=0.05");

            tl.add(() => {
                this.state.phase = "standing";
                this.state.canReplayGreeting = true;
                this.state.canReplaySeating = true;
            });

            tl.add(() => {
                setTimeout(() => this.playHandoff(), Math.max(1200, this.options.minDuration - 2200));
            });
        }

        playGreeting() {
            if (this.state.isTransitioning) return;

            this.state.phase = "greeting";
            this.state.canReplayGreeting = false;

            gsap.killTweensOf(this.parts.armPivot.rotation);
            gsap.killTweensOf(this.parts.head.rotation);

            const tl = gsap.timeline({
                defaults: { ease: "power2.out" },
                onComplete: () => {
                    if (!this.state.isTransitioning) {
                        this.state.phase = "standing";
                        this.state.canReplayGreeting = true;
                        this.state.canReplaySeating = true;
                    }
                }
            });

            tl.to(this.parts.head.rotation, {
                y: 0.15,
                x: -0.06,
                duration: 0.2
            });

            tl.to(this.parts.armPivot.rotation, {
                z: -0.95,
                y: 0.12,
                duration: 0.3
            }, "<");

            tl.to(this.parts.armPivot.rotation, {
                z: -0.62,
                duration: 0.18,
                repeat: 2,
                yoyo: true,
                ease: "sine.inOut"
            });

            tl.to(this.parts.armPivot.rotation, {
                z: -0.15,
                y: 0,
                duration: 0.35
            });

            tl.to(this.parts.head.rotation, {
                x: 0,
                y: 0.08,
                duration: 0.25
            }, "<");
        }

        playReseat() {
            if (this.state.isTransitioning) return;

            this.state.phase = "reseating";
            this.state.canReplayGreeting = false;
            this.state.canReplaySeating = false;

            const tl = gsap.timeline({
                defaults: { ease: "power2.inOut" },
                onComplete: () => {
                    if (!this.state.isTransitioning) {
                        this.state.phase = "standing";
                        this.state.canReplayGreeting = true;
                        this.state.canReplaySeating = true;
                    }
                }
            });

            tl.to(this.groups.avatar.position, {
                x: 0.04,
                z: 1.88,
                duration: 0.5
            });

            tl.to(this.groups.avatar.rotation, {
                y: -0.12,
                duration: 0.45
            }, "<");

            tl.to(this.groups.chair.position, {
                x: 0,
                z: 1.85,
                duration: 0.45
            }, "<");

            tl.to(this.parts.head.rotation, {
                y: 0.04,
                x: 0,
                duration: 0.3
            }, "<+0.08");
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

            tl.to(this.groups.screenGlow.material, {
                opacity: 0.42,
                duration: 0.55
            });

            tl.to(this.camera.position, {
                z: 6.8,
                duration: 0.55
            }, "<");

            this.groups.bubbles.forEach((bubble, index) => {
                tl.to(bubble.scale, {
                    x: 2.8,
                    y: 2.8,
                    duration: 0.38
                }, `<+${index * 0.03}`);

                tl.to(bubble.material, {
                    opacity: 0,
                    duration: 0.42
                }, "<");
            });

            tl.to(this.root, {
                opacity: 0,
                duration: 0.75
            }, "-=0.05");
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