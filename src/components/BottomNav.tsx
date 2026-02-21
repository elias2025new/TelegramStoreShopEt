'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Grid, Heart, User } from 'lucide-react';

export default function BottomNav() {
    const pathname = usePathname();

    const tabs = [
        { name: 'Home', href: '/', icon: Home },
        { name: 'Categories', href: '/categories', icon: Grid },
        { name: 'Favorites', href: '/favorites', icon: Heart },
        { name: 'Profile', href: '/profile', icon: User },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-md border-t border-[#2a2a2a] px-6 py-4 pb-safe-area-bottom">
            <div className="flex items-center justify-between max-w-md mx-auto">
                {tabs.map((tab) => {
                    const isActive = pathname === tab.href;
                    const Icon = tab.icon;
                    return (
                        <Link
                            key={tab.name}
                            href={tab.href}
                            className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${isActive ? 'text-[#cba153]' : 'text-gray-500 hover:text-gray-300'
                                }`}
                        >
                            <Icon
                                size={24}
                                strokeWidth={isActive ? 2.5 : 2}
                                className={isActive ? 'fill-[#cba153]/20' : ''}
                            />
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
