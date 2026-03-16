'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Database } from '@/types/supabase';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase/client';

type Product = Database['public']['Tables']['products']['Row'];

interface FavoritesContextType {
    favorites: Product[];
    toggleFavorite: (product: Product) => void;
    isFavorite: (productId: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
    const [favorites, setFavorites] = useState<Product[]>(() => {
        // Lazy initialize from localStorage to avoid setState-in-effect
        if (typeof window === 'undefined') return [];
        try {
            const stored = localStorage.getItem('favorites');
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });

    // Fetch all active products to sync favorites
    const { data: products } = useQuery({
        queryKey: ['products'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw new Error(error.message);
            return data as Product[];
        },
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });

    // Clean up favorites if a product was deleted
    useEffect(() => {
        if (products) {
            setFavorites((prev) => {
                const validFavorites = prev.filter((fav) => 
                    products.some((p) => p.id === fav.id)
                );
                // Only update state if there's a difference to avoid unnecessary renders
                if (validFavorites.length !== prev.length) {
                    return validFavorites;
                }
                return prev;
            });
        }
    }, [products]);

    // Sync state with localStorage whenever favorites change
    useEffect(() => {
        if (typeof window !== 'undefined') {
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
