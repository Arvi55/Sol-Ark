/**
 * Solar Wind Journey - 3D Metaverse Tour
 * Immersive experience following a solar storm from Sun to Earth
 */

// ============================================================================
// SCENE SETUP & CONFIGURATION
// ============================================================================

class SolarWindJourney {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.currentStageIndex = 0;
        this.isPlaying = false;  // Changed: Start paused for free navigation
        this.stageTimer = 0;
        this.speedMultiplier = 1;
        this.showParticles = true;
        this.showKpMeter = true;
        this.enableNarration = true;
        this.autoPlay = false;  // NEW: Auto-play toggle
        this.totalProgress = 0;
        this.stageData = [];
        this.particleSystem = null;
        this.earthObject = null;
        this.sunObject = null;
        this.particleStream = [];
        this.cameraPath = [];
        this.currentCameraPathIndex = 0;

        // Visual assets (loaded from real textures with fallbacks)
        this.textures = {
            sun: null,
            earthColor: null,
            earthNormal: null,
            earthSpecular: null,
            earthClouds: null,
            mars: null,
            starfield: null
        };

        // Post-processing
        this.composer = null;

        // Interactivity (hover/click)
        this.raycaster = new THREE.Raycaster();
        this.pointer = new THREE.Vector2();
        this.interactables = [];
        this.hoveredRoot = null;
        this.isPointerOverCanvas = false;
        this.hoverTooltip = null;
        this.hoverTitleEl = null;
        this.hoverDescEl = null;

        // Camera controls (user control)
        this.controls = null;
        this.freeCamEnabled = false;
        this.focusTarget = new THREE.Vector3(0, 0, 0);      // THREE.Vector3
        this.focusDistance = 160;     // camera distance from focus target
        this.focusDistanceTarget = 160;

        // Additional space objects (hoverable)
        this.debrisField = null;
        this.magnetosphere = null;
        this.cmeShock = null;

