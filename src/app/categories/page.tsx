'use client';

import React from 'react';
import PageTransition from '@/components/PageTransition';
import Link from 'next/link';
import { supabase } from '@/utils/supabase/client';
import { CATEGORY_SUBCATEGORIES, CATEGORIES } from '@/constants/categories';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';

interface CatItem {
    name: string;
    parentCategory: string; // Display label (e.g. "Men Shoes" or "Men")
    gender: string; // Raw gender for URL (e.g. "Men")
    image: string;
}

async function fetchCategoryItems(): Promise<CatItem[]> {
    // Fetch products to use their images
    const { data: products } = await supabase
        .from('products')
        .select('image_url, category, gender, sub_subcategory')
        .order('created_at', { ascending: false });

    if (!products) return [];

    const items: CatItem[] = [];

    // Find all unique gender + category pairs from products
    const uniquePairs = new Set<string>();
    products.forEach(p => {
        if (p.gender && p.category) {
            const subSub = p.sub_subcategory || '';
            uniquePairs.add(`${p.gender}:${p.category}:${subSub}`);
        }
    });

    // Generate items for each unique pair found
    uniquePairs.forEach(pair => {
        const [gender, sub, subSub] = pair.split(':');

        // Find the best image
        const product = products.find(p =>
            p.gender === gender &&
            p.category === sub &&
            (p.sub_subcategory || '') === subSub
        );

        items.push({
            name: subSub || sub,
            parentCategory: subSub ? `${gender} ${sub}` : gender,
            gender: gender,
            image: product?.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=200&auto=format&fit=crop'
        });
    });

    // Sort items by parent category then name
    items.sort((a, b) => {
        if (a.parentCategory !== b.parentCategory) return a.parentCategory.localeCompare(b.parentCategory);
        return a.name.localeCompare(b.name);
    });

    return items;
}

export default function CategoriesPage() {
    const { data: catItems, isLoading } = useQuery({
        queryKey: ['categoryItems'],
        queryFn: fetchCategoryItems,
        staleTime: 10 * 60 * 1000, // 10 minutes
        gcTime: 30 * 60 * 1000, // 30 minutes
    });

    return (
        <PageTransition>
            <main className="min-h-screen bg-[#f8f9fa] dark:bg-black pb-36 font-sans transition-colors duration-300">
                {/* Header */}
                <header
                    className="sticky top-0 z-50 bg-[#f8f9fa]/80 dark:bg-black/80 backdrop-blur-md px-6 flex items-center justify-between border-b border-gray-200 dark:border-white/10 transition-colors duration-300"
                    style={{
                        marginTop: 'calc(-1 * (var(--tg-safe-area-inset-top, 0px) + var(--tg-content-safe-area-inset-top, 0px)))',
                        paddingTop: 'calc(1.75rem + var(--tg-safe-area-inset-top, 0px) + var(--tg-content-safe-area-inset-top, 0px))',
                        paddingBottom: '1rem'
                    }}
                >
                    <div className="flex items-center gap-3">
                        <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-900 dark:text-white">
                                <path d="m15 18-6-6 6-6" />
                            </svg>
                        </Link>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-[#cba153] font-serif tracking-wide">Collections</h1>
                    </div>
                </header>

                <div className="px-6 py-8">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 font-serif">Picks for You</h2>

                    <div className="grid grid-cols-3 gap-y-10 gap-x-4">
                        <AnimatePresence mode="popLayout">
                            {isLoading || !catItems ? (
                                [...Array(9)].map((_, i) => (
                                    <motion.div
                                        key={`skeleton-${i}`}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="flex flex-col items-center gap-2 animate-pulse"
                                    >
                                        <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-white/5" />
                                        <div className="w-16 h-3 bg-gray-100 dark:bg-white/5 rounded" />
                                    </motion.div>
                                ))
                            ) : (
                                catItems.map((item, idx) => (
                                    <motion.div
                                        key={`${item.gender}-${item.parentCategory}-${item.name}`}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{
                                            duration: 0.4,
                                            delay: idx * 0.05,
                                            ease: [0.22, 1, 0.36, 1]
                                        }}
                                    >
                                        <Link
                                            href={`/category/${item.gender}/${item.name}`}
                                            className="flex flex-col items-center gap-3 transition-transform active:scale-95 group"
                                        >
                                            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-transparent group-hover:border-[#cba153]/50 transition-colors shadow-lg shadow-black/5 dark:shadow-none">
                                                <img
                                                    src={item.image}
                                                    alt={item.name}
                                                    className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110"
                                                    loading="lazy"
                                                />
                                                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                                            </div>
                                            <span className="text-center text-[10px] sm:text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest leading-tight">
                                                {item.parentCategory} <br />
                                                <span className="text-[#cba153]">{item.name}</span>
                                            </span>
                                        </Link>
                                    </motion.div>
                                ))
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Section for main Categories if they want to browse broad */}
                <div className="px-6 mt-12 mb-12 border-t border-gray-100 dark:border-white/5 pt-10">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 font-serif">Shop by Category</h2>
                    <div className="space-y-4">
                        {CATEGORIES.filter(c => c.name !== 'All').map((cat) => (
                            <Link
                                key={cat.name}
                                href={`/?category=${cat.name}`}
                                className="flex items-center justify-between p-5 bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/5 rounded-3xl active:scale-[0.98] transition-all hover:border-[#cba153]/30"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gray-50 dark:bg-[#1a1a1a] rounded-2xl flex items-center justify-center border border-gray-100 dark:border-[#1a1a1a]">
                                        <img
                                            src={`https://img.icons8.com/ios-filled/50/cba153/${cat.icon}.png`}
                                            alt={cat.name}
                                            className="w-6 h-6"
                                        />
                                    </div>
                                    <div>
                                        <h3 className="text-gray-900 dark:text-white font-bold text-base">{cat.name}</h3>
                                        <p className="text-gray-500 text-[10px] uppercase tracking-wider font-medium">Explore All {cat.name} Wear</p>
                                    </div>
                                </div>
                                <div className="text-[#cba153]">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </main>
        </PageTransition>
    );
}
