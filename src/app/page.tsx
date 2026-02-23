'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
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
import CartIcon from '@/components/CartIcon';

const CATEGORIES = [
  { name: 'New', icon: 'sparkling-diamond' },
  { name: 'Men', icon: 'male' },
  { name: 'Women', icon: 'female' },
  { name: 'Footwear', icon: 'shoes' },
  { name: 'Accessories', icon: 'shopping-bag' }
];

function HomeContent() {
  const { totalPrice } = useCart();
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
  const productSectionRef = useRef<HTMLDivElement>(null);

  const scrollToProducts = () => {
    productSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const slides = [
    { id: 3, image: '/images/promo3.png', title: 'URBAN\nELEGANCE', subtitle: 'Exclusive Drops', promo: 'SHOP THE LOOK' },
    { id: 1, image: '/images/promo1.png', title: 'OWN THE\nSTREET', subtitle: 'Spring Drop 2026', promo: '-20% OFF ALL NEW STYLES' },
    { id: 2, image: '/images/promo2.png', title: 'ELEVATE\nYOUR LOOK', subtitle: 'Premium Collection', promo: 'NEW ARRIVALS' },
  ];
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEndHandler = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    } else if (isRightSwipe) {
      setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 10000);
    return () => clearInterval(timer);
  }, [slides.length]);

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
            <CartIcon />
            <button className="relative text-white hover:text-[#cba153] transition-colors">
              <img src="https://img.icons8.com/ios-filled/50/ffffff/bell.png" alt="notifications" className="w-6 h-6 hover:brightness-75" />
              <span className="absolute top-0 right-1 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-black"></span>
            </button>
          </div>
        </header>

        {/* Hero Section */}
        <section className="px-4 mt-2">
          <div
            className="relative w-full h-[280px] rounded-2xl overflow-hidden bg-[#1a1a1a]"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEndHandler}
          >
            {/* Background Image */}
            <Image
              src={slides[currentSlide].image}
              alt="Promo Banner"
              fill
              className="object-cover object-[65%_20%] opacity-90 transition-opacity duration-700 ease-in-out"
              priority
            />
            {/* Gradient Overlay for Text Visibility */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent z-10 pointer-events-none"></div>

            <div className="absolute inset-0 z-20 flex flex-col justify-center px-6 animate-in fade-in slide-in-from-bottom-2 duration-700" key={currentSlide}>
              <h2 className="text-[#ebe0cd] text-4xl font-black leading-tight tracking-wide font-sans mb-1 whitespace-pre-line drop-shadow-md">
                {slides[currentSlide].title}
              </h2>
              <p className="text-[#cba153] font-medium text-lg mt-1 mb-2 drop-shadow-md">
                {slides[currentSlide].subtitle}
              </p>
              <p className="text-gray-200 text-sm mb-6 tracking-wide uppercase drop-shadow-md">
                {slides[currentSlide].promo}
              </p>
              <button
                onClick={scrollToProducts}
                className="w-max px-6 py-2 rounded-full border border-[#cba153]/60 bg-black/30 backdrop-blur-sm text-white text-sm font-semibold hover:bg-[#cba153] hover:text-black hover:border-[#cba153] transform-gpu active:scale-90 transition-all duration-300 animate-pulse"
              >
                Shop Now ↓
              </button>
            </div>

            {/* Carousel Indicators */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-1 rounded-full transition-all duration-300 ${currentSlide === index ? 'w-6 bg-[#cba153]' : 'w-2 bg-gray-500'}`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
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
                    <img
                      src={`https://img.icons8.com/ios-filled/50/${isSelected ? 'cba153' : '6b7280'}/${category.icon}.png`}
                      alt={category.name}
                      className="w-10 h-10 object-contain"
                    />
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
        <div ref={productSectionRef} className="px-6 mt-6 flex justify-between items-center">
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
