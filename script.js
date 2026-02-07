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


const API_URL = "https://sol-ark.onrender.com/forecast-kp";
let maxkp = 0;

async function updateDashboardMetrics() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();

        //Update UTC time
        const utc = document.getElementById('utc-time');
        if (utc) {
            utc.innerText = `UTC ${new Date().toISOString().substr(11, 8)}`;
        }

        // 1. Update bz (Metric 1)
        const bzCard = document.querySelector('#bz-card');
        if (bzCard) {
            // Update the large number
            bzCard.querySelector('.metric-value-large').innerText = data.observatory.bz.toFixed(2);
        }

        // 2. Update Density (Metric 2)
        const densityCard = document.querySelector('#density-card');
        if (densityCard) {
            // Update the large number
            densityCard.querySelector('.metric-value-large').innerText = data.observatory.density.toFixed(2);
        }

        // 3. Update Speed (Metric 3)
        const speedCard = document.querySelector('#speed-card');
        if (speedCard) {
            // Update the large number
            speedCard.querySelector('.metric-value-large').innerText = data.observatory.speed.toFixed(2);
        }

        // 4. Update bt (Metric 4)
        const btCard = document.querySelector('#bt-card');
        if (btCard) {
            // Update the large number
            btCard.querySelector('.metric-value-large').innerText = data.observatory.bt.toFixed(2);
        }

        // 5. Update ey (Metric 5)
        const eyCard = document.querySelector('#ey-card');
        if (eyCard) {
            // Update the large number
            eyCard.querySelector('.metric-value-large').innerText = data.observatory.ey.toFixed(2);
        }

        // Update the Kp Forecast Chart
        const forecastArray = data.forecast.hourly_kp;
        maxkp = Math.max(...forecastArray);
        if (data.forecast && data.forecast.hourly_kp) {
            renderKpChart(data.forecast.hourly_kp, data.avg_6h);
        }

        //Update live KP value
        const liveKpElement = document.getElementById('live-kp');
        if (liveKpElement) {
            liveKpElement.innerText = data.forecast.live_kp.toFixed(2);
        }

        // Update Impact Grid Cards
        const bz = data.observatory.bz;
        const speed = data.observatory.speed;
        const kp = data.forecast.live_kp;

        // 1. Orbital Drag (Based on Speed)
        const dragPct = Math.min(((speed - 300) / 500) * 100, 100);
        updateImpactModule('drag-bar', 'drag-status', dragPct, "High Drag: Orbit decay possible.");

        // 2. Scintillation (Based on Kp and Bz)
        let scinPct = (kp / 9) * 100;
        if (bz < 0) scinPct += (Math.abs(bz) / 20) * 50; 
        updateImpactModule('scin-bar', 'scin-status', Math.min(scinPct, 100), "Signal Jitter: GNSS lock weak.");

        // 3. Power Grid (Based on Kp)
        const gicPct = (kp / 9) * 100;
        updateImpactModule('gic-bar', 'gic-status', gicPct, "GIC Detected: Transformer saturation risk.");

        //Storm Level Badge Update
        const stormInfo = getStormLevel(maxkp); // Use the peak from your 6h forecast
        const badge = document.getElementById('storm-level-badge');
        if (badge) {
            badge.className = `storm-badge ${stormInfo.class}`;
            badge.querySelector('span').innerText = `STORM STATUS: ${stormInfo.label}`;
        }

        // Update Storm Details Panel
        const currentStorm = getStormLevel(maxkp); // Use your existing helper
        const detailTitle = document.getElementById('storm-detail-title');
        const detailList = document.getElementById('storm-detail-list');

        if (detailTitle && detailList) {
            const data = stormLevelData[currentStorm.class];
            detailTitle.innerText = data.title;
            detailTitle.style.color = getComputedStyle(document.querySelector(`.storm-badge.${currentStorm.class}`)).color;

            // Inject the bullet points
            detailList.innerHTML = data.points.map(point => `<li>${point}</li>`).join('');
        }

    } catch (error) {
        console.error("Failed to fetch live telemetry:", error);
    }
}

// Data Object for Metric Details
const observatoryDetails = {
    'IMF Bz': {
        title: "IMF Bz (North-South Component)",
        body: "Bz represents the north-south direction of the Interplanetary Magnetic Field (IMF). When Bz turns southward (negative value), it connects with Earth's northward-pointing magnetic field, opening a 'rift' that allows solar wind particles to enter our magnetosphere and trigger auroras or storms."
    },
    'Proton Density': {
        title: "Proton Density (Np)",
        body: "Proton density measures the concentration of ionized particles (protons) in the solar wind. High density often indicates the arrival of a Coronal Mass Ejection (CME), which can increase satellite drag and cause electronics failures due to ionizing radiation."
    },
    'Speed': {
        title: "Solar Wind Speed (V)",
        body: "Solar wind speed is the velocity of charged particles streaming from the Sun, typically averaging 400 km/s. Rapid increases (over 500-800 km/s) compress Earth's magnetosphere, potentially inducing currents that disrupt power grids and communication systems."
    },
    'IMF Bt': {
        title: "IMF Bt (Total Field Strength)",
        body: "Bt represents the total strength of the Interplanetary Magnetic Field. A high Bt value indicates a stronger overall magnetic field in the solar wind, which can amplify the intensity of geomagnetic disturbances if the field orientation turns southward."
    },
    'Electric Field Ey': {
        title: "Solar Wind Electric Field (Ey)",
        body: "The solar wind electric field (Ey) is a derived value calculated from the solar wind velocity (V) and the IMF Bz component. It represents the dawn-to-dusk electric potential; a stronger Ey enhances the cross-polar cap potential, driving intense geomagnetic activity."
    }
};

