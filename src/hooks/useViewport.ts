import { useState, useEffect } from 'react';

interface ViewportSize {
    width: number;
    height: number;
}

interface ViewportState extends ViewportSize {
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    isTouch: boolean;
}

const BREAKPOINTS = {
    mobile: 768,
    tablet: 1024,
    desktop: 1280,
};

export function useViewport(): ViewportState {
    const [viewport, setViewport] = useState<ViewportSize>(() => ({
        width: typeof window !== 'undefined' ? window.innerWidth : 0,
        height: typeof window !== 'undefined' ? window.innerHeight : 0,
    }));

    const [isTouch] = useState(() => {
        if (typeof window === 'undefined') return false;
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    });

    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        const handleResize = () => {
            // Debounce resize events
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                setViewport({
                    width: window.innerWidth,
                    height: window.innerHeight,
                });
            }, 150);
        };

        window.addEventListener('resize', handleResize);

        // Initial call
        handleResize();

        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const isMobile = viewport.width < BREAKPOINTS.mobile;
    const isTablet = viewport.width >= BREAKPOINTS.mobile && viewport.width < BREAKPOINTS.tablet;
    const isDesktop = viewport.width >= BREAKPOINTS.desktop;

    return {
        ...viewport,
        isMobile,
        isTablet,
        isDesktop,
        isTouch,
    };
}
