import { useRef, useEffect, useCallback } from 'react';

interface TouchPosition {
    x: number;
    y: number;
}

interface SwipeHandlers {
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    onSwipeUp?: () => void;
    onSwipeDown?: () => void;
}

interface UseTouchGestureOptions extends SwipeHandlers {
    minSwipeDistance?: number;
    maxSwipeTime?: number;
}

export function useTouchGesture({
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    minSwipeDistance = 50,
    maxSwipeTime = 300,
}: UseTouchGestureOptions) {
    const touchStart = useRef<TouchPosition | null>(null);
    const touchEnd = useRef<TouchPosition | null>(null);
    const touchTime = useRef<number>(0);

    const handleTouchStart = useCallback((e: TouchEvent) => {
        touchEnd.current = null;
        touchStart.current = {
            x: e.targetTouches[0].clientX,
            y: e.targetTouches[0].clientY,
        };
        touchTime.current = Date.now();
    }, []);

    const handleTouchMove = useCallback((e: TouchEvent) => {
        touchEnd.current = {
            x: e.targetTouches[0].clientX,
            y: e.targetTouches[0].clientY,
        };
    }, []);

    const handleTouchEnd = useCallback(() => {
        if (!touchStart.current || !touchEnd.current) return;

        const timeDiff = Date.now() - touchTime.current;
        if (timeDiff > maxSwipeTime) return;

        const xDiff = touchStart.current.x - touchEnd.current.x;
        const yDiff = touchStart.current.y - touchEnd.current.y;

        const absX = Math.abs(xDiff);
        const absY = Math.abs(yDiff);

        // Determine if swipe is horizontal or vertical
        if (absX > absY) {
            // Horizontal swipe
            if (absX > minSwipeDistance) {
                if (xDiff > 0) {
                    onSwipeLeft?.();
                } else {
                    onSwipeRight?.();
                }
            }
        } else {
            // Vertical swipe
            if (absY > minSwipeDistance) {
                if (yDiff > 0) {
                    onSwipeUp?.();
                } else {
                    onSwipeDown?.();
                }
            }
        }

        touchStart.current = null;
        touchEnd.current = null;
    }, [minSwipeDistance, maxSwipeTime, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

    const attachListeners = useCallback((element: HTMLElement) => {
        element.addEventListener('touchstart', handleTouchStart, { passive: true });
        element.addEventListener('touchmove', handleTouchMove, { passive: true });
        element.addEventListener('touchend', handleTouchEnd);

        return () => {
            element.removeEventListener('touchstart', handleTouchStart);
            element.removeEventListener('touchmove', handleTouchMove);
            element.removeEventListener('touchend', handleTouchEnd);
        };
    }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

    return { attachListeners };
}
