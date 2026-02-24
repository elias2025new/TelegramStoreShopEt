'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAdmin } from '@/context/AdminContext';

export default function BottomNav() {
    const pathname = usePathname();
    const { adminOpen } = useAdmin();

    const tabs = [
        {
            name: 'Home',
            href: '/',
            icon: "home"
        },
        {
            name: 'Categories',
            href: '/categories',
            icon: "grid"
        },
        {
            name: 'Favorites',
            href: '/favorites',
            icon: "hearts"
        },
        {
            name: 'Profile',
            href: '/profile',
            icon: "user-male"
        },
    ];

    return (
        (pathname.startsWith('/product') || adminOpen) ? null : (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-[380px]">
                <div className="bg-[#111111]/80 backdrop-blur-xl border border-white/10 rounded-[32px] px-3 py-2 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                    <div className="flex items-center justify-between relative">
                        {tabs.map((tab) => {
                            const isActive = pathname === tab.href;
                            return (
                                <Link
                                    key={tab.name}
                                    href={tab.href}
                                    className={`relative flex flex-col items-center justify-center py-2 px-5 rounded-2xl transition-all duration-300 ${isActive ? 'text-[#cba153]' : 'text-gray-500 hover:text-gray-300'
                                        }`}
                                >
                                    {isActive && (
                                        <div className="absolute inset-0 bg-white/5 rounded-2xl -z-10" />
                                    )}
                                    <img
                                        src={`https://img.icons8.com/ios-filled/50/${isActive ? 'cba153' : '6b7280'}/${tab.icon}.png`}
                                        alt={tab.name}
                                        className={`w-6 h-6 transition-all duration-300 ${isActive ? 'scale-110' : 'scale-100'}`}
                                    />
                                    {isActive && (
                                        <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-[#cba153]" />
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>
        )
    );
}
