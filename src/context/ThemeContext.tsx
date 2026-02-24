'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: (newTheme: Theme) => void;
}

// Default context value — so useTheme() never throws during SSR prerender
const ThemeContext = createContext<ThemeContextType>({
    theme: 'dark',
    toggleTheme: () => { },
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>('dark');

    // On mount, read localStorage and apply the stored theme class to <html>
    useEffect(() => {
        const stored = localStorage.getItem('theme') as Theme | null;
        const resolved = stored ?? 'dark';
        setTheme(resolved);
        document.documentElement.classList.toggle('dark', resolved === 'dark');
        document.documentElement.classList.toggle('light', resolved === 'light');
        document.documentElement.style.setProperty('color-scheme', resolved);
    }, []);

    const toggleTheme = (newTheme: Theme) => {
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
        document.documentElement.classList.toggle('light', newTheme === 'light');
        document.documentElement.style.setProperty('color-scheme', newTheme);

        if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
            window.Telegram.WebApp.setHeaderColor?.(newTheme === 'dark' ? '#000000' : '#ffffff');
            window.Telegram.WebApp.setBackgroundColor?.(newTheme === 'dark' ? '#000000' : '#ffffff');
        }
    };

    // Always render the Provider — no early return outside Provider
    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
