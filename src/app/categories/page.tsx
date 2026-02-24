'use client';

import React from 'react';
import PageTransition from '@/components/PageTransition';
import Link from 'next/link';

const CATEGORIES = [
    { name: 'New', icon: 'sparkling-diamond', desc: 'Fresh arrivals and limited drops' },
    { name: 'Men', icon: 'male', desc: 'Premium street and urban wear' },
    { name: 'Women', icon: 'female', desc: 'Chic, modern styles for her' },
    { name: 'Footwear', icon: 'shoes', desc: 'Hype sneakers and classic kicks' },
    { name: 'Accessories', icon: 'shopping-bag', desc: 'Bags, hats, and essentials' }
];

export default function CategoriesPage() {
    return (
        <PageTransition>
            <main className="min-h-screen bg-[#f8f9fa] dark:bg-black pb-36 font-sans transition-colors duration-300">
                {/* Header */}
                <header
                    className="sticky top-0 z-50 bg-[#f8f9fa]/80 dark:bg-black/80 backdrop-blur-md px-6 flex items-center justify-between border-b border-gray-200 dark:border-white/10 transition-colors duration-300"
                    style={{
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

                <div className="px-6 mt-6 space-y-4">
                    {CATEGORIES.map((cat) => (
                        <Link
                            key={cat.name}
                            href={`/?category=${cat.name}`}
                            className="flex items-center gap-4 p-4 bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/5 rounded-2xl active:scale-[0.98] transition-all hover:border-[#cba153]/30 shadow-sm dark:shadow-none"
                        >
                            <div className="w-14 h-14 bg-gray-50 dark:bg-[#1a1a1a] rounded-xl flex items-center justify-center border border-gray-100 dark:border-[#1a1a1a]">
                                <img
                                    src={`https://img.icons8.com/ios-filled/50/cba153/${cat.icon}.png`}
                                    alt={cat.name}
                                    className="w-8 h-8"
                                />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-gray-900 dark:text-white font-bold text-lg">{cat.name}</h3>
                                <p className="text-gray-500 text-xs">{cat.desc}</p>
                            </div>
                            <div className="text-gray-400 dark:text-gray-600">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                            </div>
                        </Link>
                    ))}
                </div>
            </main>
        </PageTransition>
    );
}
