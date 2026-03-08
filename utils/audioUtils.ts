let audioContext: AudioContext | null = null;

export type SoundName = 'Bell' | 'Chime' | 'Digital' | 'None';

const getAudioContext = (): AudioContext | null => {
    if (typeof window !== 'undefined' && !audioContext) {
        try {
            // Standard and prefixed AudioContext for browser compatibility
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContext) {
                audioContext = new AudioContext();
            }
        } catch (e) {
            console.error("Web Audio API is not supported in this browser.", e);
            return null;
        }
    }
    return audioContext;
};

const playTone = (freq: number, duration: number, type: OscillatorType = 'sine') => {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Ensure context is running, especially after user interaction
    if (ctx.state === 'suspended') {
        ctx.resume();
    }

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.02); // Quick fade-in to prevent clicks

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(freq, ctx.currentTime);

    oscillator.start(ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration);
    oscillator.stop(ctx.currentTime + duration);
};

export const playBlockSound = () => {
    // A low, short "thud" to indicate a blocked action
    playTone(150, 0.15, 'square');
};

export const playSound = (sound: SoundName) => {
    if (sound === 'None') return;

    switch (sound) {
        case 'Bell':
            // A clear, medium-length tone
            playTone(880, 0.5, 'sine');
            break;
        case 'Chime':
             // A higher, shorter tone
            playTone(1046.50, 0.4, 'triangle');
            break;
        case 'Digital':
             // A short, sharp beep
            playTone(1500, 0.1, 'square');
            break;
        default:
            break;
    }
};
