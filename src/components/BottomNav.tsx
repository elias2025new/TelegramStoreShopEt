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
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-md border-t border-[#2a2a2a] px-6 py-4 pb-safe-area-bottom">
                <div className="flex items-center justify-between max-w-md mx-auto">
                    {tabs.map((tab) => {
                        const isActive = pathname === tab.href;
                        return (
                            <Link
                                key={tab.name}
                                href={tab.href}
                                className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${isActive ? 'text-[#cba153]' : 'text-gray-500 hover:text-gray-300'
                                    }`}
                            >
                                <img
                                    src={`https://img.icons8.com/ios-filled/50/${isActive ? 'cba153' : '6b7280'}/${tab.icon}.png`}
                                    alt={tab.name}
                                    className="w-6 h-6 transition-all"
                                />
                            </Link>
                        );
                    })}
                </div>
            </div>
        )
    );
}
