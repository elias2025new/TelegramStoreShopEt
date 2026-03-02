'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminConfirmModalProps {
    isOpen: boolean;
    title: string;
    description: string;
    confirmText: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    variant?: 'danger' | 'warning';
}

export default function AdminConfirmModal({
    isOpen,
    title,
    description,
    confirmText,
    cancelText = 'Cancel',
    onConfirm,
    onCancel,
    variant = 'danger'
}: AdminConfirmModalProps) {
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
                        className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md"
                        onClick={onCancel}
                    />

                    {/* Modal Container */}
                    <div className="fixed inset-0 z-[301] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="w-full max-w-sm bg-[#1a1a1a] border border-white/10 rounded-3xl overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.8)]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Content */}
                            <div className="p-8 flex flex-col items-center text-center">
                                {/* Icon */}
                                <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${variant === 'danger'
                                        ? 'bg-red-500/10 border border-red-500/20 text-red-500'
                                        : 'bg-[#cba153]/10 border border-[#cba153]/20 text-[#cba153]'
                                    }`}>
                                    {variant === 'danger' ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M3 6h18" />
                                            <path d="M19 6v14a0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                            <line x1="10" y1="11" x2="10" y2="17" />
                                            <line x1="14" y1="11" x2="14" y2="17" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="10" />
                                            <line x1="12" y1="8" x2="12" y2="12" />
                                            <line x1="12" y1="16" x2="12.01" y2="16" />
                                        </svg>
                                    )}
                                </div>

                                <h2 className="text-xl font-black text-white mb-3 uppercase tracking-tight">
                                    {title}
                                </h2>
                                <p className="text-gray-400 text-sm leading-relaxed px-2">
                                    {description}
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-2 p-4 pt-0">
                                <button
                                    onClick={() => {
                                        onConfirm();
                                        onCancel();
                                    }}
                                    className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all active:scale-[0.98] ${variant === 'danger'
                                            ? 'bg-red-500 text-white shadow-[0_8px_24px_rgba(239,68,68,0.3)]'
                                            : 'bg-[#cba153] text-black shadow-[0_8px_24px_rgba(203,161,83,0.3)]'
                                        }`}
                                >
                                    {confirmText}
                                </button>
                                <button
                                    onClick={onCancel}
                                    className="w-full py-4 rounded-2xl font-bold text-sm text-gray-500 hover:text-white transition-colors uppercase tracking-wider"
                                >
                                    {cancelText}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
