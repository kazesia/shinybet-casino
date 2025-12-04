import { useCallback, useRef } from 'react';

interface SoundEffects {
    click: () => void;
    win: () => void;
    loss: () => void;
    reveal: () => void;
    cashout: () => void;
    bet: () => void;
}

export function useSound(): SoundEffects {
    const audioContextRef = useRef<AudioContext | null>(null);

    const getAudioContext = useCallback(() => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        return audioContextRef.current;
    }, []);

    const playNote = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.1) => {
        try {
            const ctx = getAudioContext();
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.frequency.value = frequency;
            oscillator.type = type;

            const now = ctx.currentTime;
            const attack = 0.01;
            const release = 0.05;

            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(volume, now + attack);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration + release);

            oscillator.start(now);
            oscillator.stop(now + duration + release + 0.1);
        } catch (error) {
            console.warn('Sound playback failed:', error);
        }
    }, [getAudioContext]);

    const click = useCallback(() => {
        // Crisp, short click
        playNote(1200, 0.03, 'sine', 0.05);
        setTimeout(() => playNote(2000, 0.01, 'triangle', 0.02), 10);
    }, [playNote]);

    const win = useCallback(() => {
        // Major chord arpeggio with sparkle
        const now = 0;
        const volume = 0.1;
        setTimeout(() => playNote(523.25, 0.2, 'sine', volume), 0);   // C5
        setTimeout(() => playNote(659.25, 0.2, 'sine', volume), 100); // E5
        setTimeout(() => playNote(783.99, 0.4, 'sine', volume), 200); // G5
        setTimeout(() => playNote(1046.50, 0.6, 'triangle', volume * 0.8), 300); // C6
    }, [playNote]);

    const loss = useCallback(() => {
        // Descending tone
        playNote(300, 0.3, 'sawtooth', 0.05);
        setTimeout(() => playNote(200, 0.4, 'sawtooth', 0.05), 200);
    }, [playNote]);

    const reveal = useCallback(() => {
        playNote(800, 0.1, 'sine', 0.05);
    }, [playNote]);

    const cashout = useCallback(() => {
        // Success sound
        playNote(880, 0.1, 'sine', 0.1);
        setTimeout(() => playNote(1760, 0.2, 'sine', 0.1), 100);
    }, [playNote]);

    const bet = useCallback(() => {
        // Coin sound
        playNote(1200, 0.05, 'sine', 0.05);
        setTimeout(() => playNote(1600, 0.1, 'sine', 0.03), 30);
    }, [playNote]);

    return {
        click,
        win,
        loss,
        reveal,
        cashout,
        bet
    };
}
