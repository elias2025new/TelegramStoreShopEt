'use client';

import React from 'react';
import { Player } from '@remotion/player';
import { HowToPay } from '@/remotion/HowToPay';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, RotateCcw } from 'lucide-react';

interface VideoTutorialModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const VideoTutorialModal: React.FC<VideoTutorialModalProps> = ({ isOpen, onClose }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed border-b border-gray-100 dark:border-gray-800 inset-0 bg-black/80 backdrop-blur-sm z-[100]"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed border-b border-gray-100 dark:border-gray-800 inset-x-4 top-[10%] bottom-[10%] bg-white dark:bg-gray-900 rounded-3xl z-[101] overflow-hidden flex flex-col shadow-2xl max-w-md mx-auto"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">How to Pay</h3>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Telebirr Tutorial</p>
                            </div>
                            <button 
                                onClick={onClose}
                                className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Video Player Container */}
                        <div className="flex-1 bg-black relative flex items-center justify-center">
                            <Player
                                component={HowToPay}
                                durationInFrames={300}
                                compositionWidth={1080}
                                compositionHeight={1920}
                                fps={30}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    aspectRatio: '9/16',
                                }}
                                controls
                                loop
                                autoPlay
                            />
                        </div>

                        {/* Footer / Instructions Summary */}
                        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 space-y-3">
                            <div className="flex gap-3">
                                <div className="w-6 h-6 rounded-full bg-[#cba153] text-black text-[10px] font-black flex items-center justify-center shrink-0">1</div>
                                <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">Copy our phone number from the checkout page.</p>
                            </div>
                            <div className="flex gap-3">
                                <div className="w-6 h-6 rounded-full bg-[#cba153] text-black text-[10px] font-black flex items-center justify-center shrink-0">2</div>
                                <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">Send the payment in the Telebirr app.</p>
                            </div>
                            <div className="flex gap-3">
                                <div className="w-6 h-6 rounded-full bg-[#cba153] text-black text-[10px] font-black flex items-center justify-center shrink-0">3</div>
                                <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">Paste the confirmation SMS back here to verify.</p>
                            </div>
                        </div>

                        <button 
                            onClick={onClose}
                            className="m-4 bg-black dark:bg-white text-white dark:text-black font-black py-4 rounded-xl active:scale-95 transition-all text-sm uppercase tracking-widest"
                        >
                            Got it, I'm ready
                        </button>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
