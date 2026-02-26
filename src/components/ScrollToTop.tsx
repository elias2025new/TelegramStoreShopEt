'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export default function ScrollToTop() {
    const pathname = usePathname();
    const scrollPositions = useRef<Record<string, number>>({});
    const lastPathname = useRef<string>(pathname);

    useEffect(() => {
        // Save current scroll position for the page we are LEAVING
        const currentPath = lastPathname.current;
        const currentScroll = window.scrollY;

        // Restore scroll position for the page we are ENTERING
        const savedPosition = scrollPositions.current[pathname];

        if (savedPosition !== undefined) {
            // Restore saved position
            window.scrollTo(0, savedPosition);
        } else {
            // Default to top for new pages
            window.scrollTo(0, 0);
        }

        // After restoring/scrolling, save the PREVIOUS page's position
        // so it doesn't get overwritten by the scroll reset
        scrollPositions.current[currentPath] = currentScroll;
        lastPathname.current = pathname;
    }, [pathname]);

    return null;
}
