'use client';

import { useLayoutEffect, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

// Isomorphic layout effect to avoid SSR warnings
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export default function ScrollToTop() {
    const pathname = usePathname();
    const scrollPositions = useRef<Record<string, number>>({});

    // Active tracking: always listen for scroll and update the current path's position
    useEffect(() => {
        const handleScroll = () => {
            scrollPositions.current[pathname] = window.scrollY;
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [pathname]);

    // Restoration: when pathname changes, restore the saved position IMMEDIATELY
    useIsomorphicLayoutEffect(() => {
        const savedPosition = scrollPositions.current[pathname];

        if (savedPosition !== undefined) {
            // Synchronous restoration before paint to prevent flicker
            window.scrollTo({
                top: savedPosition,
                behavior: 'instant'
            });
        } else {
            // New page: scroll to top immediately
            window.scrollTo(0, 0);
        }
    }, [pathname]);

    return null;
}
