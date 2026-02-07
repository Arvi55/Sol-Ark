/**
 * AI Narration System for Solar Wind Journey
 * Generates and delivers voice-over content for each stage
 */

class AIZarrationSystem {
    constructor() {
        this.synth = window.speechSynthesis || null;
        this.voices = [];
        this.isPlaying = false;
        this.currentUtterance = null;
        this.narratorName = "Solar System Narrator";
        this.enabledVoices = {
            default: true,
            english_us: true,
            english_uk: false
        };
        this.initializeVoices();
    }

    /**
     * Initialize available voices
     */
    initializeVoices() {
        if (!this.synth) {
            console.warn('Speech Synthesis API not available');
            return;
        }

        const voices = this.synth.getVoices();
        if (voices.length === 0) {
            // Wait for voices to load
            this.synth.onvoiceschanged = () => {
                this.voices = this.synth.getVoices();
            };
        } else {
            this.voices = voices;
        }
    }

    /**
     * Get narration for a stage
     */
    getNarration(stageId, narratorType = 'default') {
        const narrations = {
            'stage_1': {
                text: "Welcome to the Sun's surface. We're about to witness one of nature's most powerful events - a Coronal Mass Ejection. Watch as magnetic field lines suddenly rupture, releasing billions of tons of charged particles into space.",
                duration: 10
            },
            'stage_2': {
                text: "The eruption is happening NOW! Billions of tons of plasma and magnetic fields are launching outward at speeds exceeding 1,000 kilometers per second. We're about to ride this cosmic wave across the solar system.",
                duration: 8
            },
            'stage_3': {
                text: "We're now traveling across the vast emptiness of space. 93 million miles separate the Sun from Earth, but these charged particles are bridging that gap at incredible speeds. The journey that takes light 8 minutes normally takes these storm particles just 18 hours.",
                duration: 12
            },
            'stage_4': {
                text: "Earth is coming into view! Notice the blue marble surrounded by an invisible shield - our magnetosphere. This protective bubble is about to get tested. The incoming solar wind is compressing our magnetic field like a hand squeezing a balloon.",
                duration: 10
            },
            'stage_5': {
                text: "The charged particles are funneling down along Earth's magnetic field lines toward the poles. When these particles collide with oxygen and nitrogen atoms in our atmosphere, they emit light - creating the magnificent Aurora Borealis. This is the visible proof of the solar storm.",
                duration: 12
            },
            'stage_6': {
                text: "But this beautiful light show comes with a cost. GPS satellites operating in near-Earth orbit are experiencing signal degradation. Power grids are showing strain. Communications satellites are struggling. This is why we monitor space weather - to protect our technology-dependent civilization.",
                duration: 11
            },
            'stage_7': {
                text: "This journey you've just completed demonstrates the incredible connection between our Sun and Earth. Sol-Ark monitors these events 24/7, providing crucial early warnings to protect critical infrastructure. We are the guardians of Earth's orbital shield.",
                duration: 10
            }
        };

        return narrations[stageId] || {
            text: "Continuing the Solar Wind Journey...",
            duration: 5
        };
    }

    /**
     * Speak narration text
     */
    speak(text, voiceType = 'default') {
        if (!this.synth) {
            console.warn('Speech Synthesis not available');
            return;
        }

        // Cancel any ongoing speech
        this.synth.cancel();

        const utterance = new SpeechSynthesisUtterance(text);

        // Select voice
        if (this.voices.length > 0) {
            const selectedVoice = this.selectVoice(voiceType);
            if (selectedVoice) {
                utterance.voice = selectedVoice;
            }
        }

        // Configure speech
        utterance.rate = 1.0;      // Speed
        utterance.pitch = 1.0;     // Pitch
        utterance.volume = 1.0;    // Volume

        // Event handlers
        utterance.onstart = () => {
            this.isPlaying = true;
            this.currentUtterance = utterance;
        };

        utterance.onend = () => {
            this.isPlaying = false;
            this.currentUtterance = null;
        };

        utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event.error);
            this.isPlaying = false;
        };

        // Speak
        this.synth.speak(utterance);
    }

    /**
     * Select appropriate voice
     */
    selectVoice(voiceType) {
        if (this.voices.length === 0) return null;

        const voicePreferences = {
            'default': (voice) => voice.lang.startsWith('en'),
            'english_us': (voice) => voice.lang === 'en-US',
            'english_uk': (voice) => voice.lang === 'en-GB'
        };

        const preference = voicePreferences[voiceType] || voicePreferences['default'];
        const selectedVoice = this.voices.find(preference);

        return selectedVoice || this.voices[0];
    }

    /**
     * Stop speaking
     */
    stop() {
        if (this.synth) {
            this.synth.cancel();
            this.isPlaying = false;
        }
    }

    /**
     * Pause speech
     */
    pause() {
        if (this.synth && this.synth.pause) {
            this.synth.pause();
        }
    }

    /**
     * Resume speech
     */
    resume() {
        if (this.synth && this.synth.resume) {
            this.synth.resume();
        }
    }

    /**
     * Play narration for stage
     */
    playStageNarration(stageId, voiceType = 'default') {
        const narration = this.getNarration(stageId);
        this.speak(narration.text, voiceType);
        return narration;
    }
}

