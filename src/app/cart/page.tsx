
'use client';

import { useCart } from '@/context/CartContext';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PageTransition from '@/components/PageTransition';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import { useState } from 'react';

export default function CartPage() {
    const { items, removeFromCart, totalPrice, clearCart } = useCart();
    const router = useRouter();

    const [isConfirmingClear, setIsConfirmingClear] = useState(false);

    const handleClearClick = () => {
        if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
            window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
        }
        setIsConfirmingClear(true);
    };

    const handleConfirmClear = () => {
        if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }
        clearCart();
        setIsConfirmingClear(false);
    };

    const handleCancelClear = () => {
        setIsConfirmingClear(false);
    };

    const handleDeleteItem = (id: string) => {
        if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
            window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
            window.Telegram.WebApp.showConfirm('Remove this item from cart?', (confirmed: boolean) => {
                if (confirmed) {
                    removeFromCart(id);
                    window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
                }
            });
        } else {
            if (confirm('Remove this item from cart?')) {
                removeFromCart(id);
            }
        }
    };

    const handleCheckout = () => {
        if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
            window.Telegram.WebApp.showAlert('Checkout is not available right now. We are working on it!');
        } else {
            alert('Checkout is not available right now. We are working on it!');
        }
    };

    if (items.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-gray-950 p-4 text-center">
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-900 rounded-full flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                        <circle cx="8" cy="21" r="1" />
                        <circle cx="19" cy="21" r="1" />
                        <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                    </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Your Cart is Empty</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6">Looks like you haven&apos;t added anything yet.</p>
                <Link href="/" className="bg-[#cba153] text-black px-6 py-3 rounded-xl font-bold active:scale-95 transition-transform shadow-[0_4px_15px_rgba(203,161,83,0.2)]">
                    Start Shopping
                </Link>
            </div>
        );
    }

    return (
        <PageTransition>
            <main className="min-h-[100dvh] bg-white dark:bg-gray-950 pb-40">
                <header className="sticky top-0 z-20 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center justify-between pt-[calc(0.75rem+var(--tg-safe-area-inset-top,0px)+var(--tg-content-safe-area-inset-top,0px))] transition-all duration-300">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors active:scale-90">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-700 dark:text-gray-200">
                                <path d="m15 18-6-6 6-6" />
                            </svg>
                        </Link>
                        <h1 className="text-lg font-bold text-gray-900 dark:text-white">Shopping Cart</h1>
                    </div>

                    {!isConfirmingClear ? (
                        <button
                            onClick={handleClearClick}
                            className="text-xs font-bold text-red-500 hover:text-red-600 bg-red-50 dark:bg-red-500/10 px-3 py-1.5 rounded-lg active:scale-95 transition-all flex items-center gap-1.5"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                            </svg>
                            CLEAR
                        </button>
                    ) : (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mr-1">Clear?</span>
                            <button
                                onClick={handleConfirmClear}
                                className="text-[10px] font-black bg-red-500 text-white px-3 py-1.5 rounded-md active:scale-90 transition-transform shadow-lg shadow-red-500/20"
                            >
                                YES
                            </button>
                            <button
                                onClick={handleCancelClear}
                                className="text-[10px] font-black bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-md active:scale-90 transition-transform"
                            >
                                NO
                            </button>
                        </div>
                    )}
                </header>

                <div className="p-4 flex flex-col gap-4">
                    {items.map((item) => (
                        <div key={item.id} className="flex gap-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
                            <div className="relative w-20 h-20 bg-white dark:bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                                {item.product.image_url ? (
                                    <Image src={item.product.image_url} alt={item.product.name} fill className="object-cover" />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-xs text-gray-400">No Img</div>
                                )}
                            </div>
                            <div className="flex-1 flex flex-col justify-between">
                                <div>
                                    <h3 className="font-medium text-gray-900 dark:text-white line-clamp-1">{item.product.name}</h3>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{item.quantity} x {new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', maximumFractionDigits: 0 }).format(item.product.price)}</p>
                                        {item.selectedSize && (
                                            <>
                                                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700"></span>
                                                <span className="text-[10px] font-bold text-[#cba153] uppercase tracking-wider bg-[#cba153]/10 px-1.5 py-0.5 rounded-md">Size: {item.selectedSize}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between mt-2">
                                    <span className="font-bold text-gray-900 dark:text-white">
                                        {new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', maximumFractionDigits: 0 }).format(item.product.price * item.quantity)}
                                    </span>
                                    <button
                                        onClick={() => handleDeleteItem(item.id)}
                                        className="text-red-500 hover:text-red-600 p-1 active:scale-90 transition-transform"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M3 6h18" />
                                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800 max-w-md mx-auto pb-safe">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-gray-500 dark:text-gray-400">Total</span>
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">
                            {new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', maximumFractionDigits: 0 }).format(totalPrice)}
                        </span>
                    </div>
                    <button
                        onClick={handleCheckout}
                        className="w-full bg-[#cba153] hover:bg-[#b8860b] text-black font-extrabold py-3.5 px-4 rounded-xl shadow-[0_4px_20px_rgba(203,161,83,0.3)] active:scale-[0.98] transition-all"
                    >
                        CHECKOUT NOW
                    </button>
                </div>
            </main>
        </PageTransition>
    );
}