// Define the Storm Level Data
const stormLevelData = {
    "g0": {
        title: "G0 — QUIET (KP < 5)",
        points: [
            "Satellite operations remain fully stable",
            "GPS, GNSS, and timing signals are accurate",
            "No radio or communication disruptions",
            "Normal satellite drag and orbit conditions"
        ]
    },
    "g1": {
        title: "G1 — MINOR (KP ≥ 5)",
        points: [
            "Minor signal fluctuations in high-latitude radio communication",
            "Slight increase in satellite drag (negligible impact)",
            "GPS accuracy may show brief, localized deviations",
            "Low-risk conditions for satellite electronics"
        ]
    },
    "g2": {
        title: "G2 — MODERATE (KP ≥ 6)",
        points: [
            "Intermittent HF radio communication disruptions",
            "GPS positioning errors increase in polar regions",
            "Low Earth Orbit satellites experience noticeable drag changes",
            "Minor satellite orientation and sensor disturbances"
        ]
    },
    "g3": {
        title: "G3 — STRONG (KP ≥ 7)",
        points: [
            "Widespread HF radio blackouts at high latitudes",
            "GPS navigation accuracy significantly degraded",
            "Increased risk of satellite attitude control issues",
            "Communication satellites may require corrective adjustments"
        ]
    },
    "g4": {
        title: "G4 — SEVERE (KP ≥ 8)",
        points: [
            "Satellite communication outages possible",
            "GNSS systems become unreliable across wide regions",
            "Increased radiation exposure to satellite electronics",
            "Satellite operators may initiate safe-mode procedures"
        ]
    },
    "g5": {
        title: "G5 — EXTREME (KP ≥ 9)",
        points: [
            "Long-duration satellite communication failures possible",
            "Severe GPS and navigation system disruptions",
            "Permanent damage risk to satellite electronics",
            "Loss of satellite control in extreme cases"
        ]
    }
};

// Interaction Logic for dashboard metrics
document.addEventListener('DOMContentLoaded', function() {
    const defaultView = document.getElementById('visualizer-default-view');
    const detailsView = document.getElementById('visualizer-details-view');
    const detailsTitle = document.getElementById('details-title');
    const detailsBody = document.getElementById('details-body');

    // Handle Metric Card Clicks
    document.querySelectorAll('.metric-card').forEach(card => {
        card.addEventListener('click', function(e) {
            e.stopPropagation(); // Stop click from immediately closing the view
            
            const cardTitle = this.querySelector('.metric-title').textContent.trim();
            const details = observatoryDetails[cardTitle];

            if (details) {
                // Update text content
                detailsTitle.textContent = details.title;
                detailsBody.innerHTML = `<p>${details.body}</p>`;

                // Toggle visibility: Hide animation, show details
                defaultView.classList.add('hidden');
                detailsView.classList.remove('hidden');
            }
        });
    });

    // Handle "Click Outside" to Close
    document.addEventListener('click', function(e) {
        // If the click is NOT inside a metric card, return to default view
        if (!e.target.closest('.metric-card')) {
            detailsView.classList.add('hidden');
            defaultView.classList.remove('hidden');
        }
    });
});

// KP chart logic
let kpChart = null; // Store chart instance to destroy/recreate on click

function renderKpChart(hourlyData, avgValue) {
    const ctx = document.getElementById('kpForecastChart').getContext('2d');
    
    // Labels for T to T+6 hours
    const labels = ['Live', 'T+1h', 'T+2h', 'T+3h', 'T+4h', 'T+5h', 'T+6h'];

    // Destroy old chart if it exists to prevent overlap
    if (kpChart) { kpChart.destroy(); }

    kpChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Predicted Kp Index',
                data: hourlyData,
                backgroundColor: 'rgba(249, 115, 22, 0.6)', // Solar Orange
                borderColor: '#f97316',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, max: (maxkp + 0.2), grid: { color: 'rgba(255,255,255,0.1)' } },
                x: { grid: { display: false } }
            }
        }
    });
}

// function to handle impact bar fill and status update
function updateImpactModule(barId, statusId, value, warningText) {
    const bar = document.getElementById(barId);
    const status = document.getElementById(statusId);
    // const value = 41; // For testing purposes
    bar.style.width = `${value}%`;
    
    // Set colors and text based on severity
    if (value > 70) {
        bar.className = 'meter-fill red';
        status.innerText = warningText;
        status.style.color = '#fca5a5';
    } else if (value > 40) {
        bar.className = 'meter-fill yellow';
        status.innerText = "Elevated activity. Monitor levels.";
        status.style.color = '#fde047';
    } else {
        bar.className = 'meter-fill green';
        status.innerText = "Nominal operations.";
        status.style.color = '#71717a';
    }
}

// Function to map Kp to NOAA G-Scale
function getStormLevel(kp) {
    if (kp >= 9) return { level: "G5", label: "G5 (EXTREME)", class: "g5" };
    if (kp >= 8) return { level: "G4", label: "G4 (SEVERE)", class: "g4" };
    if (kp >= 7) return { level: "G3", label: "G3 (STRONG)", class: "g3" };
    if (kp >= 6) return { level: "G2", label: "G2 (MODERATE)", class: "g2" };
    if (kp >= 5) return { level: "G1", label: "G1 (MINOR)", class: "g1" };
    return { level: "G0", label: "G0 (QUIET)", class: "g0" };
}

// Call it once when the page loads
document.addEventListener('DOMContentLoaded', updateDashboardMetrics);