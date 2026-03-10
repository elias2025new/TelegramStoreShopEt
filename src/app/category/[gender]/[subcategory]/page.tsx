
'use client';

import { use, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ProductGrid from '@/components/ProductGrid';
import PageTransition from '@/components/PageTransition';
import CartIcon from '@/components/CartIcon';
import { motion } from 'framer-motion';

export default function CategoryListingPage({ params }: { params: Promise<{ gender: string; subcategory: string }> }) {
    const { gender, subcategory } = use(params);
    const router = useRouter();

    const handleBack = useCallback(() => {
        router.back();
    }, [router]);

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
                        <button
                            onClick={handleBack}
                            className="p-2 -ml-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-900 dark:text-white">
                                <path d="m15 18-6-6 6-6" />
                            </svg>
                        </button>
                        <div>
                            <span className="text-[10px] font-bold text-[#cba153] uppercase tracking-widest block mb-0.5">{gender}</span>
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white font-serif tracking-wide">{decodeURIComponent(subcategory)}</h1>
                        </div>
                    </div>
                    <CartIcon />
                </header>

                <div className="mt-6">
                    <ProductGrid
                        selectedCategory={gender}
                        selectedSubcategory={decodeURIComponent(subcategory)}
                    />
                </div>
            </main>
        </PageTransition>
    );
}
