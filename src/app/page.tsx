'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useCart } from '@/context/CartContext';
import { useAdmin } from '@/context/AdminContext';
import ProductGrid from '@/components/ProductGrid';
import AdminOverlay from '@/components/Admin/AdminOverlay';
import { User as UserIcon } from 'lucide-react';
import PageTransition from '@/components/PageTransition';

const CATEGORIES = [
  { name: 'New', image: 'https://img.icons8.com/ios-filled/50/cba153/sparkling-diamond.png' },
  { name: 'Men', image: '/men-cat.png' }, // Placeholders for now
  { name: 'Women', image: '/women-cat.png' },
  { name: 'Footwear', image: '/footwear-cat.png' },
  { name: 'Accessories', image: '/acc-cat.png' }
];

function HomeContent() {
  const { totalItems } = useCart();
  const { isOwner, adminOpen, setAdminOpen } = useAdmin();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedCategory = searchParams.get('category') || 'New';

  const setSelectedCategory = (category: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (category === 'New') {
      params.delete('category');
    } else {
      params.set('category', category);
    }
    router.replace(`/?${params.toString()}`, { scroll: false });
  };
  const queryClient = useQueryClient();
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
    <main className="min-h-screen bg-black pb-24 font-sans">
      <PageTransition>
        {/* Header */}
        <header
          className="sticky top-0 z-50 bg-black/80 backdrop-blur-md px-6 flex items-center justify-between"
          style={{
            marginTop: 'calc(-1 * (var(--tg-safe-area-inset-top, 0px) + var(--tg-content-safe-area-inset-top, 0px)))',
            paddingTop: 'calc(1rem + var(--tg-safe-area-inset-top, 0px) + var(--tg-content-safe-area-inset-top, 0px))',
            paddingBottom: '1rem'
          }}
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
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-gray-400 text-xs">Hey {userName}</p>
                {isOwner && (
                  <button
                    onClick={() => setAdminOpen(true)}
                    className="px-2 py-0.5 bg-[#cba153]/10 text-[#cba153] border border-[#cba153]/30 rounded text-[10px] font-bold tracking-wide transform-gpu active:scale-90 transition-all duration-200 flex items-center gap-1"
                  >
                    <img
                      src="https://img.icons8.com/ios-filled/50/cba153/manager.png"
                      alt="admin"
                      className="w-3 h-3 shrink-0"
                    /> Admin
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/cart" className="relative text-white hover:text-[#cba153] transition-colors">
              <img src="https://img.icons8.com/ios-filled/50/ffffff/shopping-cart.png" alt="cart" className="w-6 h-6 hover:brightness-75" />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {totalItems}
                </span>
              )}
            </Link>
            <button className="relative text-white hover:text-[#cba153] transition-colors">
              <img src="https://img.icons8.com/ios-filled/50/ffffff/bell.png" alt="notifications" className="w-6 h-6 hover:brightness-75" />
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
              <button className="w-max px-6 py-2 rounded-full border border-gray-400 text-gray-200 text-sm font-medium hover:bg-white hover:text-black transform-gpu active:scale-95 transition-all duration-200">
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
          <div className="flex overflow-x-auto gap-3 pb-4 scrollbar-hide transform-gpu scroll-smooth">
            {CATEGORIES.map((category) => {
              const isSelected = selectedCategory === category.name;
              return (
                <button
                  key={category.name}
                  onClick={() => setSelectedCategory(category.name)}
                  className={`flex flex-col items-center justify-between min-w-[80px] h-[90px] p-2 rounded-2xl transform-gpu active:scale-95 transition-all duration-200 ${isSelected
                    ? 'bg-[#111111] border border-[#cba153]'
                    : 'bg-[#1a1a1a] border border-[#2a2a2a] hover:bg-[#222222]'
                    }`}
                >
                  <div className="flex-1 flex items-center justify-center">
                    {category.image ? (
                      <img src={category.image} alt={category.name} className="w-10 h-10 object-contain" />
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
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-medium text-white">Bestsellers</h2>
            <img src="https://img.icons8.com/ios-filled/50/ff4d4d/fire-element.png" alt="fire" className="w-5 h-5" />
          </div>
          <button className="text-gray-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
          </button>
        </div>

        {/* Product Grid */}
        <ProductGrid selectedCategory={selectedCategory === 'New' ? 'All' : selectedCategory} />
      </PageTransition>

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

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <HomeContent />
    </Suspense>
  );
}
