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

    const playTone = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine') => {
        try {
            const ctx = getAudioContext();
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.frequency.value = frequency;
            oscillator.type = type;

            gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + duration);
        } catch (error) {
            console.warn('Sound playback failed:', error);
        }
    }, [getAudioContext]);

    const click = useCallback(() => {
        playTone(800, 0.05, 'square');
    }, [playTone]);

    const win = useCallback(() => {
        const ctx = getAudioContext();
        const now = ctx.currentTime;

        // Ascending arpeggio
        playTone(523, 0.1, 'sine'); // C
        setTimeout(() => playTone(659, 0.1, 'sine'), 100); // E
        setTimeout(() => playTone(784, 0.2, 'sine'), 200); // G
    }, [getAudioContext, playTone]);

    const loss = useCallback(() => {
        playTone(200, 0.3, 'sawtooth');
    }, [playTone]);

    const reveal = useCallback(() => {
        playTone(1000, 0.08, 'sine');
    }, [playTone]);

    const cashout = useCallback(() => {
        const ctx = getAudioContext();
        playTone(880, 0.15, 'triangle');
        setTimeout(() => playTone(1046, 0.2, 'triangle'), 150);
    }, [getAudioContext, playTone]);

    const bet = useCallback(() => {
        playTone(440, 0.1, 'triangle');
    }, [playTone]);

    return {
        click,
        win,
        loss,
        reveal,
        cashout,
        bet
    };
}
