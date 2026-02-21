'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQueryClient } from '@tanstack/react-query';
import { useCart } from '@/context/CartContext';
import { useAdmin } from '@/context/AdminContext';
import ProductGrid from '@/components/ProductGrid';
import AdminOverlay from '@/components/Admin/AdminOverlay';
import { ShoppingCart, Bell, User as UserIcon } from 'lucide-react';

const CATEGORIES = [
  { name: 'New', icon: '✨' },
  { name: 'Men', image: '/men-cat.png' }, // Placeholders for now
  { name: 'Women', image: '/women-cat.png' },
  { name: 'Footwear', image: '/footwear-cat.png' },
  { name: 'Accessories', image: '/acc-cat.png' }
];

export default function Home() {
  const { totalItems } = useCart();
  const { isOwner } = useAdmin();
  const [adminOpen, setAdminOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('New');
  const queryClient = useQueryClient();
  const [userPhotoUrl, setUserPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('@twa-dev/sdk').then((WebApp) => {
        if (WebApp.default.initDataUnsafe?.user) {
          setUserPhotoUrl(WebApp.default.initDataUnsafe.user.photo_url || null);
        }
      }).catch(console.error);
    }
  }, []);

  return (
    <main className="min-h-screen bg-black pb-24 font-sans">
      {/* Header */}
      <header
        className="sticky top-0 z-50 bg-black/80 backdrop-blur-md px-6 pb-4 flex items-center justify-between"
        style={{ paddingTop: 'calc(1rem + var(--tg-safe-area-inset-top, 0px) + var(--tg-content-safe-area-inset-top, 0px))' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-[#cba153] flex items-center justify-center overflow-hidden bg-[#1a1a1a]">
            {userPhotoUrl ? (
              <Image src={userPhotoUrl} alt="Profile" width={40} height={40} className="w-full h-full object-cover" />
            ) : (
              <UserIcon size={20} className="text-[#cba153]" />
            )}
          </div>
          <div>
            <h1 className="text-[#cba153] font-serif font-bold tracking-wider text-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]">
              CROWN SHOES & CLOTHES
            </h1>
            <p className="text-gray-400 text-xs mt-0.5">Hey, guests,</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/cart" className="relative text-white hover:text-[#cba153] transition-colors">
            <ShoppingCart size={24} />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {totalItems}
              </span>
            )}
          </Link>
          <button className="relative text-white hover:text-[#cba153] transition-colors">
            <Bell size={24} />
            <span className="absolute 1 top-0 right-1 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-black"></span>
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-4 mt-2">
        <div className="relative w-full h-[280px] rounded-2xl overflow-hidden bg-[#1a1a1a]">
          {/* Placeholder for the background image */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent z-10"></div>
          <div className="absolute inset-0 flex items-center justify-center text-gray-800">
            {/* Image component would go here */}
            <span className="opacity-20 text-xs">Hero Image Area</span>
          </div>

          <div className="absolute inset-0 z-20 flex flex-col justify-center px-6">
            <h2 className="text-[#ebe0cd] text-4xl font-black leading-tight tracking-wide font-sans mb-1">
              OWN THE<br />STREET
            </h2>
            <p className="text-[#cba153] font-medium text-lg mt-1 mb-2">Spring Drop 2026</p>
            <p className="text-gray-300 text-sm mb-6 tracking-wide uppercase">-20% OFF ALL NEW STYLES</p>
            <button className="w-max px-6 py-2 rounded-full border border-gray-400 text-gray-200 text-sm font-medium hover:bg-white hover:text-black transition-all">
              Shop Now
            </button>
          </div>

          {/* Carousel Indicators */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20">
            <div className="w-6 h-1 rounded-full bg-[#cba153]"></div>
            <div className="w-6 h-1 rounded-full bg-gray-600"></div>
            <div className="w-6 h-1 rounded-full bg-gray-600"></div>
          </div>
        </div>
      </section>

      {/* Categories Scroller */}
      <section className="mt-8 px-4">
        <div className="flex overflow-x-auto gap-3 pb-4 scrollbar-hide">
          {CATEGORIES.map((category) => {
            const isSelected = selectedCategory === category.name;
            return (
              <button
                key={category.name}
                onClick={() => setSelectedCategory(category.name)}
                className={`flex flex-col items-center justify-between min-w-[80px] h-[90px] p-2 rounded-2xl transition-all ${isSelected
                  ? 'bg-[#111111] border border-[#cba153]'
                  : 'bg-[#1a1a1a] border border-[#2a2a2a] hover:bg-[#222222]'
                  }`}
              >
                <div className="flex-1 flex items-center justify-center">
                  {category.icon ? (
                    <span className="text-2xl">{category.icon}</span>
                  ) : (
                    <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center text-xs text-gray-500 overflow-hidden relative">
                      {/* Dummy images */}
                      img
                    </div>
                  )}
                </div>
                <span className={`text-xs mt-1 ${isSelected ? 'text-[#cba153] font-medium' : 'text-gray-400'}`}>
                  {category.name}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Product Section Header */}
      <div className="px-6 mt-6 flex justify-between items-center">
        <h2 className="text-xl font-medium text-white">Bestsellers <span className="text-xl">🔥</span></h2>
        <button className="text-gray-400 hover:text-white">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
        </button>
      </div>

      {/* Product Grid */}
      <ProductGrid selectedCategory={selectedCategory === 'New' ? 'All' : selectedCategory} />

      {/* Floating Admin Button — visible only to store owner */}
      {isOwner && (
        <button
          onClick={() => setAdminOpen(true)}
          className="fixed bottom-24 right-4 z-40 flex items-center gap-2 bg-[#cba153] hover:bg-[#b8860b] active:scale-95 text-black font-bold px-4 py-3 rounded-2xl shadow-xl shadow-[#cba153]/20 transition-all"
        >
          <span className="text-lg">⚡</span>
          <span className="text-sm">Manage Store</span>
        </button>
      )}

      {/* Admin Overlay */}
      <AdminOverlay
        isOpen={adminOpen}
        onClose={() => {
          setAdminOpen(false);
          // Final safety sync when closing
          queryClient.invalidateQueries({ queryKey: ['products'] });
        }}
      />
    </main>
  );
}
