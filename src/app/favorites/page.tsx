'use client';

import React from 'react';
import { useFavorites } from '@/context/FavoritesContext';
import ProductCard from '@/components/ProductCard';
import PageTransition from '@/components/PageTransition';
import Link from 'next/link';

export default function FavoritesPage() {
    const { favorites } = useFavorites();

    return (
        <PageTransition>
            <main className="min-h-screen bg-black pb-36 font-sans">
                {/* Header */}
                <header
                    className="sticky top-0 z-50 bg-black/80 backdrop-blur-md px-6 flex items-center justify-between"
                    style={{
                        paddingTop: 'calc(1.75rem + var(--tg-safe-area-inset-top, 0px) + var(--tg-content-safe-area-inset-top, 0px))',
                        paddingBottom: '1rem'
                    }}
                >
                    <div className="flex items-center gap-3">
                        <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                                <path d="m15 18-6-6 6-6" />
                            </svg>
                        </Link>
                        <h1 className="text-xl font-bold text-[#cba153] font-serif tracking-wide">Favorites</h1>
                    </div>
                </header>

                <div className="px-6 mt-6">
                    {favorites.length === 0 ? (
                        <div className="flex flex-col items-center justify-center pt-24 text-center">
                            <div className="w-20 h-20 bg-[#1a1a1a] rounded-full flex items-center justify-center mb-6">
                                <img src="https://img.icons8.com/ios-filled/100/6b7280/hearts.png" alt="empty favorites" className="w-10 h-10 opacity-30" />
                            </div>
                            <h2 className="text-lg font-medium text-white mb-2">No Favorites Yet</h2>
                            <p className="text-gray-500 text-sm max-w-[240px]">
                                Items you heart will appear here for quick access later.
                            </p>
                            <Link href="/" className="mt-8 px-8 py-3 bg-[#cba153] text-black font-bold rounded-xl active:scale-95 transition-transform">
                                Go Shopping
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3 mt-4">
                            {favorites.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </PageTransition>
    );
}