// ============================================================================
// AMBIENT SOUND SYSTEM
// ============================================================================

class AmbientSoundSystem {
    constructor() {
        this.audioContext = null;
        this.oscillators = [];
        this.gainNodes = [];
        this.initAudioContext();
    }

    initAudioContext() {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            this.audioContext = new AudioContext();
        }
    }

    /**
     * Create ambient space sounds
     */
    createSpaceAmbience() {
        if (!this.audioContext) return;

        const now = this.audioContext.currentTime;
        const duration = 5;

        // Low frequency throb (solar wind)
        const osc1 = this.audioContext.createOscillator();
        const gain1 = this.audioContext.createGain();

        osc1.frequency.setValueAtTime(40, now);
        osc1.frequency.exponentialRampToValueAtTime(50, now + duration);
        
        gain1.gain.setValueAtTime(0.1, now);
        gain1.gain.exponentialRampToValueAtTime(0.01, now + duration);

        osc1.connect(gain1);
        gain1.connect(this.audioContext.destination);

        osc1.start(now);
        osc1.stop(now + duration);

        // Mid frequency shimmer
        const osc2 = this.audioContext.createOscillator();
        const gain2 = this.audioContext.createGain();

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(120, now);
        
        gain2.gain.setValueAtTime(0.05, now);
        gain2.gain.exponentialRampToValueAtTime(0.02, now + duration);

        osc2.connect(gain2);
        gain2.connect(this.audioContext.destination);

        osc2.start(now);
        osc2.stop(now + duration);
    }

    /**
     * Create aurora sound (ethereal tones)
     */
    createAuroraSound() {
        if (!this.audioContext) return;

        const now = this.audioContext.currentTime;
        const duration = 8;

        // Create harmonic progression
        const frequencies = [432, 528, 639, 741];

        frequencies.forEach((freq, index) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);

            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.08, now + 1);
            gain.gain.linearRampToValueAtTime(0.08, now + duration - 1);
            gain.gain.linearRampToValueAtTime(0, now + duration);

            osc.connect(gain);
            gain.connect(this.audioContext.destination);

            osc.start(now + (index * 0.5));
            osc.stop(now + duration);
        });
    }

    /**
     * Create technological warning sound
     */
    createWarningSound() {
        if (!this.audioContext) return;

        const now = this.audioContext.currentTime;

        // Quick ascending beep
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.2);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0, now + 0.3);

        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        osc.start(now);
        osc.stop(now + 0.3);
    }

    /**
     * Create particle collision sound
     */
    createCollisionSound(intensity = 1) {
        if (!this.audioContext) return;

        const now = this.audioContext.currentTime;
        const duration = 0.2;

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.frequency.setValueAtTime(2000 * intensity, now);
        osc.frequency.exponentialRampToValueAtTime(400 * intensity, now + duration);

        gain.gain.setValueAtTime(0.15 * intensity, now);
        gain.gain.exponentialRampToValueAtTime(0, now + duration);

        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        osc.start(now);
        osc.stop(now + duration);
    }
}

// ============================================================================
// INTEGRATION WITH TOUR
// ============================================================================

// Global instances
let narrationSystem;
let ambientSoundSystem;

document.addEventListener('DOMContentLoaded', () => {
    narrationSystem = new AIZarrationSystem();
    ambientSoundSystem = new AmbientSoundSystem();
});

/**
 * Play narration for current stage
 */
function playStageNarration(stageId) {
    if (narrationSystem && narrationSystem.enabledVoices.default) {
        narrationSystem.playStageNarration(stageId);
    }
}

/**
 * Stop all audio
 */
function stopAllAudio() {
    if (narrationSystem) {
        narrationSystem.stop();
    }
}
