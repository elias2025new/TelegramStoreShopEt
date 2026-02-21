
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
