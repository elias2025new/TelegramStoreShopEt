'use client';

import { useLayoutEffect, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

// Isomorphic layout effect to avoid SSR warnings
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

// Global map to persist scroll positions throughout the session
const globalScrollPositions: Record<string, number> = {};

export default function ScrollToTop() {
    const pathname = usePathname();

    // Active tracking: update the global map whenever the user scrolls
    useEffect(() => {
        const handleScroll = () => {
            globalScrollPositions[pathname] = window.scrollY;
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [pathname]);

    // Restoration logic: triggered immediately on pathname change
    useIsomorphicLayoutEffect(() => {
        const savedPosition = globalScrollPositions[pathname];

        // Restoration function
        const performScroll = (pos: number) => {
            window.scrollTo({
                top: pos,
                behavior: 'instant'
            });
        };

        if (savedPosition !== undefined && savedPosition > 0) {
            // 1. Immediate attempt (useLayoutEffect runs before paint)
            performScroll(savedPosition);

            // 2. Multi-frame safety net: browsers/Next.js can sometimes force a scroll 
            // after the initial mount of a route. We try again in the next frames.
            const raf1 = requestAnimationFrame(() => {
                performScroll(savedPosition);
                const raf2 = requestAnimationFrame(() => {
                    performScroll(savedPosition);
                });
                return () => cancelAnimationFrame(raf2);
            });

            return () => cancelAnimationFrame(raf1);
        } else {
            // For new pages (not in our map), always top-out
            window.scrollTo(0, 0);
        }
    }, [pathname]);

    return null;
}
