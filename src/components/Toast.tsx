'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ToastProps {
    message: string;
    isVisible: boolean;
    onClose: () => void;
}

const DURATION = 2500;

export default function Toast({ message, isVisible, onClose }: ToastProps) {
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(onClose, DURATION);
            return () => clearTimeout(timer);
        }
    }, [isVisible, onClose]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: -24, scale: 0.88 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -16, scale: 0.92, transition: { duration: 0.22, ease: 'easeIn' } }}
                    transition={{ type: 'spring', stiffness: 480, damping: 28, mass: 0.8 }}
                    className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] overflow-hidden rounded-2xl shadow-2xl"
                    style={{ filter: 'drop-shadow(0 8px 24px rgba(203,161,83,0.35))' }}
                >
                    {/* Glass body */}
                    <div className="relative flex items-center gap-3 px-5 py-3 bg-[#cba153] border border-black/10">

                        {/* Animated icon ring */}
                        <div className="relative shrink-0">
                            {/* pulsing ring */}
                            <motion.span
                                className="absolute inset-0 rounded-full bg-black/20"
                                initial={{ scale: 0.6, opacity: 0.9 }}
                                animate={{ scale: 1.9, opacity: 0 }}
                                transition={{ duration: 0.7, ease: 'easeOut' }}
                            />
                            <motion.div
                                className="relative w-7 h-7 rounded-full bg-black/15 flex items-center justify-center"
                                initial={{ scale: 0, rotate: -30 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: 'spring', stiffness: 600, damping: 22, delay: 0.05 }}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="3.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <motion.polyline
                                        points="20 6 9 17 4 12"
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{ duration: 0.35, ease: 'easeOut', delay: 0.15 }}
                                    />
                                </svg>
                            </motion.div>
                        </div>

                        <span className="font-bold text-black text-sm whitespace-nowrap">{message}</span>
                    </div>

                    {/* Progress bar */}
                    <motion.div
                        className="h-[3px] bg-black/25 origin-left"
                        initial={{ scaleX: 1 }}
                        animate={{ scaleX: 0 }}
                        transition={{ duration: DURATION / 1000, ease: 'linear' }}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
