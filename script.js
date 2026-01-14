// Initialize Lucide Icons
document.addEventListener('DOMContentLoaded', function() {
    // Initialize icons if Lucide is available
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    // Generate stars
    generateStars();
    
    // Add hover effects to feature cards
    initializeCardHoverEffects();
    
    // Update timers
    updateTimers();
    
    // Add smooth scrolling for anchor links
    initializeSmoothScrolling();
});

// Star Generation Logic
function generateStars() {
    const starContainer = document.getElementById('starfield');
    if (!starContainer) return;
    
    const starCount = 200;
    
    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.classList.add('star');
        
        // Random position
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        
        // Random size (mostly very small)
        const size = Math.random() * 2 + 1;
        
        // Random duration and opacity
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

// Initialize card hover effects
function initializeCardHoverEffects() {
    const cards = document.querySelectorAll('.feature-card');
    
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            const icon = this.querySelector('.card-icon-svg');
            if (icon) {
                const originalIcon = icon.getAttribute('data-lucide');
                // You could add custom hover effects here
            }
        });
        
        card.addEventListener('mouseleave', function() {
            const icon = this.querySelector('.card-icon-svg');
            if (icon) {
                // Restore original icon if needed
            }
        });
    });
}

// Update timers
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
            // You could add logic for T-MINUS timer here
        });
    }
    
    // Update immediately
    updateTime();
    
    // Update every second
    setInterval(updateTime, 1000);
}

// Initialize smooth scrolling
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

// Add interactive functionality to dashboard elements
document.addEventListener('DOMContentLoaded', function() {
    // Make dashboard buttons interactive
    const ctaButtons = document.querySelectorAll('.cta-primary, .cta-secondary, .login-button');
    
    ctaButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Add ripple effect
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = event.clientX - rect.left - size / 2;
            const y = event.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.3);
                transform: scale(0);
                animation: ripple-animation 0.6s linear;
                width: ${size}px;
                height: ${size}px;
                top: ${y}px;
                left: ${x}px;
                pointer-events: none;
            `;
            
            this.appendChild(ripple);
            
            // Remove ripple after animation
            setTimeout(() => {
                ripple.remove();
            }, 600);
            
            // Log button click for analytics (in a real app)
            console.log(`Button clicked: ${this.textContent.trim()}`);
        });
    });
    
    // Add CSS for ripple animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple-animation {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
});