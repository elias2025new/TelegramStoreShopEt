'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Megaphone, Video, Newspaper, ExternalLink } from 'lucide-react';

interface Announcement {
    id: string;
    title: string;
    content: string;
    type: 'announcement' | 'news' | 'vlog';
    media_url: string | null;
    created_at: string;
}

interface NotificationDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    notifications: Announcement[];
}

const getTypeIcon = (type: string) => {
    switch (type) {
        case 'vlog': return <Video size={16} className="text-blue-400" />;
        case 'news': return <Newspaper size={16} className="text-green-400" />;
        default: return <Megaphone size={16} className="text-[#cba153]" />;
    }
};

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

export default function NotificationDrawer({ isOpen, onClose, notifications }: NotificationDrawerProps) {
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
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 bottom-0 w-full max-w-[400px] bg-white dark:bg-[#0a0a0a] z-[101] shadow-2xl flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#cba153]/10 rounded-full">
                                    <Bell size={20} className="text-[#cba153]" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Notifications</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                            >
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar">
                            {notifications.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                                    <Bell size={48} className="mb-4 text-gray-300" />
                                    <p className="text-sm font-medium">Your inbox is empty</p>
                                    <p className="text-xs">We'll notify you when shop updates or new drops arrive!</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {notifications.map((notif) => (
                                        <motion.div
                                            key={notif.id}
                                            layout
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="group p-4 rounded-2xl bg-gray-50 dark:bg-[#151515] border border-gray-100 dark:border-gray-800/50 hover:border-[#cba153]/30 transition-all shadow-sm"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="p-1.5 bg-black/5 dark:bg-white/5 rounded-lg">
                                                        {getTypeIcon(notif.type)}
                                                    </div>
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                                        {notif.type}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] text-gray-400 font-medium">
                                                    {formatDate(notif.created_at)}
                                                </span>
                                            </div>

                                            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1 group-hover:text-[#cba153] transition-colors">
                                                {notif.title}
                                            </h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
                                                {notif.content}
                                            </p>

                                            {notif.media_url && (
                                                <a
                                                    href={notif.media_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-200/50 dark:bg-white/5 hover:bg-[#cba153]/10 rounded-lg text-[10px] font-bold text-gray-600 dark:text-[#cba153] transition-all"
                                                >
                                                    {notif.type === 'vlog' ? 'Watch Video' : 'Read More'}
                                                    <ExternalLink size={12} />
                                                </a>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
