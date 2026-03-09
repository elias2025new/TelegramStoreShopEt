
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import Toast from '@/components/Toast';
import { Database } from '@/types/supabase';

type Product = Database['public']['Tables']['products']['Row'];

export interface CartItem {
    id: string; // Unique ID for the cart line item (e.g., prodId + size)
    product: Product;
    quantity: number;
    selectedSize?: string;
}

interface CartContextType {
    items: CartItem[];
    addToCart: (product: Product, quantity: number, selectedSize?: string) => void;
    removeFromCart: (cartItemId: string) => void;
    clearCart: () => void;
    totalItems: number;
    totalPrice: number;
    showToast: (message: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItem[]>(() => {
        // Lazy initialize from localStorage to avoid setState-in-effect
        if (typeof window === 'undefined') return [];
        try {
            const saved = localStorage.getItem('cart_items');
            const parsed = saved ? JSON.parse(saved) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    });
    const [toast, setToast] = useState({ message: '', isVisible: false });

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('cart_items', JSON.stringify(items));
    }, [items]);

    const showToast = useCallback((message: string) => {
        setToast({ message, isVisible: true });
    }, []);

    const hideToast = useCallback(() => {
        setToast(prev => ({ ...prev, isVisible: false }));
    }, []);

    const addToCart = (product: Product, quantity: number, selectedSize?: string) => {
        const cartItemId = selectedSize ? `${product.id}-${selectedSize}` : product.id;

        setItems((prev) => {
            const existing = prev.find((item) => item.id === cartItemId);
            if (existing) {
                return prev.map((item) =>
                    item.id === cartItemId
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            }
            return [...prev, { id: cartItemId, product, quantity, selectedSize }];
        });
        showToast(`Added to cart${selectedSize ? ` (${selectedSize})` : ''}`);
    };

    const removeFromCart = (cartItemId: string) => {
        setItems((prev) => prev.filter((item) => item.id !== cartItemId));
    };

    const clearCart = () => {
        setItems([]);
        localStorage.removeItem('cart_items');
    };

    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

    return (
        <CartContext.Provider value={{ items, addToCart, removeFromCart, clearCart, totalItems, totalPrice, showToast }}>
            {children}
            <Toast
                message={toast.message}
                isVisible={toast.isVisible}
                onClose={hideToast}
            />
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
