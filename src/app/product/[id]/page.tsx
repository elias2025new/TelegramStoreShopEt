
'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase/client';
import { Database } from '@/types/supabase';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { use, useState, useCallback } from 'react';
import { useCart } from '@/context/CartContext';
import PageTransition from '@/components/PageTransition';
import CartIcon from '@/components/CartIcon';

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
    const router = useRouter();

    const handleBack = useCallback(() => {
        router.back();
    }, [router]);

    const { data: product, isLoading, error } = useQuery({
        queryKey: ['product', id],
        queryFn: () => fetchProduct(id),
    });

    const [quantity, setQuantity] = useState(1);
    const [isAdded, setIsAdded] = useState(false);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] p-4 animate-pulse">
                {/* Back button skeleton */}
                <div className="w-12 h-12 bg-[#1c1c1e] rounded-full mb-8"></div>
                {/* Main image skeleton */}
                <div className="h-[55vh] bg-[#111111] rounded-2xl w-full mb-6 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>
                {/* Content skeletons */}
                <div className="h-8 bg-[#1c1c1e] rounded-lg w-3/4 mb-4"></div>
                <div className="h-4 bg-[#1c1c1e] rounded-lg w-1/2 mb-8"></div>
                <div className="space-y-3">
                    <div className="h-4 bg-[#1c1c1e] rounded-lg w-full"></div>
                    <div className="h-4 bg-[#1c1c1e] rounded-lg w-full"></div>
                    <div className="h-4 bg-[#1c1c1e] rounded-lg w-4/5"></div>
                </div>
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
        setIsAdded(true);
        setTimeout(() => setIsAdded(false), 2000);

        if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
            // Optionally still show popup, but immediate visual feedback is better
            /*
            window.Telegram.WebApp.showPopup({
                title: 'Added to Cart',
                message: `${quantity} x ${product.name} added.`,
                buttons: [{ type: 'ok' }]
            });
            */
        }
    };

    return (
        <PageTransition>
            <main
                className="w-full bg-[#0a0a0a] flex flex-col overflow-hidden relative font-sans"
                style={{
                    height: 'calc(100vh - (var(--tg-safe-area-inset-top, 0px) + var(--tg-content-safe-area-inset-top, 0px)))'
                }}
            >
                {/* Top Bar for Back/Close Button */}
                <div className="absolute top-0 left-0 right-0 z-50 p-4 pt-safe flex items-center justify-between pointer-events-none">
                    <button
                        onClick={handleBack}
                        className="pointer-events-auto p-3 bg-black/40 backdrop-blur-md rounded-full text-white shadow-sm border border-white/10 hover:bg-black/60 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div className="pointer-events-auto p-3 bg-black/40 backdrop-blur-md rounded-full border border-white/10 hover:bg-black/60 transition-colors">
                        <CartIcon />
                    </div>
                </div>

                {/* Image Area - Fixed height proportion */}
                <div className="relative w-full h-[55vh] flex-shrink-0 bg-[#111111]">
                    {product.image_url ? (
                        <Image
                            src={product.image_url}
                            alt={product.name}
                            fill
                            className="object-cover object-center"
                            priority
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-600">
                            No Image
                        </div>
                    )}
                    {/* Gradient overlay to soften the transition to the bottom sheet */}
                    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
                </div>

                {/* Content Bottom Sheet - Fills remaining space, prevents scroll */}
                <div className="flex-1 -mt-6 relative bg-[#1c1c1e] rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-[#2a2a2a] flex flex-col overflow-hidden pb-safe">

                    {/* Dragger handle decoration */}
                    <div className="w-full flex justify-center pt-3 pb-1">
                        <div className="w-12 h-1.5 bg-white/20 rounded-full" />
                    </div>

                    <div className="p-6 flex-1 flex flex-col min-h-0">
                        {/* Header Info */}
                        <div className="flex items-start justify-between mb-2 flex-shrink-0">
                            <div className="pr-4">
                                <h1 className="text-xl font-bold text-white mb-1 line-clamp-2">
                                    {product.name}
                                </h1>
                                <p className="text-sm font-medium text-[#cba153]">
                                    {product.category}
                                </p>
                            </div>
                            <div className="flex flex-col items-end">
                                <p className="text-xl font-bold text-white whitespace-nowrap">
                                    {new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', maximumFractionDigits: 0 }).format(product.price)}
                                </p>
                                <div className="flex items-center mt-1">
                                    <span className="text-xs text-[#cba153]">★★★★</span>
                                    <span className="text-xs text-gray-600">★</span>
                                </div>
                            </div>
                        </div>

                        {/* Description - Allows internal scroll if absolutely necessary but ideally contained */}
                        <div className="mt-4 flex-1 min-h-0 overflow-y-auto scrollbar-hide">
                            <h3 className="text-sm font-medium text-gray-300 mb-2 uppercase tracking-wider text-[10px]">Description</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                {product.description || "Premium quality item. Designed for comfort and lasting style, perfectly crafted to fit your daily needs."}
                            </p>
                        </div>

                        {/* Footer Actions (Quantity & Add) - Fixed at bottom of sheet */}
                        <div className="mt-6 pt-4 border-t border-[#2a2a2a] flex items-center gap-4 flex-shrink-0">

                            {/* Quantity Pill */}
                            <div className="flex items-center bg-[#2a2a2a] rounded-full p-1 border border-white/5">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="w-10 h-10 flex items-center justify-center rounded-full text-white hover:bg-black/20 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /></svg>
                                </button>
                                <span className="w-8 text-center font-bold text-white text-lg">{quantity}</span>
                                <button
                                    onClick={() => setQuantity(quantity + 1)}
                                    className="w-10 h-10 flex items-center justify-center rounded-full text-white hover:bg-black/20 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                                </button>
                            </div>

                            {/* Add to Cart Button */}
                            <button
                                onClick={handleAddToCart}
                                disabled={isAdded}
                                className={`flex-1 font-extrabold text-[15px] h-12 rounded-full shadow-[0_4px_20px_rgba(203,161,83,0.3)] active:scale-95 transition-all flex items-center justify-center gap-2 ${isAdded
                                    ? 'bg-green-600 text-white shadow-[0_4px_20px_rgba(22,163,74,0.3)]'
                                    : 'bg-[#cba153] hover:bg-[#b8860b] text-black'
                                    }`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    {isAdded ? (
                                        <path d="M20 6L9 17L4 12" />
                                    ) : (
                                        <>
                                            <circle cx="8" cy="21" r="1" />
                                            <circle cx="19" cy="21" r="1" />
                                            <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                                        </>
                                    )}
                                </svg>
                                {isAdded ? 'ADDED!' : 'ADD TO CART'}
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </PageTransition>
    );
}
