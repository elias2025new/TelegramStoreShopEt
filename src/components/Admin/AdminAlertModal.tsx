'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminAlertModalProps {
    isOpen: boolean;
    type: 'alert' | 'confirm' | 'prompt';
    title: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    placeholder?: string;
    initialValue?: string;
    onConfirm: (value?: string) => void;
    onCancel: () => void;
    variant?: 'danger' | 'warning' | 'info' | 'success';
}

export default function AdminAlertModal({
    isOpen,
    type,
    title,
    description,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    placeholder = 'Type here...',
    initialValue = '',
    onConfirm,
    onCancel,
    variant = 'info'
}: AdminAlertModalProps) {
    const [inputValue, setInputValue] = useState(initialValue);

    useEffect(() => {
        if (isOpen) {
            setInputValue(initialValue);
        }
    }, [isOpen, initialValue]);

    const handleConfirm = () => {
        if (type === 'prompt') {
            onConfirm(inputValue);
        } else {
            onConfirm();
        }
    };

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
                        className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-md"
                        onClick={onCancel}
                    />

                    {/* Modal Container */}
                    <div className="fixed inset-0 z-[401] flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="w-full max-w-sm bg-[#1a1a1a] border border-white/10 rounded-3xl overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.8)] pointer-events-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Content */}
                            <div className="p-8 flex flex-col items-center text-center">
                                {/* Icon */}
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 rotate-3 border transition-all duration-500 hover:rotate-0 ${
                                    variant === 'danger' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                                    variant === 'warning' ? 'bg-orange-500/10 border-orange-500/20 text-orange-500' :
                                    variant === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                                    'bg-[#cba153]/10 border-[#cba153]/20 text-[#cba153]'
                                }`}>
                                    {variant === 'danger' && (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                                        </svg>
                                    )}
                                    {variant === 'warning' && (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="m12 9 4.7 9H7.3L12 9z" /><path d="M12 2v2" /><path d="m4.9 4.9 1.4 1.4" /><path d="M2 12h2" /><path d="m4.9 19.1 1.4-1.4" /><path d="M12 22v-2" /><path d="m19.1 19.1-1.4-1.4" /><path d="M22 12h-2" /><path d="m19.1 4.9-1.4 1.4" />
                                        </svg>
                                    )}
                                    {(variant === 'info' || variant === 'success') && type === 'prompt' && (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                        </svg>
                                    )}
                                    {(variant === 'info' || variant === 'success') && type !== 'prompt' && (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    )}
                                </div>

                                <h2 className="text-xl font-black text-white mb-2 uppercase tracking-tight">
                                    {title}
                                </h2>
                                {description && (
                                    <p className="text-gray-400 text-sm leading-relaxed mb-6">
                                        {description}
                                    </p>
                                )}

                                {type === 'prompt' && (
                                    <div className="w-full mt-2">
                                        <input
                                            autoFocus
                                            type="text"
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleConfirm();
                                                if (e.key === 'Escape') onCancel();
                                            }}
                                            placeholder={placeholder}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-base focus:ring-2 focus:ring-[#cba153]/50 focus:border-[#cba153] outline-none transition-all placeholder:text-gray-600"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-2 p-6 pt-0">
                                <button
                                    onClick={handleConfirm}
                                    className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all active:scale-[0.98] ${
                                        variant === 'danger' ? 'bg-red-500 text-white shadow-[0_8px_24px_rgba(239,68,68,0.3)]' :
                                        'bg-[#cba153] text-black shadow-[0_8px_24px_rgba(203,161,83,0.3)]'
                                    }`}
                                >
                                    {confirmText}
                                </button>
                                {type !== 'alert' && (
                                    <button
                                        onClick={onCancel}
                                        className="w-full py-4 rounded-2xl font-bold text-sm text-gray-400 hover:text-white transition-colors uppercase tracking-wider"
                                    >
                                        {cancelText}
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
