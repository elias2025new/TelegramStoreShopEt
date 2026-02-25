'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DeleteConfirmModalProps {
    isOpen: boolean;
    productName: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function DeleteConfirmModal({
    isOpen,
    productName,
    onConfirm,
    onCancel,
}: DeleteConfirmModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
                        onClick={onCancel}
                    />

                    {/* Modal */}
                    <motion.div
                        key="modal"
                        initial={{ opacity: 0, scale: 0.85, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.85, y: 20 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 28, mass: 0.8 }}
                        className="fixed inset-x-0 bottom-0 z-[101] flex items-end justify-center px-4 pb-8"
                        style={{ pointerEvents: 'none' }}
                    >
                        <div
                            className="w-full max-w-sm rounded-[28px] overflow-hidden"
                            style={{ pointerEvents: 'auto' }}
                        >
                            {/* Card */}
                            <div className="bg-[#111111] border border-white/10 rounded-[28px] shadow-[0_24px_60px_rgba(0,0,0,0.8)]">
                                {/* Top section */}
                                <div className="px-6 pt-8 pb-6 flex flex-col items-center text-center">
                                    {/* Icon circle */}
                                    <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
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
                                            className="text-red-400"
                                        >
                                            <path d="M3 6h18" />
                                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                        </svg>
                                    </div>

                                    <h2 className="text-white text-[17px] font-bold mb-1 leading-snug">
                                        Remove Item?
                                    </h2>
                                    <p className="text-gray-400 text-[13px] leading-relaxed">
                                        <span className="text-white/80 font-medium">{productName}</span>
                                        {' '}will be removed from your cart.
                                    </p>
                                </div>

                                {/* Divider */}
                                <div className="h-px bg-white/[0.07] mx-0" />

                                {/* Buttons */}
                                <div className="flex">
                                    <button
                                        onClick={onCancel}
                                        className="flex-1 py-4 text-[15px] font-medium text-gray-300 active:bg-white/5 transition-colors rounded-bl-[28px]"
                                    >
                                        Keep It
                                    </button>

                                    {/* Vertical divider */}
                                    <div className="w-px bg-white/[0.07]" />

                                    <button
                                        onClick={onConfirm}
                                        className="flex-1 py-4 text-[15px] font-bold text-red-400 active:bg-white/5 transition-colors rounded-br-[28px]"
                                    >
                                        Remove
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
