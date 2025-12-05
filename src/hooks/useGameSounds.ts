import { useCallback, useRef, useState } from 'react';

// Sound effect file paths - place your MP3 files in /public/sounds/
// You can replace these with your own sound files:
// - /public/sounds/win.mp3
// - /public/sounds/lose.mp3
// - /public/sounds/bet.mp3
// - /public/sounds/click.mp3
// - /public/sounds/cashout.mp3
// - /public/sounds/flip.mp3
// - /public/sounds/reveal.mp3
// - /public/sounds/explosion.mp3

const SOUND_URLS = {
    // Local files (place in public/sounds/)
    win: '/sounds/win.mp3',
    lose: '/sounds/lose.mp3',
    bet: '/sounds/bet.mp3',
    click: '/sounds/click.mp3',
    cashout: '/sounds/cashout.mp3',
    flip: '/sounds/flip.mp3',
    reveal: '/sounds/reveal.mp3',
    explosion: '/sounds/explosion.mp3',
};

export type SoundType = keyof typeof SOUND_URLS;

// Pre-loaded audio cache for better performance
const audioCache: { [key in SoundType]?: HTMLAudioElement } = {};

export function useGameSounds() {
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [volume, setVolume] = useState(0.5);
    const currentAudioRef = useRef<HTMLAudioElement | null>(null);

    const playSound = useCallback((soundType: SoundType) => {
        if (!soundEnabled) return;

        try {
            // Get or create cached audio element
            let audio = audioCache[soundType];

            if (!audio) {
                audio = new Audio(SOUND_URLS[soundType]);
                audioCache[soundType] = audio;
            }

            // Clone the audio to allow overlapping sounds
            const audioClone = audio.cloneNode() as HTMLAudioElement;
            audioClone.volume = volume;

            currentAudioRef.current = audioClone;

            audioClone.play().catch((error) => {
                // Silently fail if sound can't play (e.g., no file yet)
                console.log('Sound not available:', soundType);
            });
        } catch (e) {
            console.log('Sound playback error');
        }
    }, [soundEnabled, volume]);

    const toggleSound = useCallback(() => {
        setSoundEnabled(prev => !prev);
    }, []);

    const stopCurrentSound = useCallback(() => {
        if (currentAudioRef.current) {
            currentAudioRef.current.pause();
            currentAudioRef.current.currentTime = 0;
        }
    }, []);

    return {
        playSound,
        soundEnabled,
        setSoundEnabled,
        toggleSound,
        volume,
        setVolume,
        stopCurrentSound,
    };
}

export default useGameSounds;
