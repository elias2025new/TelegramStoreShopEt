
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import Script from 'next/script';
import { CartProvider } from '@/context/CartContext';
import { AdminProvider } from '@/context/AdminContext';

export default function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient());

    useEffect(() => {
        // Basic Telegram WebApp initialization
        if (typeof window !== 'undefined') {
            import('@twa-dev/sdk').then((WebApp) => {
                WebApp.default.ready();
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
