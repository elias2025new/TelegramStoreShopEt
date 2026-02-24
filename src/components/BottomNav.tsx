'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAdmin } from '@/context/AdminContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function BottomNav() {
    const pathname = usePathname();
    const { adminOpen } = useAdmin();

    const tabs = [
        { name: 'Home', href: '/', icon: "home" },
        { name: 'Categories', href: '/categories', icon: "grid" },
        { name: 'Favorites', href: '/favorites', icon: "hearts" },
        { name: 'Profile', href: '/profile', icon: "user-male" },
    ];

    if (adminOpen || pathname === '/cart') return null;

    return (
        <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center pointer-events-none pb-14 px-6 will-change-transform">
            <div className="bg-[#0f1115]/95 backdrop-blur-2xl border border-white/10 rounded-[28px] px-1.5 py-1 shadow-[0_12px_40px_rgba(0,0,0,0.7)] transform-gpu pointer-events-auto w-full max-w-[310px]">
                <div className="flex items-center justify-around relative">
                    {tabs.map((tab) => {
                        const isActive = pathname === tab.href;
                        return (
                            <Link
                                key={tab.name}
                                href={tab.href}
                                className={`relative flex flex-col items-center justify-center py-2 px-4 rounded-2xl transition-colors duration-300 ${isActive ? 'text-[#cba153]' : 'text-gray-500 hover:text-gray-300'
                                    }`}
                                onClick={() => {
                                    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
                                        window.Telegram.WebApp.HapticFeedback.selectionChanged();
                                    }
                                }}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="nav-bg"
                                        className="absolute inset-0 bg-white/[0.05] rounded-[20px] -z-10"
                                        transition={{
                                            type: "spring",
                                            stiffness: 500,
                                            damping: 35,
                                            mass: 1
                                        }}
                                    />
                                )}

                                <div className="relative">
                                    <motion.img
                                        src={`https://img.icons8.com/ios-filled/50/${isActive ? 'cba153' : '6b7280'}/${tab.icon}.png`}
                                        alt={tab.name}
                                        animate={{
                                            scale: isActive ? 1.05 : 0.9,
                                            y: isActive ? -1 : 0
                                        }}
                                        className="w-5.5 h-5.5 z-10"
                                        transition={{
                                            type: "spring",
                                            stiffness: 400,
                                            damping: 25
                                        }}
                                    />

                                    {isActive && (
                                        <motion.div
                                            layoutId="nav-dot"
                                            className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0.5 h-0.5 rounded-full bg-[#cba153]"
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{
                                                type: "spring",
                                                stiffness: 500,
                                                damping: 30
                                            }}
                                        />
                                    )}
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
