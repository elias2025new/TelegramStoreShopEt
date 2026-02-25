'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LocationPermissionModalProps {
    isOpen: boolean;
    onAllow: () => void;
    onDismiss: () => void;
}

export default function LocationPermissionModal({
    isOpen,
    onAllow,
    onDismiss,
}: LocationPermissionModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        key="loc-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
                        onClick={onDismiss}
                    />

                    {/* Sheet */}
                    <motion.div
                        key="loc-modal"
                        initial={{ opacity: 0, y: 60 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 60 }}
                        transition={{ type: 'spring', stiffness: 360, damping: 30, mass: 0.8 }}
                        className="fixed inset-x-0 bottom-0 z-[101] flex items-end justify-center px-4 pb-8"
                        style={{ pointerEvents: 'none' }}
                    >
                        <div className="w-full max-w-sm" style={{ pointerEvents: 'auto' }}>
                            <div className="bg-[#111111] border border-white/10 rounded-[28px] shadow-[0_24px_60px_rgba(0,0,0,0.8)] overflow-hidden">

                                {/* Body */}
                                <div className="px-6 pt-8 pb-6 flex flex-col items-center text-center">
                                    {/* Icon */}
                                    <div className="w-16 h-16 rounded-full bg-[#cba153]/10 border border-[#cba153]/20 flex items-center justify-center mb-5">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="28"
                                            height="28"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="1.8"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="text-[#cba153]"
                                        >
                                            <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
                                            <circle cx="12" cy="10" r="3" />
                                        </svg>
                                    </div>

                                    <h2 className="text-white text-[18px] font-bold mb-2 leading-snug">
                                        Know Your Location
                                    </h2>
                                    <p className="text-gray-400 text-[13px] leading-relaxed max-w-[240px]">
                                        Allow <span className="text-white/80 font-semibold">Crown</span> to show
                                        your neighbourhood so you always know where you&apos;re shopping from.
                                    </p>
                                </div>

                                {/* Divider */}
                                <div className="h-px bg-white/[0.07]" />

                                {/* Buttons */}
                                <div className="flex">
                                    <button
                                        onClick={onDismiss}
                                        className="flex-1 py-4 text-[15px] font-medium text-gray-400 active:bg-white/5 transition-colors rounded-bl-[28px]"
                                    >
                                        Not Now
                                    </button>
                                    <div className="w-px bg-white/[0.07]" />
                                    <button
                                        onClick={onAllow}
                                        className="flex-1 py-4 text-[15px] font-bold text-[#cba153] active:bg-white/5 transition-colors rounded-br-[28px]"
                                    >
                                        Allow
                                    </button>
                                </div>

                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
