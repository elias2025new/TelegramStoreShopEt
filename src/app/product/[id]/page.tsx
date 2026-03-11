
'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase/client';
import { Database } from '@/types/supabase';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useState, useCallback, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import PageTransition from '@/components/PageTransition';
import CartIcon from '@/components/CartIcon';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Ruler, Truck, Star } from 'lucide-react';

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
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [shakeSizeBtn, setShakeSizeBtn] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isImageLoading, setIsImageLoading] = useState(true);

    // Update selectedImage when product data arrives
    useEffect(() => {
        if (product?.image_url) {
            setSelectedImage(product.image_url);
            setIsImageLoading(true);
        }
    }, [product]);

    // Telegram Back Button Integration
    useEffect(() => {
        if (typeof window !== 'undefined') {
            import('@twa-dev/sdk').then((WebApp) => {
                const twa = WebApp.default;
                twa.BackButton.show();
                twa.BackButton.onClick(handleBack);
            });
        }
        return () => {
            if (typeof window !== 'undefined') {
                import('@twa-dev/sdk').then((WebApp) => {
                    const twa = WebApp.default;
                    twa.BackButton.hide();
                    twa.BackButton.offClick(handleBack);
                });
            }
        };
    }, [handleBack]);



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

    const SIZES = product.sizes && product.sizes.length > 0 ? product.sizes : [];


    const handleAddToCart = () => {
        if (!selectedSize && SIZES.length > 0 && product.gender !== 'Accessories') {
            // Shake the size section
            setShakeSizeBtn(true);
            setTimeout(() => setShakeSizeBtn(false), 600);
            if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
                window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
            }
            return;
        }

        addToCart(product, quantity, selectedSize ?? undefined);
        setIsAdded(true);
        setTimeout(() => setIsAdded(false), 2000);

        if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }
    };

    return (
        <PageTransition>
            <main className="min-h-screen bg-white dark:bg-[#050505] text-gray-900 dark:text-white font-sans relative pb-32">
                {/* Dynamic Background Gradient - Luxury feel */}
                <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_right,rgba(203,161,83,0.05),transparent_60%)] pointer-events-none" />
                <div className="fixed inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(0,0,0,0.05),transparent_60%)] pointer-events-none dark:hidden" />
                <div className="fixed inset-0 bg-[radial-gradient(circle_at_bottom_left,#000,transparent_70%)] pointer-events-none hidden dark:block" />

                {/* Refined Fixed Header */}
                <header
                    className="fixed top-0 left-0 right-0 z-50 bg-white/70 dark:bg-black/40 backdrop-blur-2xl px-4 flex items-center justify-between transition-all duration-300"
                    style={{
                        paddingTop: 'calc(2.2rem + var(--tg-safe-area-inset-top, 0px))',
                        paddingBottom: '0.6rem'
                    }}
                >
                    <div className="flex items-center gap-1">
                        <CartIcon />
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] font-black text-[#cba153] uppercase tracking-[0.2em]">Product Details</span>
                    </div>
                    {/* Spacer to keep title centered since back button is now native Telegram one */}
                    <div className="w-10" />
                </header>

                <div className="px-6 space-y-4 relative z-10"
                    style={{
                        paddingTop: 'calc(0.5rem + var(--tg-safe-area-inset-top, 0px))'
                    }}
                >
                    {/* Immersive Product Image */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                        className="relative"
                    >
                        <motion.div
                            animate={{
                                y: [0, -6, 0],
                            }}
                            transition={{
                                duration: 5,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            className="relative group "
                        >
                            {/* Glow effect */}
                            <div className="absolute inset-x-8 -bottom-4 h-12 bg-[#cba153]/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>

                            <div className="relative aspect-[10/9] w-full rounded-[32px] overflow-hidden bg-gray-50 dark:bg-[#0a0a0a] border border-gray-100 dark:border-white/[0.03] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)]">
                                {selectedImage ? (
                                    <>
                                        <Image
                                            src={selectedImage}
                                            alt={product.name}
                                            fill
                                            className={`object-cover object-center transition-all duration-500 ${isImageLoading ? 'blur-xl scale-110 opacity-50' : 'blur-0 scale-100 opacity-100'}`}
                                            priority
                                            onLoad={() => setIsImageLoading(false)}
                                        />
                                        {isImageLoading && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-8 h-8 border-2 border-[#cba153] border-t-transparent rounded-full animate-spin"></div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-300 dark:text-white/10 gap-3">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
                                    </div>
                                )}

                            </div>
                        </motion.div>
                    </motion.div>

                    {/* Additional Images Thumbnails */}
                    {product.additional_images && Array.isArray(product.additional_images) && product.additional_images.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3, duration: 0.8 }}
                            className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-6 px-6 relative z-20"
                        >
                            {/* Main image thumbnail */}
                            <button
                                onClick={() => {
                                    if (selectedImage !== product.image_url) {
                                        setSelectedImage(product.image_url);
                                        setIsImageLoading(true);
                                    }
                                }}
                                className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${selectedImage === product.image_url ? 'border-[#cba153] scale-105' : 'border-transparent opacity-60'}`}
                            >
                                <img src={product.image_url || ''} alt="main" className="w-full h-full object-cover" />
                            </button>
                            {/* Additional images thumbnails */}
                            {product.additional_images.map((url, i) => url && (
                                <button
                                    key={i}
                                    onClick={() => {
                                        if (selectedImage !== url) {
                                            setSelectedImage(url);
                                            setIsImageLoading(true);
                                        }
                                    }}
                                    className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${selectedImage === url ? 'border-[#cba153] scale-105' : 'border-transparent opacity-60'}`}
                                >
                                    <img src={url} alt={`extra-${i}`} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </motion.div>
                    )}

                    {/* Content Section */}
                    <div className="space-y-8 pb-10">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.8 }}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 bg-[#cba153] dark:bg-[#cba153]/10 text-white dark:text-[#cba153] text-[8px] font-black rounded-md uppercase tracking-widest">
                                        {product.category || 'Luxury'}
                                    </span>
                                    <div className="flex items-center gap-1 text-[#cba153]">
                                        <Star size={10} fill="currentColor" />
                                        <span className="text-[10px] font-bold">4.9</span>
                                    </div>
                                </div>
                                <p className="text-lg font-black text-black dark:text-white tracking-tighter">
                                    {new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', maximumFractionDigits: 0 }).format(product.price)}
                                </p>
                            </div>

                            {/* Horizontal Size Selector - Moved higher for better access */}
                            {SIZES.length > 0 && product.gender !== 'Accessories' && (
                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="w-4 h-px bg-[#cba153]"></span>
                                            <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Select Size</h3>
                                        </div>
                                        {selectedSize && (
                                            <span className="text-[9px] font-bold text-[#cba153] uppercase tracking-wider">Choice: {selectedSize}</span>
                                        )}
                                    </div>

                                    <motion.div
                                        animate={shakeSizeBtn ? { x: [0, -10, 10, -10, 10, 0] } : {}}
                                        transition={{ duration: 0.5 }}
                                        className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-2 px-2"
                                    >
                                        {SIZES.map((size) => (
                                            <button
                                                key={size}
                                                onClick={() => setSelectedSize(selectedSize === size ? null : size)}
                                                className={`shrink-0 min-w-[40px] h-8 flex items-center justify-center rounded-lg border text-[11px] font-black uppercase tracking-wide transition-all duration-200 active:scale-90 ${selectedSize === size
                                                    ? 'bg-[#cba153] border-[#cba153] text-white shadow-lg shadow-[#cba153]/25 scale-105'
                                                    : 'bg-gray-50 dark:bg-white/[0.04] border-gray-100 dark:border-white/[0.08] text-gray-500 dark:text-white/50'
                                                    }`}
                                            >
                                                {size}
                                            </button>
                                        ))}
                                    </motion.div>
                                </div>
                            )}

                            {/* Title Section - More compact font sizes */}
                            <div className="flex flex-col gap-0.5 mb-2">
                                <h1 className="text-xl font-black text-gray-900 dark:text-white leading-tight tracking-tight">
                                    {product.name}
                                </h1>
                                <p className="text-[#cba153] text-[10px] font-bold tracking-widest uppercase opacity-80">Premium Edition</p>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4, duration: 0.8 }}
                            className="space-y-2"
                        >
                            <div className="flex items-center gap-2">
                                <span className="w-6 h-px bg-[#cba153]"></span>
                                <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Essence</h3>
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm leading-[1.5] font-normal">
                                {product.description || "A masterpiece of contemporary design, this piece embodies the peak of luxury. Meticulously crafted from the finest materials to provide unparalleled comfort and style."}
                            </p>
                        </motion.div>

                        {/* Value Props */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6, duration: 0.8 }}
                            className="grid grid-cols-3 gap-3"
                        >
                            <div className="bg-gray-50 dark:bg-white/[0.02] p-2 rounded-2xl border border-gray-100 dark:border-white/[0.05] flex flex-col items-center text-center gap-1">
                                <div className="text-[#cba153]">
                                    <ShieldCheck size={14} />
                                </div>
                                <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">Verified</span>
                            </div>
                            <div className="bg-gray-50 dark:bg-white/[0.02] p-2 rounded-2xl border border-gray-100 dark:border-white/[0.05] flex flex-col items-center text-center gap-1">
                                <div className="text-[#cba153]">
                                    <Ruler size={14} />
                                </div>
                                <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">True Fit</span>
                            </div>
                            <div className="bg-gray-50 dark:bg-white/[0.02] p-2 rounded-2xl border border-gray-100 dark:border-white/[0.05] flex flex-col items-center text-center gap-1">
                                <div className="text-[#cba153]">
                                    <Truck size={14} />
                                </div>
                                <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">Priority</span>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Integration Action Bar */}
                <motion.div
                    initial={{ y: 100 }}
                    animate={{ y: 0 }}
                    transition={{ delay: 0.8, type: "spring", damping: 25, stiffness: 120 }}
                    className="fixed bottom-0 left-0 right-0 p-6 z-[60] pointer-events-none"
                >
                    <div className="max-w-md mx-auto pointer-events-auto bg-white/90 dark:bg-[#121212]/90 backdrop-blur-3xl border border-gray-200 dark:border-white/[0.08] p-2 rounded-[32px] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3)] flex items-center gap-2">
                        {/* Elegant Incremental */}
                        <div className="flex items-center bg-gray-50 dark:bg-white/[0.03] rounded-2xl h-14 px-1 border border-gray-100 dark:border-white/[0.05]">
                            <button
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                className="w-10 h-10 flex items-center justify-center text-gray-300 dark:text-white/30 hover:text-black dark:hover:text-white transition-colors"
                            >
                                <svg width="12" height="2" viewBox="0 0 12 2" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M11 1L1 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            </button>
                            <span className="w-6 text-center text-sm font-black tabular-nums">{quantity}</span>
                            <button
                                onClick={() => setQuantity(quantity + 1)}
                                className="w-10 h-10 flex items-center justify-center text-gray-300 dark:text-white/30 hover:text-black dark:hover:text-white transition-colors"
                            >
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M6 1V11M1 6H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            </button>
                        </div>

                        {/* Primary Action */}
                        <button
                            onClick={handleAddToCart}
                            disabled={isAdded}
                            className={`flex-1 h-14 rounded-2xl relative overflow-hidden group transition-all duration-500 active:scale-[0.97] ${isAdded
                                ? 'bg-green-500 text-white'
                                : 'bg-[#cba153] hover:bg-[#b8860b] text-white shadow-lg shadow-[#cba153]/20'
                                }`}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />

                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={isAdded ? "added" : "not-added"}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="relative z-10 flex items-center justify-center gap-3"
                                >
                                    {isAdded ? (
                                        <>
                                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M16.6666 5L7.49992 14.1667L3.33325 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Bagged!</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${(!selectedSize && SIZES.length > 0 && product.gender !== 'Accessories') ? 'text-white/60' : ''}`}>
                                                {(!selectedSize && SIZES.length > 0 && product.gender !== 'Accessories') ? 'Pick a Size First' : 'Reserve Item'}
                                            </span>
                                        </>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </button>
                    </div>
                    {/* Safe area spacer for mobile */}
                    <div style={{ height: 'var(--tg-content-safe-area-inset-bottom, 0px))' }} />
                </motion.div>
            </main>
        </PageTransition>
    );
}
