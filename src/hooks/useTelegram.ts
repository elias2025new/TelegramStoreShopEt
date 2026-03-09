'use client';

import { useCallback } from 'react';


/**
 * A custom hook to safely access the Telegram WebApp SDK.
 * Handles 'undefined' checks for SSR and provides helper methods.
 */
export function useTelegram() {
    const webApp =
        typeof window !== 'undefined' ? (window.Telegram?.WebApp ?? null) : null;

    const hapticFeedback = useCallback((type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error') => {
        if (!webApp) return;

        switch (type) {
            case 'success':
            case 'warning':
            case 'error':
                webApp.HapticFeedback.notificationOccurred(type);
                break;
            default:
                webApp.HapticFeedback.impactOccurred(type);
                break;
        }
    }, [webApp]);

    const showAlert = useCallback((message: string) => {
        webApp?.showAlert(message);
    }, [webApp]);

    const showConfirm = useCallback((message: string, callback: (ok: boolean) => void) => {
        webApp?.showConfirm(message, callback);
    }, [webApp]);

    return {
        webApp,
        user: webApp?.initDataUnsafe?.user,
        hapticFeedback,
        showAlert,
        showConfirm,
        isReady: !!webApp,
    };
}