        // Stage panel elements
        this.panelLocationEl = null;
        this.panelPhenomenonEl = null;
        this.panelActionEl = null;
        this.panelVisibleEl = null;
    }

    /**
     * Initialize the 3D scene
     */
    async init() {
        try {
            console.log('🚀 Initializing Solar Wind Journey...');
            
            this.setupScene();
            console.log('✓ Scene setup complete');
            
            this.setupCamera();
            console.log('✓ Camera setup complete');
            
            this.setupRenderer();
            console.log('✓ Renderer setup complete');

            this.setupControls();
            console.log('✓ Controls setup complete');
            
            this.setupLighting();
            console.log('✓ Lighting setup complete');
            
            await this.loadTourData();
            console.log('✓ Tour data loaded');

            await this.loadVisualAssets();
            console.log('✓ Visual assets loaded');

            this.createInitialScene();
            console.log('✓ Scene elements created');

            this.setupPostProcessing();
            console.log('✓ Post-processing setup');
            
            this.setupEventListeners();
            console.log('✓ Event listeners setup');
            
            this.animate();
            console.log('✓ Animation loop started');
            
            this.hideLoadingScreen();
            console.log('✅ Initialization complete!');
            
            // Show welcome message with control hints
            this.showWelcomeMessage();
        } catch (error) {
            console.error('❌ Initialization error:', error);
            // Attempt recovery
            this.setupEventListeners();
            this.animate();
            this.hideLoadingScreen();
        }
    }

    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x050607);
        this.scene.fog = new THREE.Fog(0x050607, 1000, 10000);
    }

    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            10000
        );
        this.camera.position.set(0, 50, 100);
        this.camera.lookAt(0, 0, 0);
    }

    setupRenderer() {
        try {
            const container = document.getElementById('canvas-container');
            if (!container) {
                throw new Error('Canvas container not found in DOM');
            }

            if (!THREE.WebGLRenderer) {
                throw new Error('THREE.js WebGLRenderer not available - THREE.js library may not be loaded');
            }

            this.renderer = new THREE.WebGLRenderer({ 
                antialias: true,
                alpha: true,
                precision: 'highp',
                failIfMajorPerformanceCaveat: false
            });

            if (!this.renderer) {
                throw new Error('Failed to create WebGL renderer');
            }

            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.setPixelRatio(window.devicePixelRatio);
            this.renderer.shadowMap.enabled = true;
            // Use a valid Three.js shadow map type to avoid runtime errors
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

            // Color management (r150+)
            if ('outputColorSpace' in this.renderer && THREE.SRGBColorSpace) {
                this.renderer.outputColorSpace = THREE.SRGBColorSpace;
            } else if ('outputEncoding' in this.renderer && THREE.sRGBEncoding) {
                // Legacy fallback
                this.renderer.outputEncoding = THREE.sRGBEncoding;
            }

            this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
            this.renderer.toneMappingExposure = 1.35;
            
            container.appendChild(this.renderer.domElement);
            
            console.log('✓ WebGL Renderer created successfully');
            console.log('  - Size: ' + window.innerWidth + 'x' + window.innerHeight);
            console.log('  - Device Pixel Ratio: ' + window.devicePixelRatio);
            
            window.addEventListener('resize', () => this.onWindowResize());
        } catch (error) {
            console.error('❌ Renderer setup failed:', error);
            throw error;
        }
    }

    setupControls() {
        if (!this.camera || !this.renderer) return;
        if (!THREE.OrbitControls) {
            console.warn('⚠️ OrbitControls not available (missing THREE.OrbitControls)');
            return;
        }

        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.08;
        this.controls.rotateSpeed = 0.6;
        this.controls.zoomSpeed = 1.8;
        this.controls.panSpeed = 2.6;
        this.controls.minDistance = 0.2;
        this.controls.maxDistance = 2500;
        this.controls.enabled = true; // start in cinematic mode

        this.controls.target.set(0, 0, 0);
        this.controls.update();
    }

    /**
     * Load high-quality real textures (with safe fallbacks if network blocks CDN).
     * These are widely-used public demo textures from the official three.js examples.
     */
    async loadVisualAssets() {
        const loader = new THREE.TextureLoader();
        try {
            if (loader.setCrossOrigin) loader.setCrossOrigin('anonymous');
        } catch (e) {
            // ignore
        }

        const load = (url) => new Promise((resolve, reject) => {
            loader.load(url, resolve, undefined, reject);
        });

        // NOTE: keep URLs stable; if they fail, we fallback to procedural textures.
        const urls = {
            sun: 'https://threejs.org/examples/textures/planets/sun.jpg',
            earthColor: 'https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg',
            earthNormal: 'https://threejs.org/examples/textures/planets/earth_normal_2048.jpg',
            earthSpecular: 'https://threejs.org/examples/textures/planets/earth_specular_2048.jpg',
            earthClouds: 'https://threejs.org/examples/textures/planets/earth_clouds_1024.png',
            mars: 'https://threejs.org/examples/textures/planets/mars_1024.jpg',
            starfield: 'https://threejs.org/examples/textures/planets/starfield.jpg'
        };

        const assignColorSpace = (tex) => {
            if (!tex) return tex;
            // three r152+: colorSpace; older: encoding
            if ('colorSpace' in tex && THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
            if ('encoding' in tex && THREE.sRGBEncoding) tex.encoding = THREE.sRGBEncoding;
            return tex;
        };

        const tasks = Object.entries(urls).map(async ([key, url]) => {
            try {
                const tex = await load(url);
                assignColorSpace(tex);
                tex.anisotropy = this.renderer?.capabilities?.getMaxAnisotropy?.() || 8;
                this.textures[key] = tex;
                return { key, ok: true };
            } catch (e) {
                console.warn(`⚠️ Texture load failed for ${key}. Falling back to procedural assets.`, e?.message || e);
                this.textures[key] = null;
                return { key, ok: false };
            }
        });

        await Promise.all(tasks);
    }

    /**
     * Setup cinematic post-processing (bloom). If postprocessing scripts are missing,
     * we just render normally.
     */
    setupPostProcessing() {
        if (!this.renderer || !this.scene || !this.camera) return;
        if (!THREE.EffectComposer || !THREE.RenderPass || !THREE.UnrealBloomPass) {
            console.warn('⚠️ Post-processing not available (missing THREE.EffectComposer/RenderPass/UnrealBloomPass)');
            return;
        }

        this.composer = new THREE.EffectComposer(this.renderer);
        const renderPass = new THREE.RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);

        const bloomStrength = 1.35;
        const bloomRadius = 0.35;
        const bloomThreshold = 0.12;
        const bloomPass = new THREE.UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            bloomStrength,
            bloomRadius,
            bloomThreshold
        );
        this.composer.addPass(bloomPass);
    }

    setupLighting() {
        // Main light (Sun) - very bright
        const sunLight = new THREE.PointLight(0xfdb913, 3, 2000);
        sunLight.position.set(0, 0, -500);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 4096;
        sunLight.shadow.mapSize.height = 4096;
        this.scene.add(sunLight);
        this.sunLight = sunLight;

        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);

        // Fill light for depth
        const fillLight = new THREE.DirectionalLight(0x8899ff, 0.4);
        fillLight.position.set(200, 200, 200);
        fillLight.castShadow = true;
        this.scene.add(fillLight);

        // Earth glow light (when Earth is visible)
        const earthGlowLight = new THREE.PointLight(0x4488ff, 0.5, 1000);
        earthGlowLight.position.set(0, 0, 900);
        this.scene.add(earthGlowLight);
        this.earthGlowLight = earthGlowLight;

        // Aurora light (activated during aurora stage)
        const auroraLight = new THREE.PointLight(0x00ff99, 0, 500);
        auroraLight.position.set(0, 50, 800);
        this.scene.add(auroraLight);
        this.auroraLight = auroraLight;
    }

    /**
     * Load tour data from backend
     */
    async loadTourData() {
        try {
            console.log('📡 Fetching tour data from API...');
            const response = await fetch('http://localhost:8000/api/metaverse/tour/stages');
            
            if (!response.ok) {
                throw new Error(`API returned status ${response.status}`);
            }
            
            const data = await response.json();
            console.log('✓ API data received:', data);
            
            if (data.stages && data.stages.length > 0) {
                this.stageData = data.stages;
                console.log(`✓ Loaded ${data.stages.length} tour stages`);
            } else {
                throw new Error('No stages in API response');
            }
            
            this.updateUI();
            this.updateStageButtonVisuals();
        } catch (error) {
            console.warn('⚠️ API fetch failed, using default data:', error);
            this.createDefaultTourData();
            this.updateUI();
            this.updateStageButtonVisuals();
        }
    }

    createDefaultTourData() {
        console.log('📋 Creating default tour data...');
        // Fallback data if API fails
        this.stageData = [
            {
                id: "stage_1",
                name: "The Solar Wind Journey Begins",
                description: "Stand on the Sun's surface and witness a Coronal Mass Ejection",
                duration_seconds: 10,
                narration: "Welcome to the Sun's surface. You are about to witness an incredible Coronal Mass Ejection.",
                kp_index: 2,
                particles: { count: 5000, intensity: 0.3 }
            },
            {
                id: "stage_2",
                name: "Plasma Eruption",
                description: "A massive solar flare erupts from the corona",
                duration_seconds: 10,
                narration: "Watch as a massive eruption of plasma is released from the Sun's corona.",
                kp_index: 4,
                particles: { count: 8000, intensity: 0.6 }
            },
            {
                id: "stage_3",
                name: "Journey Through Space",
                description: "Travel with the solar wind through the vacuum of space",
                duration_seconds: 10,
                narration: "Now we travel through the vast expanse of space, following the solar wind.",
                kp_index: 3,
                particles: { count: 6000, intensity: 0.4 }
            },
            {
                id: "stage_4",
                name: "Earth Approaches",
                description: "Our beautiful blue planet comes into view",
                duration_seconds: 10,
                narration: "Earth appears on the horizon. Our destination is near.",
                kp_index: 2,
                particles: { count: 4000, intensity: 0.2 }
            },
            {
                id: "stage_5",
                name: "Aurora Borealis",
                description: "The solar wind interacts with Earth's magnetosphere",
                duration_seconds: 10,
                narration: "The solar wind interacts with Earth's magnetic field, creating the Aurora Borealis.",
                kp_index: 6,
                particles: { count: 7000, intensity: 0.7 }
            },
            {
                id: "stage_6",
                name: "Satellite Network",
                description: "Critical satellites relay data during the storm",
                duration_seconds: 10,
                narration: "Earth's satellites play a critical role in monitoring and managing this solar storm.",
                kp_index: 5,
                particles: { count: 5000, intensity: 0.5 }
            },
            {
                id: "stage_7",
                name: "Global Impact",
                description: "The complete picture of the solar storm's effects",
                duration_seconds: 10,
                narration: "This is the complete picture of how a solar storm affects our planet and technology.",
                kp_index: 7,
                particles: { count: 3000, intensity: 0.3 }
            }
        ];
        console.log('✓ Default data created with 7 stages');
    }

    /**
     * Create initial 3D scene elements
     */
    createInitialScene() {
        try {
            console.log('🎬 Creating scene elements...');
            
            // Create the Sun with enhanced visuals
            console.log('⭐ Creating Sun...');
            this.createSun();
            console.log('✓ Sun created');

            // CME shockfront (early-stage hoverable phenomenon)
            console.log('💥 Creating CME shockfront...');
            this.createCMEShockfront();
            console.log('✓ CME shockfront created');

            // Create particles (solar wind)
            console.log('💨 Creating particle system...');
            this.createParticleSystem();
            console.log('✓ Particle system created');

            // Create starfield background
            console.log('⭐ Creating starfield...');
            this.createStarfield();
            console.log('✓ Starfield created');

            // Debris / micrometeoroids (hoverable field)
            console.log('🪨 Creating debris field...');
            this.createDebrisField();
            console.log('✓ Debris field created');

            // Create Earth
            console.log('🌍 Creating Earth...');
            this.createEarth();
            console.log('✓ Earth created');

            // Magnetosphere bubble (hoverable field around Earth)
            console.log('🧲 Creating magnetosphere shell...');
            this.createMagnetosphere();
            console.log('✓ Magnetosphere created');

            // Add an extra planet (Mars) for scale/realism
            console.log('🔴 Creating Mars...');
            this.createMars();
            console.log('✓ Mars created');

            // Create satellites around Earth
            console.log('🛰️ Creating satellites...');
            this.createSatellites();
            console.log('✓ Satellites created');

            // Create aurora effect
            console.log('✨ Creating aurora...');
            this.createAuroraEffect();
            console.log('✓ Aurora created');

            // Initialize camera path
            console.log('📷 Initializing camera path...');
            this.initializeCameraPath();
            console.log('✓ Camera path initialized');

            // Set initial focus target to Earth if available
            if (this.earthObject) {
                this.focusTarget = this.earthObject.position.clone();
                console.log('📌 Focus target set to Earth');
            }

            // Hook tooltip elements (if present in DOM)
            this.hookupTooltipElements();

            // Initialize stage panel + object visibility
            this.updateStagePanel();
            
            console.log('✅ All scene elements created successfully!');
        } catch (error) {
            console.error('❌ Error creating scene elements:', error);
            console.error('Stack:', error.stack);
            // Continue anyway - some elements may have been created
        }
    }

    hookupTooltipElements() {
        this.hoverTooltip = document.getElementById('hoverTooltip');
        this.hoverTitleEl = document.getElementById('hoverTitle');
        this.hoverDescEl = document.getElementById('hoverDesc');

        this.panelLocationEl = document.getElementById('panelLocation');
        this.panelPhenomenonEl = document.getElementById('panelPhenomenon');
        this.panelActionEl = document.getElementById('panelAction');
        this.panelVisibleEl = document.getElementById('panelVisible');
    }

    registerInteractable(rootObject3D, meta = {}) {
        if (!rootObject3D) return;
        rootObject3D.userData.__solark = {
            name: meta.name || 'Object',
            description: meta.description || '',
            type: meta.type || 'object'
        };
        this.interactables.push(rootObject3D);
    }

    showTooltip(title, desc) {
        if (!this.hoverTooltip) return;
        if (this.hoverTitleEl) this.hoverTitleEl.textContent = title || 'OBJECT';
        if (this.hoverDescEl) this.hoverDescEl.textContent = desc || '';
        this.hoverTooltip.classList.add('visible');
    }

    hideTooltip() {
        if (!this.hoverTooltip) return;
        this.hoverTooltip.classList.remove('visible');
        this.hoverTooltip.style.transform = 'translate(-9999px, -9999px)';
    }

    updateTooltipPosition(clientX, clientY) {
        if (!this.hoverTooltip) return;
        const pad = 14;
        const x = Math.min(window.innerWidth - 20, clientX + pad);
        const y = Math.min(window.innerHeight - 20, clientY + pad);
        this.hoverTooltip.style.transform = `translate(${x}px, ${y}px)`;
    }

    applyHoverStyle(root, isHovered) {
        if (!root) return;
        try {
            root.traverse((obj) => {
                if (!obj.isMesh) return;
                const mat = obj.material;
                if (!mat) return;

                if (!obj.userData.__hoverBackup) {
                    obj.userData.__hoverBackup = {
                        emissive: mat.emissive ? mat.emissive.clone() : null,
                        emissiveIntensity: typeof mat.emissiveIntensity === 'number' ? mat.emissiveIntensity : null
                    };
                }

                if (isHovered) {
                    if (mat.emissive) mat.emissive.setHex(0xf97316);
                    if (typeof mat.emissiveIntensity === 'number') mat.emissiveIntensity = Math.min(2.5, (mat.emissiveIntensity || 0) + 0.9);
                } else {
                    const b = obj.userData.__hoverBackup;
                    if (b?.emissive && mat.emissive) mat.emissive.copy(b.emissive);
                    if (typeof b?.emissiveIntensity === 'number' && typeof mat.emissiveIntensity === 'number') mat.emissiveIntensity = b.emissiveIntensity;
                }
            });

            root.scale.setScalar(isHovered ? 1.02 : 1.0);
        } catch (e) {
            // ignore
        }
    }

    setHoveredRoot(root) {
        if (this.hoveredRoot === root) return;

        if (this.hoveredRoot) {
            this.applyHoverStyle(this.hoveredRoot, false);
        }

        this.hoveredRoot = root;

        if (!root) {
            this.hideTooltip();
            return;
        }

        const meta = root.userData.__solark || { name: 'Object', description: '' };
        this.applyHoverStyle(root, true);
        this.showTooltip(meta.name, meta.description);
    }

    updateHoverFromPointer(clientX, clientY) {
        if (!this.renderer || !this.camera) return;
        const rect = this.renderer.domElement.getBoundingClientRect();
        const inside = clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
        this.isPointerOverCanvas = inside;

        if (!inside) {
            this.setHoveredRoot(null);
            return;
        }

        this.pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        this.pointer.y = -(((clientY - rect.top) / rect.height) * 2 - 1);

        this.raycaster.setFromCamera(this.pointer, this.camera);
        const hits = this.raycaster.intersectObjects(this.interactables, true);

        if (!hits.length) {
            this.setHoveredRoot(null);
            return;
        }

        let root = hits[0].object;
        while (root && root.parent) {
            if (root.userData && root.userData.__solark) break;
            root = root.parent;
        }

        if (root?.userData?.__solark) {
            this.setHoveredRoot(root);
            this.updateTooltipPosition(clientX, clientY);
        } else {
            this.setHoveredRoot(null);
        }
    }

    focusOnObject(root) {
        if (!root) return;
        const pos = new THREE.Vector3();
        root.getWorldPosition(pos);
        
        // Smooth transition to new focus target
        this.focusTarget = pos;
        this.focusTransitionDuration = 1.5; // seconds
        this.focusTransitionStart = Date.now();
        this.focusTransitionStartPos = this.camera.position.clone();
        this.focusTransitionStartTarget = this.controls ? this.controls.target.clone() : new THREE.Vector3();

        if (this.controls) {
            this.controls.target.copy(pos);
        }

        const box = new THREE.Box3().setFromObject(root);
        const sphere = new THREE.Sphere();
        box.getBoundingSphere(sphere);
        const radius = Math.max(10, sphere.radius || 10);
        const targetDistance = Math.min(900, Math.max(140, radius * 6));
        
        // Store target distance for smooth transition
        this.focusDistanceTarget = targetDistance;
        this.focusDistance = targetDistance;
        
        console.log(`📍 Focusing on: ${root.userData?.name || 'Object'} at distance ${targetDistance.toFixed(0)} units`);
    }

    /**
     * Update camera position with smooth transitions
     */
    updateCameraPosition() {
        if (!this.focusTarget || !this.camera) return;

        // Smooth interpolation of zoom distance
        if (this.focusDistanceTarget && Math.abs(this.focusDistance - this.focusDistanceTarget) > 0.5) {
            this.focusDistance += (this.focusDistanceTarget - this.focusDistance) * 0.15; // 15% per frame for smooth zoom
        }

        // Check if we're in a transition
        if (this.focusTransitionStart) {
            const elapsed = (Date.now() - this.focusTransitionStart) / 1000;
            const progress = Math.min(1, elapsed / this.focusTransitionDuration);
            
            // Easing function for smooth transition (easeInOutCubic)
            const easeProgress = progress < 0.5 
                ? 4 * progress * progress * progress 
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;

            // Smooth interpolation of camera position
            const startPos = this.focusTransitionStartPos;
            const endDir = new THREE.Vector3().subVectors(this.focusTarget, this.camera.position).normalize();
            
            // Calculate target camera position
            const targetPos = new THREE.Vector3().copy(this.focusTarget);
            targetPos.addScaledVector(endDir, -this.focusDistance);
            
            // Interpolate camera position
            this.camera.position.lerpVectors(startPos, targetPos, easeProgress);
            
            // If transition is complete, clean up
            if (progress >= 1) {
                this.focusTransitionStart = null;
                this.camera.position.copy(this.focusTarget);
                this.camera.position.addScaledVector(endDir, -this.focusDistance);
            }
        } else if (!this.freeCamEnabled) {
            // In cinematic mode without transition, use current focus
            const direction = new THREE.Vector3().subVectors(this.focusTarget, this.camera.position).normalize();
            const targetPos = new THREE.Vector3().copy(this.focusTarget);
            targetPos.addScaledVector(direction, -this.focusDistance);
            
            // Smooth lerp to target position
            this.camera.position.lerp(targetPos, 0.05);
        }

        this.camera.lookAt(this.focusTarget || new THREE.Vector3(0, 0, 0));
    }

    /**
     * Create Aurora Borealis effect
     */
    createAuroraEffect() {
        const auroraGeometry = new THREE.BufferGeometry();

        // Create multiple aurora ribbons
        const ribbonCount = 3;
        const positions = [];
        const colors = [];

        for (let r = 0; r < ribbonCount; r++) {
            const ribbonPoints = 100;
            const offset = (r / ribbonCount) * Math.PI * 2;

            for (let i = 0; i < ribbonPoints; i++) {
                const progress = i / ribbonPoints;
                const angle = offset + progress * Math.PI * 4;

                // Create wavy ribbon shape
                const x = 35 * Math.cos(angle);
                const y = 30 * Math.sin(angle) + (Math.sin(progress * Math.PI * 2) * 5);
                const z = (progress - 0.5) * 60;

                positions.push(x, y, z);

                // Color gradient: green to purple
                if (progress < 0.3) {
                    colors.push(0, 1, 0.5); // Cyan-green
                } else if (progress < 0.6) {
                    colors.push(0.5, 1, 0.5); // Green
                } else if (progress < 0.8) {
                    colors.push(1, 0.5, 1); // Magenta
                } else {
                    colors.push(1, 0.2, 0.8); // Purple
                }
            }
        }

        auroraGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
        auroraGeometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3));

        const auroraMaterial = new THREE.LineBasicMaterial({
            vertexColors: true,
            linewidth: 3,
            transparent: true,
            opacity: 0.0 // Start invisible, show during aurora stage
        });

        this.aurora = new THREE.LineSegments(auroraGeometry, auroraMaterial);
        this.aurora.position.z = 800;
        this.scene.add(this.aurora);
    }

    /**
     * Hoverable CME shockfront (early stages)
     */
    createCMEShockfront() {
        const geo = new THREE.TorusGeometry(85, 3.2, 16, 120);
        const mat = new THREE.MeshBasicMaterial({
            color: 0xffb000,
            transparent: true,
            opacity: 0.35,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            toneMapped: false
        });
        const ring = new THREE.Mesh(geo, mat);
        ring.rotation.x = Math.PI * 0.5;
        ring.position.set(0, 0, 0);
        ring.visible = true;
        this.scene.add(ring);
        this.cmeShock = ring;
        this.registerInteractable(ring, {
            name: 'CME Shockfront',
            description: 'An expanding shockwave of plasma + magnetic field pushing into space.',
            type: 'phenomenon'
        });
    }

    /**
     * Hoverable debris / micrometeoroids field (stage: travel through space)
     */
    createDebrisField() {
        const count = 1200;
        const geo = new THREE.IcosahedronGeometry(0.9, 0);
        const mat = new THREE.MeshStandardMaterial({
            color: 0x8c8c8c,
            roughness: 0.95,
            metalness: 0.05
        });
        const inst = new THREE.InstancedMesh(geo, mat, count);
        inst.frustumCulled = false;

        const dummy = new THREE.Object3D();
        const spread = { x: 520, y: 220, z: 560 };
        const center = { x: 0, y: 0, z: 360 };

        for (let i = 0; i < count; i++) {
            dummy.position.set(
                center.x + (Math.random() - 0.5) * spread.x,
                center.y + (Math.random() - 0.5) * spread.y,
                center.z + (Math.random() - 0.5) * spread.z
            );
            const s = Math.random() * 2.2 + 0.25;
            dummy.scale.setScalar(s);
            dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
            dummy.updateMatrix();
            inst.setMatrixAt(i, dummy.matrix);
        }
        inst.instanceMatrix.needsUpdate = true;

        inst.visible = false;
        this.scene.add(inst);
        this.debrisField = inst;
        this.registerInteractable(inst, {
            name: 'Debris / Micrometeoroids',
            description: 'A simulated debris field. Even tiny particles can threaten spacecraft at orbital speeds.',
            type: 'debris'
        });
    }

    /**
     * Hoverable magnetosphere bubble (stage: Earth approach and beyond)
     */
    createMagnetosphere() {
        if (!this.earthObject) return;
        const geo = new THREE.SphereGeometry(78, 96, 96);
        const mat = new THREE.MeshBasicMaterial({
            color: 0x00b3ff,
            transparent: true,
            opacity: 0.08,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            toneMapped: false
        });
        const shell = new THREE.Mesh(geo, mat);
        shell.position.copy(this.earthObject.position);
        shell.visible = false;
        this.scene.add(shell);
        this.magnetosphere = shell;
        this.registerInteractable(shell, {
            name: 'Earth Magnetosphere',
            description: 'Earth’s magnetic shield—deflects solar wind and compresses during storms.',
            type: 'field'
        });
    }

    createSun() {
        const geometry = new THREE.SphereGeometry(55, 128, 128);

        // Prefer real texture; fallback to procedural canvas if offline
        const sunMap = this.textures.sun || new THREE.CanvasTexture(this.createSunTexture());
        if ('colorSpace' in sunMap && THREE.SRGBColorSpace) sunMap.colorSpace = THREE.SRGBColorSpace;
        if ('encoding' in sunMap && THREE.sRGBEncoding) sunMap.encoding = THREE.sRGBEncoding;

        // Sun should look emissive (self-lit), so we avoid PBR shading here
        const material = new THREE.MeshBasicMaterial({
            map: sunMap,
            toneMapped: false
        });

        this.sunObject = new THREE.Mesh(geometry, material);
        this.sunObject.castShadow = true;
        this.sunObject.receiveShadow = true;
        this.registerInteractable(this.sunObject, {
            name: 'Sun (Photosphere)',
            description: 'Hover to inspect. Click to focus.',
            type: 'star'
        });

        // Add corona glow layers (additive, for "insane" cinematic glow + bloom)
        const coronaGeometry = new THREE.SphereGeometry(75, 64, 64);
        const coronaMaterial = new THREE.MeshBasicMaterial({
            color: 0xff8800,
            transparent: true,
            opacity: 0.18,
            side: THREE.BackSide
        });
        const corona = new THREE.Mesh(coronaGeometry, coronaMaterial);
        this.sunObject.add(corona);

        // Add outer glow
        const glowGeometry = new THREE.SphereGeometry(95, 64, 64);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xffaa00,
            transparent: true,
            opacity: 0.10,
            side: THREE.BackSide
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        this.sunObject.add(glow);

        // Add sun flare effect
        this.createSolarFlares();

        this.scene.add(this.sunObject);
    }

    /**
     * Create realistic sun texture with sunspots and granulation
     */
    createSunTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');

        // Base solar color gradient
        const gradient = ctx.createRadialGradient(512, 512, 0, 512, 512, 512);
        gradient.addColorStop(0, '#ffff99');      // Core
        gradient.addColorStop(0.5, '#ffcc00');    // Mid
        gradient.addColorStop(0.9, '#ff8800');    // Edge
        gradient.addColorStop(1, '#ff6600');      // Outer

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1024, 1024);

        // Add sunspots (darker regions)
        ctx.fillStyle = 'rgba(180, 100, 0, 0.4)';
        for (let i = 0; i < 8; i++) {
            const x = Math.random() * 1024;
            const y = Math.random() * 1024;
            const radius = Math.random() * 80 + 40;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }

        // Add granulation texture (surface details)
        const imageData = ctx.getImageData(0, 0, 1024, 1024);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            const noise = Math.random() * 20;
            data[i] += noise;     // Red
            data[i + 1] += noise; // Green
            data[i + 2] -= noise; // Blue
        }

        ctx.putImageData(imageData, 0, 0);

        return canvas;
    }

    /**
     * Create solar flare effects
     */
    createSolarFlares() {
        const flareGeometry = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];

        // Create multiple flare points
        for (let i = 0; i < 20; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;

            const x = 55 * Math.sin(phi) * Math.cos(theta);
            const y = 55 * Math.sin(phi) * Math.sin(theta);
            const z = 55 * Math.cos(phi);

            positions.push(x, y, z);

            // Flare colors: yellow to orange to red
            const hue = Math.random();
            if (hue < 0.5) {
                colors.push(1, 1, 0); // Yellow
            } else if (hue < 0.8) {
                colors.push(1, 0.5, 0); // Orange
            } else {
                colors.push(1, 0.2, 0); // Red
            }
        }

        flareGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
        flareGeometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3));

        const flareMaterial = new THREE.PointsMaterial({
            size: 5,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            sizeAttenuation: true
        });

        const flares = new THREE.Points(flareGeometry, flareMaterial);
        this.sunObject.add(flares);
        this.solarFlares = flares;
    }

    createParticleSystem() {
        // Render "particles" as real 3D objects via instancing (more realistic than point sprites)
        // NOTE: Count is adaptive to device pixel ratio for performance.
        const dpr = window.devicePixelRatio || 1;
        const particleCount = dpr >= 2 ? 4500 : 6500;

        const geometry = new THREE.IcosahedronGeometry(0.45, 0);
        const material = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: 0xffa24a,
            emissiveIntensity: 1.2,
            roughness: 0.35,
            metalness: 0.0,
            transparent: true,
            opacity: 0.9,
            depthWrite: false
        });
        material.vertexColors = true;
        material.blending = THREE.AdditiveBlending;

        const instanced = new THREE.InstancedMesh(geometry, material, particleCount);
        instanced.frustumCulled = false;

        // Buffers for simulation
        this.particlePositions = new Float32Array(particleCount * 3);
        this.particleVelocities = new Float32Array(particleCount * 3);
        this.particleSizes = new Float32Array(particleCount);

        const dummy = new THREE.Object3D();
        const color = new THREE.Color();

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;

            // Cluster around the Sun initially
            const angle = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            const radius = 62 + Math.random() * 55;

            this.particlePositions[i3] = radius * Math.sin(phi) * Math.cos(angle);
            this.particlePositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(angle);
            this.particlePositions[i3 + 2] = radius * Math.cos(phi);

            // Velocities pointing toward Earth (mostly +Z)
            this.particleVelocities[i3] = (Math.random() - 0.5) * 1.8;
            this.particleVelocities[i3 + 1] = (Math.random() - 0.5) * 1.8;
            this.particleVelocities[i3 + 2] = Math.random() * 3.4 + 1.2;

            // Size variation
            const s = (Math.random() * 0.9 + 0.35) * (dpr >= 2 ? 0.9 : 1.0);
            this.particleSizes[i] = s;

            // Color variation (orange/yellow/white-hot)
            const t = Math.random();
            if (t < 0.45) color.setRGB(1.0, 0.55, 0.15);
            else if (t < 0.8) color.setRGB(1.0, 0.9, 0.3);
            else color.setRGB(1.0, 1.0, 0.85);

            dummy.position.set(
                this.particlePositions[i3],
                this.particlePositions[i3 + 1],
                this.particlePositions[i3 + 2]
            );
            dummy.scale.setScalar(s);
            dummy.updateMatrix();
            instanced.setMatrixAt(i, dummy.matrix);
            instanced.setColorAt(i, color);
        }

        instanced.instanceMatrix.needsUpdate = true;
        if (instanced.instanceColor) instanced.instanceColor.needsUpdate = true;

        this.particleSystem = instanced;
        this.scene.add(this.particleSystem);
    }

    /**
     * Create particle texture (soft glowing circle)
     */
    createParticleTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = 'rgba(0, 0, 0, 0)';
        ctx.fillRect(0, 0, 64, 64);

        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.5, 'rgba(255, 200, 100, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(32, 32, 32, 0, Math.PI * 2);
        ctx.fill();

        return new THREE.CanvasTexture(canvas);
    }

    createStarfield() {
        // Prefer a real starfield texture on a giant inverted sphere (more "real" than point sprites)
        if (this.textures.starfield) {
            const skyGeo = new THREE.SphereGeometry(6000, 64, 64);
            const skyMat = new THREE.MeshBasicMaterial({
                map: this.textures.starfield,
                side: THREE.BackSide,
                transparent: false
            });
            const sky = new THREE.Mesh(skyGeo, skyMat);
            sky.renderOrder = -10;
            this.scene.add(sky);

            // Still add a subtle point-star layer for depth sparkle
        }

        const starsGeometry = new THREE.BufferGeometry();
        const starCount = 2500;

        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);
        const sizes = new Float32Array(starCount);

        // Star color palette
        const starColors = [
            { r: 1, g: 1, b: 1 },       // White
            { r: 1, g: 0.9, b: 0.8 },   // Warm white
            { r: 0.9, g: 0.95, b: 1 },  // Cool white
            { r: 1, g: 0.8, b: 0.6 },   // Orange
            { r: 0.8, g: 0.9, b: 1 }    // Blue
        ];

        for (let i = 0; i < starCount * 3; i += 3) {
            const idx = i / 3;
            
            // Distribute stars in sphere
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            const radius = 4000 + Math.random() * 1000;

            positions[i] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i + 2] = radius * Math.cos(phi);

            // Star colors
            const color = starColors[Math.floor(Math.random() * starColors.length)];
            colors[i] = color.r;
            colors[i + 1] = color.g;
            colors[i + 2] = color.b;

            // Variable star sizes
            sizes[idx] = Math.random() * 3 + 0.5;
        }

        starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        starsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        starsGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const starsMaterial = new THREE.PointsMaterial({
            size: 1.6,
            sizeAttenuation: true,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            sizeRange: [0.5, 3]
        });

        const stars = new THREE.Points(starsGeometry, starsMaterial);
        this.scene.add(stars);

        // Add nebula clouds
        this.createNebulaClouds();
    }

    /**
     * Create nebula cloud effects
     */
    createNebulaClouds() {
        const nebulaParts = 5;

        for (let i = 0; i < nebulaParts; i++) {
            const geometry = new THREE.IcosahedronGeometry(Math.random() * 500 + 300, 8);
            
            const nebulaMaterial = new THREE.MeshBasicMaterial({
                color: new THREE.Color().setHSL(Math.random(), 0.6, 0.3),
                transparent: true,
                opacity: Math.random() * 0.15 + 0.05
            });

            const nebula = new THREE.Mesh(geometry, nebulaMaterial);

            // Random position in space
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            const distance = 3000 + Math.random() * 1500;

            nebula.position.x = distance * Math.sin(phi) * Math.cos(theta);
            nebula.position.y = distance * Math.sin(phi) * Math.sin(theta);
            nebula.position.z = distance * Math.cos(phi);

            this.scene.add(nebula);
        }
    }

    /**
     * Create Earth as the destination
     */
    createEarth() {
        const geometry = new THREE.SphereGeometry(32, 128, 128);

        const earthColor = this.textures.earthColor || new THREE.CanvasTexture(this.createEarthTexture());
        const earthNormal = this.textures.earthNormal || new THREE.CanvasTexture(this.createEarthNormalMap());
        const earthSpec = this.textures.earthSpecular || null;

        // Mark color textures as sRGB where supported
        if ('colorSpace' in earthColor && THREE.SRGBColorSpace) earthColor.colorSpace = THREE.SRGBColorSpace;
        if ('encoding' in earthColor && THREE.sRGBEncoding) earthColor.encoding = THREE.sRGBEncoding;

        const material = new THREE.MeshStandardMaterial({
            map: earthColor,
            normalMap: earthNormal,
            metalness: 0.0,
            roughness: 0.85,
            emissive: 0x000000,
            emissiveIntensity: 0.0
        });

        // Specular highlight (legacy style): approximate with metalness/roughness tweaks if spec map exists
        if (earthSpec) {
            material.roughness = 0.75;
            // Store spec map; we use it as an env-like roughness mask via lightMap slot fallback
            // (kept simple to avoid custom PBR shader work)
            material.lightMap = earthSpec;
            material.lightMapIntensity = 0.15;
        }

        this.earthObject = new THREE.Mesh(geometry, material);
        this.earthObject.castShadow = true;
        this.earthObject.receiveShadow = true;
        this.earthObject.position.z = 800;
        this.registerInteractable(this.earthObject, {
            name: 'Earth',
            description: 'High-res Earth textures + atmospheric glow. Hover/click to explore.',
            type: 'planet'
        });

        // Add cloud layer
        this.createCloudLayer(this.earthObject);

        // Add physically-inspired atmosphere (Fresnel glow shader)
        this.createAtmosphere(this.earthObject);

        // Add night lights (city lights)
        this.createNightLights(this.earthObject);

        this.scene.add(this.earthObject);
    }

    /**
     * Add a cinematic atmosphere glow using a simple Fresnel shader.
     */
    createAtmosphere(parent) {
        const atmosphereGeometry = new THREE.SphereGeometry(34, 128, 128);
        const atmosphereMaterial = new THREE.ShaderMaterial({
            transparent: true,
            depthWrite: false,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            uniforms: {
                uColor: { value: new THREE.Color(0x4aa3ff) },
                uPower: { value: 3.0 },
                uIntensity: { value: 1.15 }
            },
            vertexShader: `
                varying vec3 vNormal;
                varying vec3 vWorldPosition;
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    vec4 worldPos = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPos.xyz;
                    gl_Position = projectionMatrix * viewMatrix * worldPos;
                }
            `,
            fragmentShader: `
                uniform vec3 uColor;
                uniform float uPower;
                uniform float uIntensity;
                varying vec3 vNormal;
                varying vec3 vWorldPosition;
                void main() {
                    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
                    float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), uPower);
                    float alpha = fresnel * uIntensity;
                    gl_FragColor = vec4(uColor, alpha);
                }
            `
        });

        const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        atmosphere.position.copy(parent.position);
        this.scene.add(atmosphere);
        this.earthAtmosphere = atmosphere;
    }

    /**
     * Create detailed Earth texture with realistic continents and oceans
     */
    createEarthTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 2048;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');

        // Deep ocean blue base
        ctx.fillStyle = '#1a3a52';
        ctx.fillRect(0, 0, 2048, 1024);

        // Add continents using improved map
        const continents = [
            // North America
            { x: 200, y: 250, w: 180, h: 150, color: '#2d7f2d' },
            // South America
            { x: 250, y: 400, w: 100, h: 120, color: '#3a9d3a' },
            // Europe/Africa
            { x: 800, y: 300, w: 220, h: 250, color: '#2d7f2d' },
            // Asia
            { x: 1100, y: 200, w: 350, h: 220, color: '#3a9d3a' },
            // Australia
            { x: 1350, y: 450, w: 80, h: 100, color: '#2d7f2d' },
            // Antarctica
            { x: 0, y: 800, w: 2048, h: 224, color: '#cccccc' },
            // Greenland
            { x: 600, y: 100, w: 60, h: 80, color: '#2d7f2d' }
        ];

        continents.forEach(cont => {
            ctx.fillStyle = cont.color;
            ctx.fillRect(cont.x, cont.y, cont.w, cont.h);

            // Add roughness to coastlines
            for (let i = 0; i < cont.w * cont.h / 500; i++) {
                const rx = cont.x + Math.random() * cont.w;
                const ry = cont.y + Math.random() * cont.h;
                const rw = Math.random() * 20 + 5;
                const rh = Math.random() * 20 + 5;
                ctx.fillStyle = `rgba(45, 127, 45, ${Math.random() * 0.5})`;
                ctx.fillRect(rx, ry, rw, rh);
            }
        });

        // Add cloud-like formations (weather systems)
        ctx.fillStyle = 'rgba(200, 200, 200, 0.2)';
        for (let i = 0; i < 5; i++) {
            const cx = Math.random() * 2048;
            const cy = Math.random() * 1024;
            ctx.beginPath();
            ctx.arc(cx, cy, Math.random() * 100 + 50, 0, Math.PI * 2);
            ctx.fill();
        }

        return new THREE.CanvasTexture(canvas);
    }

    /**
     * Create normal map for Earth surface detail
     */
    createEarthNormalMap() {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Base normal map (blue/gray)
        ctx.fillStyle = '#8080ff';
        ctx.fillRect(0, 0, 1024, 512);

        // Add surface details with noise
        const imageData = ctx.getImageData(0, 0, 1024, 512);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            const noise = (Math.random() - 0.5) * 30;
            data[i] = Math.max(0, Math.min(255, 128 + noise)); // Red (X)
            data[i + 1] = Math.max(0, Math.min(255, 128 + noise)); // Green (Y)
            data[i + 2] = 255; // Blue (Z)
            data[i + 3] = 255; // Alpha
        }

        ctx.putImageData(imageData, 0, 0);
        return new THREE.CanvasTexture(canvas);
    }

    /**
     * Create cloud layer animation
     */
    createCloudLayer(parent) {
        const cloudTexture = this.textures.earthClouds || new THREE.CanvasTexture(this.createCloudTexture());
        cloudTexture.wrapS = THREE.RepeatWrapping;
        cloudTexture.wrapT = THREE.RepeatWrapping;
        if ('colorSpace' in cloudTexture && THREE.SRGBColorSpace) cloudTexture.colorSpace = THREE.SRGBColorSpace;
        if ('encoding' in cloudTexture && THREE.sRGBEncoding) cloudTexture.encoding = THREE.sRGBEncoding;

        const cloudGeometry = new THREE.SphereGeometry(33, 128, 128);
        const cloudMaterial = new THREE.MeshBasicMaterial({
            map: cloudTexture,
            transparent: true,
            opacity: 0.35,
            side: THREE.FrontSide
        });

        const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
        clouds.scale.set(1.01, 1.01, 1.01); // Slightly larger to avoid clipping
        parent.add(clouds);
        this.cloudLayer = clouds;
    }

    /**
     * Add Mars as a mid-journey "wow" object for realism/scale.
     */
    createMars() {
        const marsTex = this.textures.mars;
        const geometry = new THREE.SphereGeometry(18, 96, 96);
        const material = new THREE.MeshStandardMaterial({
            map: marsTex || null,
            color: marsTex ? 0xffffff : 0xb24b2d,
            metalness: 0.0,
            roughness: 0.95
        });
        if (marsTex) {
            if ('colorSpace' in marsTex && THREE.SRGBColorSpace) marsTex.colorSpace = THREE.SRGBColorSpace;
            if ('encoding' in marsTex && THREE.sRGBEncoding) marsTex.encoding = THREE.sRGBEncoding;
        }

        const mars = new THREE.Mesh(geometry, material);
        mars.position.set(-220, 40, 420);
        mars.rotation.y = 0.6;
        mars.castShadow = true;
        mars.receiveShadow = true;
        this.scene.add(mars);
        this.marsObject = mars;
        this.registerInteractable(this.marsObject, {
            name: 'Mars',
            description: 'Hover to inspect. Click to focus.',
            type: 'planet'
        });

        // Soft rim glow
        const glowGeo = new THREE.SphereGeometry(20, 64, 64);
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0xff6a2a,
            transparent: true,
            opacity: 0.08,
            side: THREE.BackSide
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        glow.position.copy(mars.position);
        this.scene.add(glow);
    }

    /**
     * Create procedural cloud texture
     */
    createCloudTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Transparent background
        ctx.fillStyle = 'rgba(0, 0, 0, 0)';
        ctx.fillRect(0, 0, 1024, 512);

        // Create Perlin-like cloud patterns
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        for (let i = 0; i < 30; i++) {
            const x = Math.random() * 1024;
            const y = Math.random() * 512;
            const size = Math.random() * 150 + 50;

            const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
            gradient.addColorStop(0.5, 'rgba(200, 200, 200, 0.4)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }

        return canvas;
    }

    /**
     * Create city night lights
     */
    createNightLights(parent) {
        const lightsCanvas = document.createElement('canvas');
        lightsCanvas.width = 1024;
        lightsCanvas.height = 512;
        const ctx = lightsCanvas.getContext('2d');

        ctx.fillStyle = 'rgba(0, 0, 0, 0)';
        ctx.fillRect(0, 0, 1024, 512);

        // Add city lights (major cities and regions)
        ctx.fillStyle = '#ffff99';
        ctx.globalAlpha = 0.6;

        const cities = [
            { x: 100, y: 200, r: 15 }, // NYC area
            { x: 150, y: 280, r: 12 }, // Mexico City
            { x: 200, y: 320, r: 10 }, // Rio
            { x: 450, y: 200, r: 18 }, // Europe
            { x: 500, y: 180, r: 12 }, // Moscow area
            { x: 600, y: 150, r: 20 }, // Middle East
            { x: 750, y: 180, r: 22 }, // India
            { x: 850, y: 120, r: 25 }, // China
            { x: 920, y: 140, r: 18 }, // Japan
            { x: 700, y: 350, r: 15 }  // Australia
        ];

        cities.forEach(city => {
            ctx.beginPath();
            ctx.arc(city.x, city.y, city.r, 0, Math.PI * 2);
            ctx.fill();
            
            // Add glow
            ctx.fillStyle = 'rgba(255, 200, 100, 0.3)';
            ctx.beginPath();
            ctx.arc(city.x, city.y, city.r * 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffff99';
        });

        const lightsTexture = new THREE.CanvasTexture(lightsCanvas);
        const lightsGeometry = new THREE.IcosahedronGeometry(30.5, 32);
        const lightsMaterial = new THREE.MeshBasicMaterial({
            map: lightsTexture,
            transparent: true,
            emissive: 0xffff99,
            emissiveMap: lightsTexture,
            emissiveIntensity: 0.8
        });

        const lights = new THREE.Mesh(lightsGeometry, lightsMaterial);
        parent.add(lights);
        this.cityLights = lights;
    }

    /**
     * Initialize camera path for smooth movement
     */
    initializeCameraPath() {
        this.cameraPath = [
            { position: { x: 0, y: 50, z: 150 }, target: { x: 0, y: 0, z: 0 } },
            { position: { x: 100, y: 100, z: 200 }, target: { x: 0, y: 0, z: 0 } },
            { position: { x: 200, y: 50, z: 300 }, target: { x: 0, y: 0, z: 100 } },
            { position: { x: 100, y: 150, z: 400 }, target: { x: 0, y: 0, z: 300 } },
            { position: { x: 0, y: 0, z: 600 }, target: { x: 0, y: 0, z: 800 } }
        ];
    }

    /**
     * Update UI elements
     */
    updateUI() {
        try {
            if (this.stageData.length > 0) {
                const stage = this.stageData[this.currentStageIndex];
                
                const updateElement = (id, text) => {
                    const el = document.getElementById(id);
                    if (el) {
                        el.textContent = text;
                    }
                };

                updateElement('stageName', stage.name);
                updateElement('stageDescription', stage.description);
                updateElement('narrationText', stage.narration);
            }
        } catch (error) {
            console.warn('Error updating UI:', error);
        }
    }

    updateStagePanel() {
        // Update right-side panel + stage-driven object visibility
        const stage = this.stageData?.[this.currentStageIndex];
        const stageName = stage?.name || '';
        const stageDesc = stage?.description || '';

        // Simple mapping by stage index (0-based)
        const idx = this.currentStageIndex;

        const configs = [
            {
                location: 'Sun • Corona',
                phenomenon: 'Magnetic reconnection & early CME formation',
                visible: 'Sun • CME shockfront • Solar wind particles'
            },
            {
                location: 'Sun • CME Launch',
                phenomenon: 'Coronal Mass Ejection (shockwave + plasma eruption)',
                visible: 'Sun • CME shockfront • Solar wind particles'
            },
            {
                location: 'Interplanetary Space',
                phenomenon: 'Solar wind propagation through the heliosphere',
                visible: 'Solar wind particles • Debris field • Mars (scale)'
            },
            {
                location: 'Near-Earth Space',
                phenomenon: 'Magnetosphere compression & bow shock',
                visible: 'Earth • Magnetosphere shell • Satellites'
            },
            {
                location: 'Earth • Poles',
                phenomenon: 'Aurora formation (particle precipitation)',
                visible: 'Earth • Aurora • Magnetosphere • Satellites'
            },
            {
                location: 'Earth Orbit',
                phenomenon: 'Satellite impacts (charging / GPS degradation)',
                visible: 'Satellites • Magnetosphere • Particle stream'
            },
            {
                location: 'Earth System',
                phenomenon: 'Solar-terrestrial connection overview',
                visible: 'Earth • Magnetosphere • Satellites • Particle stream'
            }
        ];

        const c = configs[idx] || configs[configs.length - 1];

        if (this.panelLocationEl) this.panelLocationEl.textContent = c.location;
        if (this.panelPhenomenonEl) this.panelPhenomenonEl.textContent = c.phenomenon;
        if (this.panelActionEl) this.panelActionEl.textContent = `Hover objects • Click to focus • Free Cam to explore • Stage: ${stageName || '—'}`;
        if (this.panelVisibleEl) this.panelVisibleEl.textContent = c.visible;

        // Stage-driven visibility toggles
        if (this.cmeShock) {
            this.cmeShock.visible = idx <= 1;
        }
        if (this.debrisField) {
            this.debrisField.visible = idx === 2;
        }
        if (this.magnetosphere) {
            this.magnetosphere.visible = idx >= 3;
            if (this.earthObject) this.magnetosphere.position.copy(this.earthObject.position);
        }

        // Keep tooltip content “fresh” (if stage has a description)
        if (this.hoveredRoot?.userData?.__solark && this.hoverDescEl && stageDesc) {
            // Don’t override object-specific text if user is actively hovering something
        }
    }

    /**
     * Setup event listeners for controls
     */
    setupEventListeners() {
        const addListener = (id, callback) => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.feedbackButton(el);
                    callback();
                });
            } else {
                console.warn(`UI element not found: ${id}`);
            }
        };

        addListener('speedNormal', () => this.setSpeed('normal'));
        addListener('speedFast', () => this.setSpeed('fast'));
        addListener('showParticles', () => this.toggleParticles());
        addListener('showKpMeter', () => this.toggleKpMeter());
        addListener('toggleNarration', () => this.toggleNarration());
        addListener('toggleFreeCam', () => this.toggleFreeCam());
        addListener('toggleAutoPlay', () => this.toggleAutoPlay());
        addListener('exitButton', () => this.exitTour());

        // Stage navigation buttons
        document.querySelectorAll('.stage-button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const stageIndex = parseInt(btn.getAttribute('data-stage'));
                this.jumpToStage(stageIndex);
                this.updateStageButtonVisuals();
            });
        });

        // Ensure tooltip elements are hooked up (DOM might load before/after scene init)
        if (!this.hoverTooltip) {
            this.hookupTooltipElements();
        }

        // Pointer interaction (hover + click-to-focus)
        window.addEventListener('pointermove', (e) => {
            this.updateHoverFromPointer(e.clientX, e.clientY);
        }, { passive: true });

        if (this.renderer?.domElement) {
            this.renderer.domElement.addEventListener('click', () => {
                if (this.hoveredRoot) {
                    this.focusOnObject(this.hoveredRoot);
                }
            });
        }

        // Keyboard shortcuts for smooth control
        window.addEventListener('keydown', (e) => this.handleKeyboardInput(e), { passive: false });

        // Touch controls for mobile
        if (this.renderer?.domElement) {
            this.renderer.domElement.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
            this.renderer.domElement.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: true });
            this.renderer.domElement.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: true });
        }

        // Scroll wheel zoom
        if (this.renderer?.domElement) {
            this.renderer.domElement.addEventListener('wheel', (e) => this.handleMouseWheel(e), { passive: false });
        }
    }

    /**
     * Handle keyboard input for smooth control
     */
    handleKeyboardInput(e) {
        const key = e.key.toLowerCase();
        
        // Toggle help panel with '?'
        if (key === '?') { 
            this.toggleHelpPanel(); 
            return; 
        }
        
        // Toggle controls with number keys
        if (key === '1') { this.setSpeed('normal'); return; }
        if (key === '2') { this.setSpeed('fast'); return; }
        if (key === 'p') { this.toggleParticles(); return; }
        if (key === 'k') { this.toggleKpMeter(); return; }
        if (key === 'n') { this.toggleNarration(); return; }
        if (key === 'f') { this.toggleFreeCam(); return; }
        if (key === 'escape' || key === 'q') { this.exitTour(); return; }
        
        // Navigation keys for stage progression
        if (key === 'arrowright' || key === ' ') { 
            e.preventDefault(); 
            this.advanceStage(); 
            return; 
        }
        if (key === 'arrowleft') { 
            e.preventDefault(); 
            this.previousStage(); 
            return; 
        }
        
        // Camera zoom controls
        if (key === '+' || key === '=') { this.zoomCamera(1.1); return; }
        if (key === '-') { this.zoomCamera(0.9); return; }
    }

    /**
     * Toggle help panel visibility
     */
    toggleHelpPanel() {
        const helpPanel = document.getElementById('helpPanel');
        if (helpPanel) {
            const isVisible = helpPanel.style.display !== 'none';
            helpPanel.style.display = isVisible ? 'none' : 'block';
            this.showNotification(isVisible ? 'Help Hidden' : 'Keyboard Help Shown');
        }
    }

    /**
     * Previous stage navigation
     */
    previousStage() {
        if (this.currentStageIndex > 0) {
            this.currentStageIndex--;
            this.stageTimer = 0;
            this.updateUI();
            this.updateStagePanel();
            
            // Play AI narration for the new stage
            this.playAIVoiceNarration();
            
            console.log(`⬅️ Previous stage: ${this.currentStageIndex + 1}/${this.stageData.length}`);
        }
    }

    /**
     * Zoom camera with smooth animation
     */
    zoomCamera(factor) {
        // If no focus target, set default to origin or Earth
        if (!this.focusTarget) {
            if (this.earthObject) {
                this.focusTarget = this.earthObject.position.clone();
            } else if (this.sunObject) {
                this.focusTarget = this.sunObject.position.clone();
            } else {
                this.focusTarget = new THREE.Vector3(0, 0, 0);
            }
        }
        
        const currentDistance = this.focusDistance;
        const minDistance = 5;
        const maxDistance = 2500;
        const newDistance = Math.max(minDistance, Math.min(maxDistance, currentDistance * factor));
        
        // Set target for smooth interpolation
        this.focusDistanceTarget = newDistance;
        console.log(`🔍 Camera zoom: ${currentDistance.toFixed(0)} → ${newDistance.toFixed(0)} units`);
    }

    /**
     * Visual feedback for button clicks
     */
    feedbackButton(button) {
        if (!button) return;
        
        // Pulse effect
        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
            button.style.transform = 'scale(1)';
        }, 100);
        
        // Flash effect
        const originalBg = button.style.background;
        button.style.opacity = '0.7';
        setTimeout(() => {
            button.style.opacity = '1';
        }, 150);
    }

    /**
     * Handle touch start
     */
    handleTouchStart(e) {
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
    }

    /**
     * Handle touch move
     */
    handleTouchMove(e) {
        if (!this.touchStartX || !this.touchStartY) return;
        
        const deltaX = e.touches[0].clientX - this.touchStartX;
        const deltaY = e.touches[0].clientY - this.touchStartY;
        
        // Two-finger touch = rotate
        if (e.touches.length === 2) {
            if (this.controls && this.freeCamEnabled) {
                this.controls.autoRotate = Math.abs(deltaX) > 50;
                this.controls.autoRotateSpeed = (deltaX > 0 ? 1 : -1) * 3;
            }
        }
    }

    /**
     * Handle touch end
     */
    handleTouchEnd(e) {
        this.touchStartX = null;
        this.touchStartY = null;
        if (this.controls) {
            this.controls.autoRotate = false;
        }
    }

    /**
     * Handle mouse wheel scroll for zoom
     */
    handleMouseWheel(e) {
        e.preventDefault();
        
        // Determine zoom direction: scroll up = zoom in (decrease distance), scroll down = zoom out (increase distance)
        // Use more aggressive zoom factors for impressive effect
        const zoomFactor = e.deltaY > 0 ? 1.25 : 0.8; // Positive deltaY = scroll down (zoom out), negative = scroll up (zoom in)
        this.zoomCamera(zoomFactor);
    }

    toggleFreeCam() {
        this.freeCamEnabled = !this.freeCamEnabled;
        if (this.controls) {
            this.controls.enabled = this.freeCamEnabled;
        }

        const btn = document.getElementById('toggleFreeCam');
        if (btn) {
            btn.classList.toggle('active', this.freeCamEnabled);
            this.feedbackButton(btn);
            console.log(`🕹️ Free Cam: ${this.freeCamEnabled ? 'ENABLED' : 'DISABLED'}`);
        }

        // When enabling free cam, start centered on Earth if available (nice default)
        if (this.freeCamEnabled) {
            this.focusOnObject(this.earthObject || this.sunObject);
            this.showNotification('Free Cam Enabled - Use mouse to control camera');
        } else {
            this.showNotification('Cinematic Mode - Auto camera control');
        }
    }

    setSpeed(mode) {
        const oldSpeed = this.speedMultiplier;
        this.speedMultiplier = mode === 'normal' ? 1 : 3;
        
        document.querySelectorAll('.control-button[data-speed]').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeBtnId = `speed${mode.charAt(0).toUpperCase() + mode.slice(1)}`;
        const activeBtn = document.getElementById(activeBtnId);
        
        if (activeBtn) {
            activeBtn.classList.add('active');
            this.feedbackButton(activeBtn);
        }
        
        document.getElementById('speedValue').textContent = mode === 'normal' ? 'Normal' : '3x Speed';
        
        console.log(`⚡ Speed changed: ${oldSpeed}x → ${this.speedMultiplier}x`);
        this.showNotification(`Speed: ${mode === 'normal' ? 'Normal' : '3x Faster'}`);
    }

    toggleParticles() {
        this.showParticles = !this.showParticles;
        if (this.particleSystem) {
            this.particleSystem.visible = this.showParticles;
        }
        
        const btn = document.getElementById('showParticles');
        if (btn) {
            btn.classList.toggle('active', this.showParticles);
            this.feedbackButton(btn);
        }
        
        console.log(`☄️ Particles: ${this.showParticles ? 'VISIBLE' : 'HIDDEN'}`);
        this.showNotification(`Particles: ${this.showParticles ? 'Visible' : 'Hidden'}`);
    }

    toggleKpMeter() {
        this.showKpMeter = !this.showKpMeter;
        
        const btn = document.getElementById('showKpMeter');
        if (btn) {
            btn.classList.toggle('active', this.showKpMeter);
            this.feedbackButton(btn);
        }
        
        const kpIndicator = document.querySelector('.kp-indicator');
        if (kpIndicator) {
            kpIndicator.style.display = this.showKpMeter ? 'block' : 'none';
        }
        
        console.log(`📊 Kp Meter: ${this.showKpMeter ? 'VISIBLE' : 'HIDDEN'}`);
        this.showNotification(`Kp Meter: ${this.showKpMeter ? 'Visible' : 'Hidden'}`);
    }

    toggleNarration() {
        this.enableNarration = !this.enableNarration;
        
        const btn = document.getElementById('toggleNarration');
        if (btn) {
            btn.classList.toggle('active', this.enableNarration);
            this.feedbackButton(btn);
        }
        
        const narrationBox = document.querySelector('.narration-box');
        if (narrationBox) {
            narrationBox.style.opacity = this.enableNarration ? '1' : '0.4';
        }
        
        console.log(`🔊 Narration: ${this.enableNarration ? 'ENABLED' : 'MUTED'}`);
        this.showNotification(`Narration: ${this.enableNarration ? 'On' : 'Muted'}`);
    }

    /**
     * Play AI voice narration for current stage
     */
    playAIVoiceNarration() {
        // Check if narration is enabled and the system is available
        if (!this.enableNarration || typeof narrationSystem === 'undefined') {
            return;
        }
        
        try {
            const stage = this.stageData[this.currentStageIndex];
            if (stage) {
                // Use the stage ID to play narration
                const stageId = `stage_${this.currentStageIndex + 1}`;
                narrationSystem.playStageNarration(stageId, 'default');
                console.log(`🎙️ Playing AI narration for Stage ${this.currentStageIndex + 1}: "${stage.name}"`);
            }
        } catch (error) {
            console.warn('⚠️ AI narration error:', error);
        }
    }

    /**
     * Toggle auto-play mode
     */
    toggleAutoPlay() {
        this.autoPlay = !this.autoPlay;
        this.isPlaying = this.autoPlay;
        this.stageTimer = 0;
        
        const btn = document.getElementById('toggleAutoPlay');
        if (btn) {
            btn.classList.toggle('active', this.autoPlay);
            this.feedbackButton(btn);
        }
        
        console.log(`▶ Auto Play: ${this.autoPlay ? 'ENABLED' : 'PAUSED'}`);
        this.showNotification(`Auto Play: ${this.autoPlay ? 'ON' : 'OFF'}`);
    }

    /**
     * Jump directly to a specific stage
     */
    jumpToStage(stageIndex) {
        if (stageIndex < 0 || stageIndex >= this.stageData.length) {
            console.warn(`Stage index ${stageIndex} out of range`);
            return;
        }
        
        this.currentStageIndex = stageIndex;
        this.stageTimer = 0;
        this.isPlaying = this.autoPlay; // Resume auto play if enabled, otherwise pause
        
        this.updateUI();
        this.updateProgress();
        this.updateStageButtonVisuals();
        
        const stage = this.stageData[stageIndex];
        console.log(`🎬 Jumped to Stage ${stageIndex + 1}: ${stage.name}`);
        this.showNotification(`Stage ${stageIndex + 1}: ${stage.name}`);
        
        // Play AI narration for the new stage
        this.playAIVoiceNarration();
    }

    /**
     * Update stage button visual feedback
     */
    updateStageButtonVisuals() {
        document.querySelectorAll('.stage-button').forEach((btn, index) => {
            if (index === this.currentStageIndex) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    /**
     * Show temporary notification to user
     */
    showNotification(message) {
        const existing = document.getElementById('tour-notification');
        if (existing) {
            existing.remove();
        }

        const notification = document.createElement('div');
        notification.id = 'tour-notification';
        notification.style.cssText = `
            position: fixed;
            bottom: 150px;
            right: 20px;
            background: rgba(249, 115, 22, 0.95);
            color: white;
            padding: 12px 16px;
            border-radius: 6px;
            font-size: 13px;
            font-family: 'JetBrains Mono', monospace;
            z-index: 300;
            animation: slideIn 0.3s ease;
            box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }

    /**
     * Advance to next stage
     */
    advanceStage() {
        if (this.currentStageIndex < this.stageData.length - 1) {
            this.currentStageIndex++;
            this.stageTimer = 0;
            this.updateUI();
            this.updateStagePanel();

            // Play AI narration for the new stage
            this.playAIVoiceNarration();

            // Special effects for specific stages
            if (this.currentStageIndex === 4) {
                // Aurora stage - activate aurora light
                if (this.auroraLight) {
                    this.auroraLight.intensity = 1;
                }
            }
        } else {
            this.completeTour();
        }
    }

    /**
     * Update Kp Index display
     */
    updateKpIndex(value) {
        try {
            const kpValue = Math.min(9, Math.max(0, value));
            const kpEl = document.getElementById('kpValue');
            if (kpEl) {
                kpEl.textContent = kpValue.toFixed(1);
            }

            // Update Kp scale visualization
            const kpSegments = document.querySelectorAll('.kp-segment');
            kpSegments.forEach((segment, index) => {
                if (index < Math.ceil(kpValue)) {
                    segment.classList.add('active');
                } else {
                    segment.classList.remove('active');
                }
            });
        } catch (error) {
            // Silent fail - UI element may not exist
        }
    }

    /**
     * Update particle count display
     */
    updateParticleCount(count) {
        try {
            const particleEl = document.getElementById('particleCount');
            if (particleEl) {
                particleEl.textContent = (count / 10000).toFixed(1);
            }
            
            const streamEl = document.getElementById('particleStreamCount');
            if (streamEl) {
                streamEl.textContent = count.toLocaleString();
            }
        } catch (error) {
            // Silent fail - UI element may not exist
        }
    }

    /**
     * Update progress bar
     */
    updateProgress() {
        try {
            const progress = ((this.currentStageIndex + 1) / this.stageData.length) * 100;
            
            const fillEl = document.getElementById('progressFill');
            if (fillEl) {
                fillEl.style.width = progress + '%';
            }
            
            const percentEl = document.getElementById('progressPercent');
            if (percentEl) {
                percentEl.textContent = Math.round(progress);
            }
        } catch (error) {
            // Silent fail - UI element may not exist
        }
    }

    /**
     * Animate particles for current stage
     */
    animateParticles(intensity) {
        if (!this.particleSystem || !this.showParticles) return;

        // InstancedMesh particle update (3D charged particles)
        if (!this.particlePositions || !this.particleVelocities) return;

        const positions = this.particlePositions;
        const velocities = this.particleVelocities;
        const sizes = this.particleSizes;
        const dummy = new THREE.Object3D();

        // intensity controls turbulence + acceleration (stage-driven)
        const accel = intensity * this.speedMultiplier;
        const resetZ = 980; // when particles pass Earth region, recycle near Sun

        for (let i = 0; i < sizes.length; i++) {
            const i3 = i * 3;

            positions[i3]     += velocities[i3]     * accel * 0.45;
            positions[i3 + 1] += velocities[i3 + 1] * accel * 0.45;
            positions[i3 + 2] += velocities[i3 + 2] * accel * 0.75;

            // Turbulence
            positions[i3]     += (Math.random() - 0.5) * intensity * 0.25;
            positions[i3 + 1] += (Math.random() - 0.5) * intensity * 0.25;

            // Recycle particles once they reach Earth vicinity
            if (positions[i3 + 2] > resetZ) {
                const angle = Math.random() * Math.PI * 2;
                const phi = Math.random() * Math.PI;
                const radius = 62 + Math.random() * 55;

                positions[i3] = radius * Math.sin(phi) * Math.cos(angle);
                positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(angle);
                positions[i3 + 2] = radius * Math.cos(phi) - 80;

                velocities[i3] = (Math.random() - 0.5) * 1.8;
                velocities[i3 + 1] = (Math.random() - 0.5) * 1.8;
                velocities[i3 + 2] = Math.random() * 3.4 + 1.2;
            }

            dummy.position.set(positions[i3], positions[i3 + 1], positions[i3 + 2]);
            dummy.scale.setScalar(sizes[i]);
            dummy.updateMatrix();
            this.particleSystem.setMatrixAt(i, dummy.matrix);
        }

        this.particleSystem.instanceMatrix.needsUpdate = true;
    }

    /**
     * Create satellite models in orbit
     */
    createSatellites() {
        this.satellites = [];

        // Define different satellite types
        const satelliteTypes = [
            { name: 'GPS', altitude: 200, color: 0x4488ff, size: 3, count: 6 },
            { name: 'Comm', altitude: 220, color: 0xff8844, size: 2.5, count: 8 },
            { name: 'Weather', altitude: 180, color: 0x44ff88, size: 2, count: 4 }
        ];

        satelliteTypes.forEach(type => {
            for (let i = 0; i < type.count; i++) {
                const angle = (i / type.count) * Math.PI * 2 + Math.random() * 0.5;
                const satellite = this.createSatellite(
                    type.name,
                    type.altitude,
                    angle,
                    type.color,
                    type.size
                );
                this.satellites.push(satellite);
                this.scene.add(satellite);
                this.registerInteractable(satellite, {
                    name: `${type.name} Satellite`,
                    description: 'Orbital asset: hover to inspect, click to focus.',
                    type: 'satellite'
                });
            }
        });
    }

    /**
     * Create individual satellite model
     */
    createSatellite(name, altitude, angle, color, size) {
        const group = new THREE.Group();

        // Main body (box)
        const bodyGeometry = new THREE.BoxGeometry(size * 0.8, size * 0.5, size * 0.3);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: color,
            metalness: 0.8,
            roughness: 0.2
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        group.add(body);

        // Solar panels
        const panelGeometry = new THREE.BoxGeometry(size * 1.5, size * 0.1, size * 2);
        const panelMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a2e,
            metalness: 0.6,
            roughness: 0.3
        });
        const leftPanel = new THREE.Mesh(panelGeometry, panelMaterial);
        leftPanel.position.x = -size * 1;
        leftPanel.castShadow = true;
        group.add(leftPanel);

        const rightPanel = new THREE.Mesh(panelGeometry, panelMaterial);
        rightPanel.position.x = size * 1;
        rightPanel.castShadow = true;
        group.add(rightPanel);

        // Antenna
        const antennaGeometry = new THREE.ConeGeometry(size * 0.1, size * 0.8, 8);
        const antennaMaterial = new THREE.MeshStandardMaterial({
            color: 0xcccccc,
            metalness: 0.9,
            roughness: 0.1
        });
        const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
        antenna.position.z = size * 0.5;
        antenna.position.y = size * 0.4;
        antenna.castShadow = true;
        group.add(antenna);

        // Position in orbit around Earth
        const radius = 40 + altitude;
        group.position.x = Math.cos(angle) * radius;
        group.position.y = Math.sin(angle) * radius;
        group.position.z = 800 + Math.sin(angle * 0.5) * 20;

        // Store data
        group.userData = {
            name: name,
            altitude: altitude,
            angle: angle,
            radius: radius,
            rotationSpeed: Math.random() * 0.02 + 0.01,
            orbitSpeed: Math.random() * 0.001 + 0.0005
        };

        return group;
    }

    /**
     * Update satellite positions and rotations
     */
    updateSatellites() {
        if (!this.satellites || this.satellites.length === 0) return;

        this.satellites.forEach(satellite => {
            const data = satellite.userData;

            // Orbit around Earth
            data.angle += data.orbitSpeed * this.speedMultiplier;
            satellite.position.x = Math.cos(data.angle) * data.radius;
            satellite.position.y = Math.sin(data.angle) * data.radius;

            // Rotate satellite
            satellite.rotation.x += data.rotationSpeed;
            satellite.rotation.y += data.rotationSpeed * 0.7;
            satellite.rotation.z += data.rotationSpeed * 0.5;

            // Add some wobble for realism
            const wobble = Math.sin(data.angle * 2) * 2;
            satellite.position.z = 800 + wobble;
        });
    }

    /**
     * Rotate sun and earth
     */
    updateCelestialBodies() {
        if (this.sunObject) {
            this.sunObject.rotation.x += 0.00012;
            this.sunObject.rotation.y += 0.00018;

            // Rotate solar flares
            if (this.solarFlares) {
                this.solarFlares.rotation.x += 0.005;
                this.solarFlares.rotation.y += 0.008;
            }
        }

        if (this.earthObject) {
            this.earthObject.rotation.y += 0.0001;
            this.earthObject.rotation.x += 0.00003;

            // Rotate cloud layer
            if (this.cloudLayer) {
                this.cloudLayer.rotation.y -= 0.00015;
            }
        }

        // Update satellites
        this.updateSatellites();

        // Update aurora
        this.updateAurora();

        // Mars slow rotation
        if (this.marsObject) {
            this.marsObject.rotation.y += 0.00012;
        }
    }

    /**
     * Update aurora effect based on stage
     */
    updateAurora() {
        if (!this.aurora) return;

        // Show aurora during stage 5 and beyond
        if (this.currentStageIndex >= 4) {
            const intensity = Math.min(1, (this.currentStageIndex - 4 + this.stageTimer / this.stageData[this.currentStageIndex]?.duration_seconds) * 0.3);
            this.aurora.material.opacity = intensity * 0.8;

            // Animate aurora
            this.aurora.rotation.z += 0.001;
            this.aurora.rotation.x += 0.0005;

            // Scale effect
            const scale = 1 + Math.sin(Date.now() * 0.001) * 0.1;
            this.aurora.scale.set(scale, scale, 1);
        } else {
            this.aurora.material.opacity = 0;
        }
    }

    /**
     * Update camera along path
     */
    updateCamera() {
        // In free-cam, OrbitControls takes over camera movement.
        if (this.freeCamEnabled && this.controls) return;
        if (this.cameraPath.length === 0) return;

        const pathIndex = Math.floor(this.totalProgress * this.cameraPath.length);
        const clampedIndex = Math.min(pathIndex, this.cameraPath.length - 1);

        if (this.cameraPath[clampedIndex]) {
            const pos = this.cameraPath[clampedIndex].position;
            const target = this.cameraPath[clampedIndex].target;

            this.camera.position.lerp(
                new THREE.Vector3(pos.x, pos.y, pos.z),
                0.05
            );
            this.camera.lookAt(target.x, target.y, target.z);
        }
    }

    /**
     * Main animation loop
     */
    animate() {
        requestAnimationFrame(() => this.animate());

        // Safety check: only render if scene is initialized
        if (!this.scene || !this.renderer) {
            console.warn('⚠️ Scene or renderer not ready, skipping frame');
            return;
        }

        if (this.isPlaying && this.stageData.length > 0) {
            const stage = this.stageData[this.currentStageIndex];
            const stageDuration = stage.duration_seconds;

            this.stageTimer += (16 * this.speedMultiplier) / 1000; // Assuming 60fps

            if (this.stageTimer >= stageDuration) {
                this.advanceStage();
            }

            // Update metrics
            const kpProgression = (this.currentStageIndex / this.stageData.length) * 9;
            this.updateKpIndex(kpProgression);
            this.updateParticleCount((this.currentStageIndex / this.stageData.length) * 100000);
            this.updateProgress();

            // Animate particles based on stage intensity
            this.animateParticles((this.stageTimer / stageDuration) * 2);
        }

        // Update celestial bodies and camera
        this.updateCelestialBodies();
        this.updateCamera();
        this.updateCameraPosition(); // Smooth camera transitions

        // Free-cam controls update
        if (this.controls && this.freeCamEnabled) {
            this.controls.update();
        }

        this.totalProgress = (this.currentStageIndex + this.stageTimer / (this.stageData[this.currentStageIndex]?.duration_seconds || 1)) / this.stageData.length;

        try {
            if (this.composer) {
                this.composer.render();
            } else {
                this.renderer.render(this.scene, this.camera);
            }
        } catch (error) {
            console.error('Rendering error:', error);
        }
    }

    /**
     * Handle window resize
     */
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        if (this.composer && this.composer.setSize) {
            this.composer.setSize(window.innerWidth, window.innerHeight);
        }
    }

    /**
     * Complete tour
     */
    async completeTour() {
        this.isPlaying = false;
        try {
            await fetch('http://localhost:8000/api/metaverse/tour/experience-complete');
        } catch (error) {
            console.error('Error completing tour:', error);
        }

        setTimeout(() => {
            if (confirm('Tour Complete! Return to main website?')) {
                // Works both for file:// and http server usage
                window.location.href = 'index.html';
            }
        }, 1000);
    }

    /**
     * Exit tour early
     */
    exitTour() {
        if (confirm('Exit the Solar Wind Journey?')) {
            window.location.href = 'index.html';
        }
    }

    /**
     * Show welcome message with control hints
     */
    showWelcomeMessage() {
        this.showNotification('Welcome to 3D Tour! 🎙️ AI Narration is ACTIVE. Press ? for keyboard controls');
        
        // Auto-play the narration for the first stage after a brief delay
        setTimeout(() => {
            this.playAIVoiceNarration();
        }, 800);
    }

    /**
     * Hide loading screen
     */
    hideLoadingScreen() {
        try {
            const loadingScreen = document.getElementById('loadingScreen');
            if (loadingScreen) {
                loadingScreen.style.opacity = '0';
                loadingScreen.style.pointerEvents = 'none';
                loadingScreen.style.transition = 'opacity 0.5s ease';
            } else {
                console.warn('Loading screen element not found');
            }
        } catch (error) {
            console.error('Error hiding loading screen:', error);
        }
    }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

let tour;

document.addEventListener('DOMContentLoaded', async () => {
    tour = new SolarWindJourney();
    await tour.init();
});

// ============================================================================
// LIVE DATA INTEGRATION - WebSocket Client
// ============================================================================

let liveWebSocket = null;
let liveModeActive = false;
let autoAdvanceEnabled = false;
let lastLiveMetrics = null;

/**
 * Toggle live mode on/off
 */
function toggleLiveMode() {
    if (liveModeActive) {
        disconnectLiveStream();
    } else {
        connectLiveStream();
    }
}

/**
 * Connect to live data WebSocket stream
 */
function connectLiveStream() {
    if (liveWebSocket && liveWebSocket.readyState === WebSocket.OPEN) {
        console.log('⚠️ WebSocket already connected');
        return;
    }

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = window.location.hostname || 'localhost';
    const wsPort = window.location.port || '8000';
    const wsUrl = `${wsProtocol}//${wsHost}:${wsPort}/api/live/stream`;

    console.log('🔌 Connecting to live data stream:', wsUrl);

    try {
        liveWebSocket = new WebSocket(wsUrl);

        liveWebSocket.onopen = () => {
            console.log('✅ Live data stream connected');
            liveModeActive = true;
            updateLiveIndicator(true);
            updateLiveButton(true);
            showLiveMetricsPanel(true);
            
            // Request initial metrics
            if (tour) {
                tour.showNotification('Live Mode: Connected to real-time space weather data');
            }
        };

        liveWebSocket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                handleLiveDataUpdate(data);
            } catch (error) {
                console.error('❌ Error parsing WebSocket message:', error);
            }
        };

        liveWebSocket.onerror = (error) => {
            console.error('❌ WebSocket error:', error);
            updateLiveIndicator(false);
            if (tour) {
                tour.showNotification('Live Mode: Connection error - using fallback data');
            }
        };

        liveWebSocket.onclose = () => {
            console.log('❌ Live data stream disconnected');
            liveModeActive = false;
            updateLiveIndicator(false);
            updateLiveButton(false);
            
            // Attempt to reconnect after 5 seconds
            setTimeout(() => {
                if (!liveModeActive) {
                    console.log('🔄 Attempting to reconnect...');
                    connectLiveStream();
                }
            }, 5000);
        };

    } catch (error) {
        console.error('❌ Failed to create WebSocket:', error);
        updateLiveIndicator(false);
        if (tour) {
            tour.showNotification('Live Mode: Failed to connect - check server status');
        }
    }
}

/**
 * Disconnect from live data stream
 */
function disconnectLiveStream() {
    if (liveWebSocket) {
        liveWebSocket.close();
        liveWebSocket = null;
    }
    liveModeActive = false;
    updateLiveIndicator(false);
    updateLiveButton(false);
    showLiveMetricsPanel(false);
    
    if (tour) {
        tour.showNotification('Live Mode: Disconnected');
    }
}

/**
 * Handle incoming live data updates
 */
function handleLiveDataUpdate(data) {
    if (!data || !data.metrics) {
        return;
    }

    const metrics = data.metrics;
    const stageInfo = data.stage || { index: 0, info: {} };

    // Store latest metrics
    lastLiveMetrics = metrics;

    // Update UI elements
    updateLiveMetricsUI(metrics);
    updateDataQualityBadge(metrics.data_quality || 'unknown');

    // Update tour metrics if tour is initialized
    if (tour) {
        // Update Kp index in tour
        tour.updateKpIndex(metrics.kp_index || 0);
        
        // Update particle count
        tour.updateParticleCount(metrics.particle_flux || 0);

        // Auto-advance stage if enabled and stage changed
        if (autoAdvanceEnabled && stageInfo.changed && stageInfo.index !== undefined) {
            const newStage = stageInfo.index;
            if (newStage !== tour.currentStageIndex) {
                console.log(`🔄 Auto-advancing to stage ${newStage} based on live data`);
                tour.jumpToStage(newStage);
            }
        }

        // Show event notifications
        if (stageInfo.info && stageInfo.info.event) {
            const event = stageInfo.info.event;
            if (event.type === 'geomagnetic_storm' && event.severity === 'strong') {
                tour.showNotification(`⚠️ ${event.severity.toUpperCase()} GEOMAGNETIC STORM DETECTED!`);
            } else if (event.type === 'aurora_active') {
                tour.showNotification('✨ Aurora Active - Kp Index elevated');
            }
        }
    }
}

/**
 * Update live metrics UI elements
 */
function updateLiveMetricsUI(metrics) {
    const updateElement = (id, value, format = (v) => v) => {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = format(value);
        }
    };

    updateElement('liveKpIndex', metrics.kp_index, v => v ? v.toFixed(1) : '--');
    updateElement('liveSolarWind', metrics.solar_wind_speed, v => v ? `${v} km/s` : '--');
    updateElement('liveParticleFlux', metrics.particle_flux, v => v ? v.toLocaleString() : '--');
    updateElement('liveAuroraIntensity', metrics.aurora_intensity, v => v ? (v * 100).toFixed(0) + '%' : '--');
    updateElement('liveSatelliteRisk', metrics.satellite_impact_risk, v => v ? (v * 100).toFixed(0) + '%' : '--');
    
    // Update last update time
    if (metrics.timestamp) {
        const updateTime = new Date(metrics.timestamp);
        updateElement('liveLastUpdate', updateTime.toLocaleTimeString());
    }
}

