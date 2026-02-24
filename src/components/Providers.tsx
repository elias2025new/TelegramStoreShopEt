
'use client';

import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Script from 'next/script';
import { CartProvider } from '@/context/CartContext';
import { AdminProvider } from '@/context/AdminContext';

export default function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient());

    useEffect(() => {
        // Basic Telegram WebApp initialization
        if (typeof window !== 'undefined') {
            import('@twa-dev/sdk').then((WebApp) => {
                const twa = WebApp.default;
                twa.ready();
                // Expand to fill full height
                twa.expand();
                // Request true fullscreen (covers top status bar too) — Telegram 8.0+
                try {
                    twa.requestFullscreen();
                } catch {
                    // Older Telegram clients don't support requestFullscreen, ignore
                }
                // Hide the back button so users don't see the Telegram back arrow
                twa.BackButton.hide();
            });
        }
    }, []);

    useEffect(() => {
        // Block horizontal page drift on empty areas.
        // We must use { passive: false } so preventDefault() is allowed.
        let startX = 0;
        let startY = 0;

        const onTouchStart = (e: TouchEvent) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        };

        const onTouchMove = (e: TouchEvent) => {
            const dx = Math.abs(e.touches[0].clientX - startX);
            const dy = Math.abs(e.touches[0].clientY - startY);

            // Only block if clearly a horizontal gesture
            if (dx <= dy) return;

            // Allow horizontal scroll for elements inside a legitimate x-scroller
            let el = e.target as Element | null;
            while (el && el !== document.body) {
                const style = window.getComputedStyle(el);
                const overflow = style.overflowX;
                if (
                    (overflow === 'auto' || overflow === 'scroll') &&
                    el.scrollWidth > el.clientWidth
                ) {
                    return; // inside a horizontal scroller — let it scroll
                }
                el = el.parentElement;
            }

            // No horizontal-scroll ancestor found — block the page from moving
            e.preventDefault();
        };

        document.addEventListener('touchstart', onTouchStart, { passive: true });
        document.addEventListener('touchmove', onTouchMove, { passive: false });

        return () => {
            document.removeEventListener('touchstart', onTouchStart);
            document.removeEventListener('touchmove', onTouchMove);
        };
    }, []);


    return (
        <QueryClientProvider client={queryClient}>
            <AdminProvider>
                <CartProvider>
                    <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
                    {children}
                </CartProvider>
            </AdminProvider>
        </QueryClientProvider>
    );
}
