// Initialize Lucide Icons & Effects
document.addEventListener('DOMContentLoaded', function() {
    // Initialize icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    generateStars();
    initializeCardHoverEffects();
    updateTimers();
    initializeSmoothScrolling();
    
    // UPDATED: Now calls the Typewriter effect
    initTypewriterEffect();
});

// --- TYPEWRITER EFFECT (Replaces Hacker Effect) ---
document.addEventListener('DOMContentLoaded', function() {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    generateStars();
    initializeCardHoverEffects();
    updateTimers();
    initializeSmoothScrolling();
    
    // START THE AUTO LOOP
    initAutoTypewriterLoop();
});

// --- AUTO TYPEWRITER LOOP ---
function initAutoTypewriterLoop() {
    // Select elements to animate
    const targets = document.querySelectorAll('.main-title, .metric-value, .card-title, .logo-text');

    targets.forEach((target, index) => {
        // 1. LOCK LAYOUT
        // We calculate the width of the text before we delete it.
        // We force the element to keep this width so the website doesn't jitter/shrink.
        const rect = target.getBoundingClientRect();
        target.style.minWidth = `${rect.width}px`;
        target.style.display = 'inline-block'; // Ensures width is respected
        target.style.textAlign = 'left';       // Keeps text anchored left while typing

        // Store original text
        const originalText = target.textContent.trim();
        target.dataset.value = originalText;

        // 2. START LOOP FUNCTION
        function runTypingCycle() {
            // A. Clear Text
            target.textContent = "";
            target.classList.add('typing-cursor'); // Add blinking cursor style

            let charIndex = 0;
            
            // B. Type Character by Character
            const typeInterval = setInterval(() => {
                target.textContent += originalText.charAt(charIndex);
                charIndex++;

                // Check if finished typing
                if (charIndex >= originalText.length) {
                    clearInterval(typeInterval);
                    target.classList.remove('typing-cursor'); // Remove cursor

                    // C. Wait, then Restart
                    // Wait 5 to 8 seconds before clearing and typing again
                    const pauseDuration = Math.random() * 3000 + 5000; 
                    setTimeout(runTypingCycle, pauseDuration);
                }
            }, 50 + (Math.random() * 30)); // Randomize typing speed slightly for realism
        }

        // 3. INITIAL START DELAY
        // Stagger the start times so they don't all vanish at once.
        // First run happens between 1s and 4s after load.
        const startDelay = index * 800 + 1000; 
        setTimeout(runTypingCycle, startDelay);
    });
}

// 2. STAR GENERATION (Unchanged)
function generateStars() {
    const starContainer = document.getElementById('starfield');
    if (!starContainer) return;
    
    const starCount = 200;
    
    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.classList.add('star');
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        const size = Math.random() * 2 + 1;
        const duration = Math.random() * 3 + 2 + 's';
        const opacity = Math.random() * 0.7 + 0.3;
        
        star.style.left = x + '%';
        star.style.top = y + '%';
        star.style.width = size + 'px';
        star.style.height = size + 'px';
        star.style.setProperty('--duration', duration);
        star.style.setProperty('--opacity', opacity);
        
        starContainer.appendChild(star);
    }
}

// 3. CARD HOVER (Visual Icon Spin only)
function initializeCardHoverEffects() {
    const cards = document.querySelectorAll('.feature-card');
    
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            const icon = this.querySelector('.card-icon');
            if (icon) {
                // Simple CSS rotation without changing layout flow
                icon.style.transition = "transform 0.5s ease";
                icon.style.transform = "rotate(360deg) scale(1.1)";
                icon.style.borderColor = "#f97316";
            }
        });
        
        card.addEventListener('mouseleave', function() {
            const icon = this.querySelector('.card-icon');
            if (icon) {
                icon.style.transform = "rotate(0deg) scale(1)";
                icon.style.borderColor = "rgba(255, 255, 255, 0.1)";
            }
        });
    });
}

// 4. TIMERS (Unchanged)
function updateTimers() {
    const timerElements = document.querySelectorAll('.timer');
    if (!timerElements.length) return;
    
    function updateTime() {
        const now = new Date();
        const utcHours = now.getUTCHours().toString().padStart(2, '0');
        const utcMinutes = now.getUTCMinutes().toString().padStart(2, '0');
        const utcSeconds = now.getUTCSeconds().toString().padStart(2, '0');
        
        timerElements.forEach(timer => {
            if (timer.textContent.includes('UTC')) {
                timer.textContent = `UTC ${utcHours}:${utcMinutes}:${utcSeconds}`;
            }
        });
    }
    updateTime();
    setInterval(updateTime, 1000);
}

// 5. SMOOTH SCROLL (Unchanged)
function initializeSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
}
// Sun Flare Animation Script
function initRingShader() {
    const container = document.getElementById('ring-canvas-container');
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // This is the GLSL code that creates the "Nexus" expanding effect
    const fragmentShader = `
        uniform float uTime;
        uniform vec2 uResolution;

        // Noise functions to create the "shapeless" organic distortion
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

        float snoise(vec2 v) {
            const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
            vec2 i  = floor(v + dot(v, C.yy) );
            vec2 x0 = v -   i + dot(i, C.xx);
            vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
            vec4 x12 = x0.xyxy + C.xxzz;
            x12.xy -= i1;
            i = mod289(i);
            vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
            vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
            m = m*m ; m = m*m ;
            vec3 x = 2.0 * fract(p * C.www) - 1.0;
            vec3 h = abs(x) - 0.5;
            vec3 a0 = x - floor(x + 0.5);
            vec3 g = a0 * vec3(x0.x, x12.xz) + h * vec3(x0.y, x12.yw);
            return 130.0 * dot(m, g);
        }

        void main() {
            // 1. Setup Coordinates
            vec2 uv = (gl_FragCoord.xy * 2.0 - uResolution.xy) / min(uResolution.y, uResolution.x);
            
            // 2. Create the Dot Grid (The "Nexus" pixelated look)
            vec2 gridUv = fract(uv * 40.0) - 0.5; // Controls number of dots
            float dots = smoothstep(0.4, 0.3, length(gridUv));
            
            // 3. Warp the space using noise (Organic shapelessness)
            float noise = snoise(uv * 1.2 + uTime * 0.2);
            float dist = length(uv) + noise * 0.2; 
            
            // 4. Expanding Loop Logic
            float radius = mod(uTime * 0.3, 2.2);
            
            // 5. Variable Thickness (Thicker where noise is higher)
            float thickness = 0.08 + noise * 0.04;
            float ring = smoothstep(radius - thickness, radius, dist) - smoothstep(radius, radius + thickness, dist);
            
            // 6. Color Setup (Solar Orange/Amber)
            vec3 solarColor = vec3(1.0, 0.4, 0.05);
            
            // Final composite: Ring color * dots * fade-out as it grows
            float finalAlpha = ring * dots * (1.2 - (radius / 2.0));
            
            gl_FragColor = vec4(solarColor, finalAlpha * 0.8);
        }
    `;

    const geometry = new THREE.PlaneGeometry(2, 2);
    const uniforms = {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
    };

    const material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        fragmentShader: fragmentShader,
        transparent: true,
        blending: THREE.AdditiveBlending
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    function animate(time) {
        uniforms.uTime.value = time * 0.001;
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    }

    window.addEventListener('resize', () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
    });

    animate();
}

// Call the function when the page loads
document.addEventListener('DOMContentLoaded', initRingShader);
