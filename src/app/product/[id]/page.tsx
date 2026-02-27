
'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase/client';
import { Database } from '@/types/supabase';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useState, useCallback } from 'react';
import { useCart } from '@/context/CartContext';
import PageTransition from '@/components/PageTransition';
import CartIcon from '@/components/CartIcon';
import { motion, AnimatePresence } from 'framer-motion';

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
            <div className="min-h-screen bg-gray-100 dark:bg-[#0a0a0a] p-4 animate-pulse">
                {/* Back button skeleton */}
                <div className="w-12 h-12 bg-gray-200 dark:bg-[#1c1c1e] rounded-full mb-8"></div>
                {/* Main image skeleton */}
                <div className="h-[55vh] bg-gray-200 dark:bg-[#111111] rounded-2xl w-full mb-6 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>
                {/* Content skeletons */}
                <div className="h-8 bg-gray-200 dark:bg-[#1c1c1e] rounded-lg w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 dark:bg-[#1c1c1e] rounded-lg w-1/2 mb-8"></div>
                <div className="space-y-3">
                    <div className="h-4 bg-gray-200 dark:bg-[#1c1c1e] rounded-lg w-full"></div>
                    <div className="h-4 bg-gray-200 dark:bg-[#1c1c1e] rounded-lg w-full"></div>
                    <div className="h-4 bg-gray-200 dark:bg-[#1c1c1e] rounded-lg w-4/5"></div>
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
            <main className="min-h-screen bg-gray-50 dark:bg-[#080808] text-gray-900 dark:text-white font-sans relative pb-32">
                {/* Dynamic Background Gradient - Only in Dark Mode */}
                <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_right,#1a1a1a,transparent_70%),radial-gradient(circle_at_bottom_left,#000,transparent_70%)] pointer-events-none hidden dark:block" />

                {/* Sticky Header with Glassmorphism */}
                <header
                    className="sticky top-0 z-50 bg-white/80 dark:bg-black/40 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/5 px-4 flex items-center justify-between transition-all duration-300"
                    style={{
                        paddingTop: 'calc(1rem + var(--tg-safe-area-inset-top, 0px))',
                        paddingBottom: '1rem'
                    }}
                >
                    <button
                        onClick={handleBack}
                        className="p-2.5 bg-gray-100 dark:bg-white/5 rounded-2xl text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-white/10 transition-all active:scale-90"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold text-[#cba153] uppercase tracking-[0.2em]">Product Details</span>
                    </div>
                    <div className="p-1 bg-gray-100 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10">
                        <CartIcon />
                    </div>
                </header>

                <div className="px-5 pt-6 space-y-8 relative z-10">
                    {/* Floating Product Image Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="relative group"
                    >
                        <motion.div
                            animate={{
                                y: [0, -8, 0],
                            }}
                            transition={{
                                duration: 4,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            className="relative"
                        >
                            <div className="absolute -inset-1 bg-gradient-to-r from-[#cba153]/20 to-transparent rounded-[32px] blur-xl opacity-50 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                            <div className="relative aspect-[4/5] w-full rounded-[30px] overflow-hidden bg-gray-100 dark:bg-[#111] border border-gray-200 dark:border-white/10 shadow-2xl">
                                {product.image_url ? (
                                    <Image
                                        src={product.image_url}
                                        alt={product.name}
                                        fill
                                        className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                                        priority
                                    />
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-600 gap-3">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
                                        <span className="text-xs font-medium uppercase tracking-widest">No Preview</span>
                                    </div>
                                )}
                                {/* Price Tag Overlay */}
                                <motion.div
                                    initial={{ x: 20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.5, duration: 0.5 }}
                                    className="absolute bottom-6 right-6 bg-black/60 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-white/20 shadow-xl"
                                >
                                    <p className="text-xl font-black text-white tracking-tight">
                                        {new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', maximumFractionDigits: 0 }).format(product.price)}
                                    </p>
                                </motion.div>
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* Product Info Section */}
                    <div className="space-y-6">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3, duration: 0.6 }}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <span className="px-3 py-1 bg-[#cba153]/10 text-[#cba153] text-[10px] font-black rounded-full border border-[#cba153]/20 uppercase tracking-wider">
                                    {product.category}
                                </span>
                                <div className="flex items-center gap-0.5 text-[#cba153]">
                                    {[...Array(5)].map((_, i) => (
                                        <svg key={i} xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill={i < 4 ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                                    ))}
                                </div>
                            </div>
                            <h1 className="text-3xl font-black text-gray-900 dark:text-white leading-tight mb-4 tracking-tight">
                                {product.name}
                            </h1>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, duration: 0.6 }}
                            className="space-y-3"
                        >
                            <h3 className="text-xs font-bold text-[#cba153] uppercase tracking-[0.2em]">The Description</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-[15px] leading-relaxed font-medium">
                                {product.description || "Indulge in the epitome of luxury and craftsmanship. Each piece is meticulously curated to bring an aura of sophistication and timeless elegance to your collection. Experience quality that resonates with your lifestyle."}
                            </p>
                        </motion.div>
                    </div>
                </div>

                {/* Floating Action Bar */}
                <motion.div
                    initial={{ y: 100 }}
                    animate={{ y: 0 }}
                    transition={{ delay: 0.7, type: "spring", damping: 20, stiffness: 100 }}
                    className="fixed bottom-0 left-0 right-0 p-6 z-[60] pointer-events-none"
                >
                    <div className="max-w-md mx-auto pointer-events-auto bg-white/95 dark:bg-[#161618]/90 backdrop-blur-2xl border border-gray-200 dark:border-white/10 p-3 rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-3">
                        {/* Quantity Pill */}
                        <div className="flex items-center bg-gray-100 dark:bg-black/40 rounded-2xl p-1 border border-gray-200 dark:border-white/5">
                            <button
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-400 dark:text-white/50 hover:text-gray-800 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/5 transition-all active:scale-90"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /></svg>
                            </button>
                            <span className="w-8 text-center font-bold text-gray-900 dark:text-white text-base">{quantity}</span>
                            <button
                                onClick={() => setQuantity(quantity + 1)}
                                className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-400 dark:text-white/50 hover:text-gray-800 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/5 transition-all active:scale-90"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                            </button>
                        </div>

                        {/* Add to Cart Button */}
                        <button
                            onClick={handleAddToCart}
                            disabled={isAdded}
                            className={`flex-1 h-12 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 ${isAdded
                                ? 'bg-green-600/20 text-green-400 border border-green-500/30'
                                : 'bg-[#cba153] hover:bg-[#b8860b] text-black shadow-[#cba153]/20'
                                }`}
                        >
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={isAdded ? "added" : "not-added"}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="flex items-center gap-2.5"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        {isAdded ? (
                                            <path d="M20 6L9 17L4 12" />
                                        ) : (
                                            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                                        )}
                                    </svg>
                                    {isAdded ? 'Bagged!' : 'Reserve Item'}
                                </motion.div>
                            </AnimatePresence>
                        </button>
                    </div>
                    {/* Safe area spacer for mobile */}
                    <div style={{ height: 'var(--tg-content-safe-area-inset-bottom, 0px)' }} />
                </motion.div>
            </main>
        </PageTransition>
    );
}
