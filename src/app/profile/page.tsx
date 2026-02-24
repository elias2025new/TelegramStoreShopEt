'use client';

import React, { useEffect, useState } from 'react';
import PageTransition from '@/components/PageTransition';
import { useTheme } from '@/context/ThemeContext';
import { Check, Moon, Sun, Monitor } from 'lucide-react';
import Image from 'next/image';
import { User as UserIcon } from 'lucide-react';

export default function ProfilePage() {
    const { theme, toggleTheme } = useTheme();
    const [userPhotoUrl, setUserPhotoUrl] = useState<string | null>(null);
    const [userName, setUserName] = useState<string>('Guest');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            import('@twa-dev/sdk').then((WebApp) => {
                if (WebApp.default.initDataUnsafe?.user) {
                    setUserPhotoUrl(WebApp.default.initDataUnsafe.user.photo_url || null);
                    setUserName(WebApp.default.initDataUnsafe.user.first_name || 'Guest');
                }
            }).catch(console.error);
        }
    }, []);

    return (
        <PageTransition>
            <main className="min-h-screen pb-36 font-sans transition-colors duration-300">
                {/* Header */}
                <header
                    className="sticky top-0 z-50 bg-[#f8f9fa]/80 dark:bg-black/80 backdrop-blur-md px-6 flex items-center justify-between border-b border-gray-200 dark:border-white/10 transition-colors duration-300"
                    style={{
                        paddingTop: 'calc(1.75rem + var(--tg-safe-area-inset-top, 0px) + var(--tg-content-safe-area-inset-top, 0px))',
                        paddingBottom: '1rem'
                    }}
                >
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white font-serif tracking-wide">Profile</h1>
                </header>

                <div className="px-5 mt-6 space-y-8">
                    {/* User Info Card */}
                    <div className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/5 rounded-3xl p-6 shadow-sm flex items-center gap-5 transition-colors duration-300">
                        <div className="w-20 h-20 rounded-full border-[3px] border-[#cba153] flex items-center justify-center overflow-hidden bg-gray-100 dark:bg-[#1a1a1a] shrink-0 shadow-md">
                            {userPhotoUrl ? (
                                <Image src={userPhotoUrl} alt="Profile" width={80} height={80} className="w-full h-full object-cover" />
                            ) : (
                                <UserIcon size={36} className="text-[#cba153]" />
                            )}
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-1 transition-colors duration-300">{userName}</h2>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#cba153]/10 text-[#cba153] text-[11px] font-bold rounded-full border border-[#cba153]/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#cba153]"></span>
                                Verified Member
                            </span>
                        </div>
                    </div>

                    {/* Settings Section */}
                    <div>
                        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-1">App Settings</h3>

                        <div className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm transition-colors duration-300">
                            {/* Appearance Setting */}
                            <div className="p-5">
                                <div className="mb-4 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                                        <Monitor size={16} className="text-blue-500 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">Appearance</h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Choose your preferred theme</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mt-4">
                                    <button
                                        onClick={() => toggleTheme('light')}
                                        className={`relative flex flex-col pt-5 pb-4 px-4 items-center gap-2 rounded-2xl border transition-all duration-200 ${theme === 'light'
                                                ? 'bg-blue-50/50 border-blue-200 dark:bg-[#1a1a1a] dark:border-[#cba153]'
                                                : 'bg-gray-50 border-gray-100 hover:bg-gray-100 dark:bg-[#161618] dark:border-[#222] dark:hover:bg-[#1c1c1e]'
                                            }`}
                                    >
                                        <div className={`p-3 rounded-full ${theme === 'light' ? 'bg-white shadow-sm dark:bg-[#222]' : 'bg-white dark:bg-[#222]'}`}>
                                            <Sun size={24} className={`${theme === 'light' ? 'text-amber-500' : 'text-gray-400 dark:text-gray-500'}`} />
                                        </div>
                                        <span className={`text-sm font-semibold ${theme === 'light' ? 'text-gray-900 dark:text-[#cba153]' : 'text-gray-500'}`}>Light</span>
                                        {theme === 'light' && (
                                            <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-blue-500 dark:bg-[#cba153] flex items-center justify-center">
                                                <Check size={12} className="text-white dark:text-black" />
                                            </div>
                                        )}
                                    </button>

                                    <button
                                        onClick={() => toggleTheme('dark')}
                                        className={`relative flex flex-col pt-5 pb-4 px-4 items-center gap-2 rounded-2xl border transition-all duration-200 ${theme === 'dark'
                                                ? 'bg-blue-50/50 border-blue-200 dark:bg-[#1a1a1a] dark:border-[#cba153]'
                                                : 'bg-gray-50 border-gray-100 hover:bg-gray-100 dark:bg-[#161618] dark:border-[#222] dark:hover:bg-[#1c1c1e]'
                                            }`}
                                    >
                                        <div className={`p-3 rounded-full ${theme === 'dark' ? 'bg-white shadow-sm dark:bg-[#222]' : 'bg-white dark:bg-[#222]'}`}>
                                            <Moon size={24} className={`${theme === 'dark' ? 'text-blue-500 dark:text-[#cba153]' : 'text-gray-400 dark:text-gray-500'}`} />
                                        </div>
                                        <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-900 dark:text-[#cba153]' : 'text-gray-500'}`}>Dark</span>
                                        {theme === 'dark' && (
                                            <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-blue-500 dark:bg-[#cba153] flex items-center justify-center">
                                                <Check size={12} className="text-white dark:text-black" />
                                            </div>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="h-px w-full bg-gray-100 dark:bg-white/5"></div>

                            {/* Other dummy links for premium feel */}
                            <div className="p-2 space-y-1">
                                <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Order History</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="m9 18 6-6-6-6" /></svg>
                                </button>
                                <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Saved Addresses</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="m9 18 6-6-6-6" /></svg>
                                </button>
                                <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Support & Feedback</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="m9 18 6-6-6-6" /></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </PageTransition>
    );
}
