'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Database } from '@/types/supabase';

type Product = Database['public']['Tables']['products']['Row'];

interface FavoritesContextType {
    favorites: Product[];
    toggleFavorite: (product: Product) => void;
    isFavorite: (productId: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
    const [favorites, setFavorites] = useState<Product[]>([]);

    // Use localStorage only on the client side
    useEffect(() => {
        const stored = localStorage.getItem('favorites');
        if (stored) {
            try {
                setFavorites(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to parse favorites", e);
            }
        }
    }, []);

    // Sync state with localStorage whenever favorites change
    useEffect(() => {
        if (favorites.length > 0) {
            localStorage.setItem('favorites', JSON.stringify(favorites));
        } else {
            // If it's empty, we might actually want to clear it
            // but we need to distinguish between initial empty and manual clear
            // For simplicity, we just save whenever it changes.
            localStorage.setItem('favorites', JSON.stringify(favorites));
        }
    }, [favorites]);

    const toggleFavorite = (product: Product) => {
        setFavorites(prev => {
            const exists = prev.find(p => p.id === product.id);
            if (exists) {
                return prev.filter(p => p.id !== product.id);
            }
            return [...prev, product];
        });
    };

    const isFavorite = (productId: string) => {
        return favorites.some(p => p.id === productId);
    };

    return (
        <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite }}>
            {children}
        </FavoritesContext.Provider>
    );
}

export function useFavorites() {
    const context = useContext(FavoritesContext);
    if (context === undefined) {
        throw new Error('useFavorites must be used within a FavoritesProvider');
    }
    return context;
}