/**
 * Update live indicator status
 */
function updateLiveIndicator(connected) {
    const indicator = document.getElementById('liveIndicator');
    const statusText = document.getElementById('liveStatusText');
    
    if (indicator) {
        if (connected) {
            indicator.classList.add('connected');
            if (statusText) statusText.textContent = 'LIVE';
        } else {
            indicator.classList.remove('connected');
            if (statusText) statusText.textContent = 'OFFLINE';
        }
    }
}

/**
 * Update live button state
 */
function updateLiveButton(active) {
    const button = document.getElementById('live-button');
    const buttonText = document.getElementById('liveButtonText');
    
    if (button) {
        if (active) {
            button.classList.add('active');
            if (buttonText) buttonText.textContent = '🟢 LIVE MODE ACTIVE';
        } else {
            button.classList.remove('active');
            if (buttonText) buttonText.textContent = '🔴 START LIVE MODE';
        }
    }
}

/**
 * Show/hide live metrics panel
 */
function showLiveMetricsPanel(show) {
    const panel = document.getElementById('liveMetricsPanel');
    if (panel) {
        if (show) {
            panel.classList.add('visible');
        } else {
            panel.classList.remove('visible');
        }
    }
}

/**
 * Update data quality badge
 */
function updateDataQualityBadge(quality) {
    const badge = document.getElementById('dataQualityBadge');
    if (badge) {
        badge.textContent = quality;
        badge.className = 'data-quality-badge ' + quality;
    }
}

// Make functions globally available
window.toggleLiveMode = toggleLiveMode;
window.connectLiveStream = connectLiveStream;
window.disconnectLiveStream = disconnectLiveStream;
