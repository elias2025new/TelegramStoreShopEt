'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/utils/supabase/client';
import { Bell, X, Megaphone, Newspaper, Video, ExternalLink, Clock } from 'lucide-react';

interface Announcement {
    id: string;
    created_at: string;
    title: string;
    content: string;
    type: 'announcement' | 'news' | 'vlog';
    media_url: string | null;
}

interface NotificationCenterProps {
    isOpen: boolean;
    onClose: () => void;
    onUnreadChange?: (count: number) => void;
}

const TYPE_ICONS = {
    announcement: Megaphone,
    news: Newspaper,
    vlog: Video,
};

const TYPE_COLORS = {
    announcement: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    news: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    vlog: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
};

export default function NotificationCenter({ isOpen, onClose, onUnreadChange }: NotificationCenterProps) {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [lastReadId, setLastReadId] = useState<string | null>(null);

    useEffect(() => {
        // Load last read state from localStorage
        const saved = localStorage.getItem('last_read_announcement');
        setLastReadId(saved);

        const fetchAnnouncements = async () => {
            const { data, error } = await supabase
                .from('announcements')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(20);

            if (!error && data) {
                setAnnouncements(data);
                
                // Calculate unread
                if (onUnreadChange) {
                    const latestId = data[0]?.id;
                    if (latestId && latestId !== saved) {
                        const unreadCount = data.findIndex(a => a.id === saved);
                        onUnreadChange(unreadCount === -1 ? data.length : unreadCount);
                    } else {
                        onUnreadChange(0);
                    }
                }
            }
            setIsLoading(false);
        };

        fetchAnnouncements();
    }, [onUnreadChange]);

    const handleMarkAsRead = () => {
        if (announcements.length > 0) {
            const latestId = announcements[0].id;
            localStorage.setItem('last_read_announcement', latestId);
            setLastReadId(latestId);
            if (onUnreadChange) onUnreadChange(0);
        }
    };

    useEffect(() => {
        if (isOpen) {
            handleMarkAsRead();
        }
    }, [isOpen]);

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
                        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
                    />

                    {/* Content Panel */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 bottom-0 z-[110] w-full max-w-[360px] bg-white dark:bg-[#0a0a0a] shadow-2xl flex flex-col pt-safe"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-2xl bg-[#cba153]/10">
                                    <Bell size={20} className="text-[#cba153]" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Updates</h2>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Store Broadcasts</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-3">
                                    <div className="w-8 h-8 border-2 border-[#cba153]/20 border-t-[#cba153] rounded-full animate-spin" />
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Checking for updates...</span>
                                </div>
                            ) : announcements.length === 0 ? (
                                <div className="text-center py-20 px-8">
                                    <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Bell size={24} className="text-gray-400" />
                                    </div>
                                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">No updates yet</h3>
                                    <p className="text-xs text-gray-500">We'll notify you when there's news or new collections!</p>
                                </div>
                            ) : (
                                announcements.map((item) => {
                                    const Icon = TYPE_ICONS[item.type];
                                    const isNew = item.id !== lastReadId && announcements.indexOf(item) < (announcements.findIndex(a => a.id === lastReadId) === -1 ? announcements.length : announcements.findIndex(a => a.id === lastReadId));
                                    
                                    return (
                                        <motion.div
                                            key={item.id}
                                            layout
                                            className="relative p-4 rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5 group"
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${TYPE_COLORS[item.type]}`}>
                                                    <Icon size={10} />
                                                    {item.type}
                                                </span>
                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400">
                                                    <Clock size={10} />
                                                    {new Date(item.created_at).toLocaleDateString()}
                                                </div>
                                            </div>

                                            <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-2 leading-tight">
                                                {item.title}
                                            </h4>
                                            
                                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
                                                {item.content}
                                            </p>

                                            {item.media_url && (
                                                <a
                                                    href={item.media_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-[11px] font-black text-gray-900 dark:text-white hover:border-[#cba153] transition-colors shadow-sm"
                                                >
                                                    <ExternalLink size={12} />
                                                    VIEW ATTACHMENT
                                                </a>
                                            )}
                                        </motion.div>
                                    );
                                })
                            )}
                        </div>
                        
                        {/* Footer Info */}
                        <div className="p-6 border-t border-gray-100 dark:border-white/5 text-center">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                &copy; {new Date().getFullYear()} Telegram Store Shop
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
