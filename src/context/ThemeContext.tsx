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
    const [theme, setTheme] = useState<Theme>(() => {
        // Initialize from localStorage directly to avoid setState-in-effect
        if (typeof window !== 'undefined') {
            return (localStorage.getItem('theme') as Theme) ?? 'dark';
        }
        return 'dark';
    });

    // On mount, apply the theme classes to <html> without calling setState
    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        document.documentElement.classList.toggle('light', theme === 'light');
        document.documentElement.style.setProperty('color-scheme', theme);
    }, [theme]);

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
