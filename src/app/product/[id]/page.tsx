
'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase/client';
import { Database } from '@/types/supabase';
import Image from 'next/image';
import Link from 'next/link';
import { use, useState } from 'react';
import { useCart } from '@/context/CartContext';

type Product = Database['public']['Tables']['products']['Row'];

async function fetchProduct(id: string) {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data as Product;
}

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
    // Unwrap params using React.use() or await in async component
    // Since we are 'use client', we use 'use(params)'
    const { id } = use(params);
    const { addToCart } = useCart();

    const { data: product, isLoading, error } = useQuery({
        queryKey: ['product', id],
        queryFn: () => fetchProduct(id),
    });

    const [quantity, setQuantity] = useState(1);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white dark:bg-gray-950 p-4 animate-pulse">
                <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-lg w-full mb-4"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-gray-950 p-4 text-center">
                <p className="text-red-500 mb-4">Error loading product</p>
                <Link href="/" className="text-blue-600 hover:underline">
                    Back to Store
                </Link>
            </div>
        );
    }

    const handleAddToCart = () => {
        addToCart(product, quantity);

        if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
            window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
            window.Telegram.WebApp.showPopup({
                title: 'Added to Cart',
                message: `${quantity} x ${product.name} added.`,
                buttons: [{ type: 'ok' }]
            });
        } else {
            // Fallback for browser testing
            console.log(`${quantity} x ${product.name} added to cart!`);
        }
    };

    return (
        <main className="min-h-screen bg-white dark:bg-gray-950 pb-24">
            <div className="relative">
                <Link href="/" className="absolute top-4 left-4 z-10 p-2 bg-white/80 dark:bg-black/50 backdrop-blur rounded-full text-gray-800 dark:text-white shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m15 18-6-6 6-6" />
                    </svg>
                </Link>
                <div className="relative aspect-square w-full bg-gray-100 dark:bg-gray-900">
                    {product.image_url ? (
                        <Image
                            src={product.image_url}
                            alt={product.name}
                            fill
                            className="object-cover"
                            priority
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                            No Image
                        </div>
                    )}
                </div>
            </div>

            <div className="p-5 -mt-6 relative bg-white dark:bg-gray-950 rounded-t-3xl shadow-lg border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-start justify-between mb-2">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                            {product.name}
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {product.category}
                        </p>
                    </div>
                    <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                        {new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB' }).format(product.price)}
                    </p>
                </div>

                <div className="mt-6">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Description</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                        {product.description || "No description available."}
                    </p>
                </div>

                {/* Quantity Selector handled locally for now */}
                <div className="mt-8 flex items-center gap-4">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Quantity</span>
                    <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg">
                        <button
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className="p-2 px-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >-</button>
                        <span className="w-8 text-center font-medium">{quantity}</span>
                        <button
                            onClick={() => setQuantity(quantity + 1)}
                            className="p-2 px-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >+</button>
                    </div>
                </div>
            </div>

            {/* Persistent Bottom Bar */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800 max-w-md mx-auto">
                <button
                    onClick={handleAddToCart}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-blue-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="8" cy="21" r="1" />
                        <circle cx="19" cy="21" r="1" />
                        <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                    </svg>
                    Add to Cart
                </button>
            </div>
        </main>
    );
}
