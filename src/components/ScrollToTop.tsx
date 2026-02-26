'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

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

    // Restoration: when pathname changes, restore the saved position
    useEffect(() => {
        const savedPosition = scrollPositions.current[pathname];

        if (savedPosition !== undefined) {
            // Use requestAnimationFrame to ensure the scroll happens after Next.js 
            // has processed the route change and potentially reset the scroll to 0.
            const restore = () => {
                window.scrollTo({
                    top: savedPosition,
                    behavior: 'instant'
                });
            };

            const frameId = requestAnimationFrame(restore);
            return () => cancelAnimationFrame(frameId);
        } else {
            // New page: scroll to top immediately
            window.scrollTo(0, 0);
        }
    }, [pathname]);

    return null;
}
