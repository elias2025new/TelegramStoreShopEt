
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import Toast from '@/components/Toast';
import { Database } from '@/types/supabase';

type Product = Database['public']['Tables']['products']['Row'];

export interface CartItem {
    product: Product;
    quantity: number;
}

interface CartContextType {
    items: CartItem[];
    addToCart: (product: Product, quantity: number) => void;
    removeFromCart: (productId: string) => void;
    clearCart: () => void;
    totalItems: number;
    totalPrice: number;
    showToast: (message: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [toast, setToast] = useState({ message: '', isVisible: false });

    const showToast = useCallback((message: string) => {
        setToast({ message, isVisible: true });
    }, []);

    const hideToast = useCallback(() => {
        setToast(prev => ({ ...prev, isVisible: false }));
    }, []);

    const addToCart = (product: Product, quantity: number) => {
        setItems((prev) => {
            const existing = prev.find((item) => item.product.id === product.id);
            if (existing) {
                return prev.map((item) =>
                    item.product.id === product.id
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            }
            return [...prev, { product, quantity }];
        });
        showToast(`Added ${quantity} item${quantity > 1 ? 's' : ''} to cart`);
    };

    const removeFromCart = (productId: string) => {
        setItems((prev) => prev.filter((item) => item.product.id !== productId));
    };

    const clearCart = () => {
        setItems([]);
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
