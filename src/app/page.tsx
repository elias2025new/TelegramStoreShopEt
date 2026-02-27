'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useCart } from '@/context/CartContext';
import { useAdmin } from '@/context/AdminContext';
import { useTheme } from '@/context/ThemeContext';
import { useLocation } from '@/context/LocationContext';
import ProductGrid from '@/components/ProductGrid';
import AdminOverlay from '@/components/Admin/AdminOverlay';
import { User as UserIcon, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const { theme } = useTheme();
  const { locationName, locationEnabled } = useLocation();
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
    <main className="min-h-screen bg-[#f8f9fa] dark:bg-black pb-36 font-sans transition-colors duration-300">
      <PageTransition>
        {/* Header */}
        <header
          className="sticky top-0 z-50 bg-white/90 dark:bg-black/80 backdrop-blur-md pl-3 pr-6 flex items-center justify-between border-b border-gray-200/50 dark:border-transparent transition-colors duration-300"
          style={{
            marginTop: 'calc(-1 * (var(--tg-safe-area-inset-top, 0px) + var(--tg-content-safe-area-inset-top, 0px)))',
            paddingTop: 'calc(1.75rem + var(--tg-safe-area-inset-top, 0px) + var(--tg-content-safe-area-inset-top, 0px))',
            paddingBottom: '1rem'
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-[#cba153] flex items-center justify-center overflow-hidden bg-gray-100 dark:bg-[#1a1a1a]">
              {userPhotoUrl ? (
                <Image src={userPhotoUrl} alt="Profile" width={40} height={40} className="w-full h-full object-cover" />
              ) : (
                <UserIcon size={20} className="text-[#cba153]" />
              )}
            </div>
            <div>
              <h1 className="text-[#cba153] font-serif font-bold tracking-wider text-sm whitespace-nowrap">
                CROWN SHOES & CLOTHES
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-gray-500 dark:text-gray-400 text-xs">Hey {userName}</p>
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
              {locationEnabled && locationName && (
                <div className="flex items-center gap-1 mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="text-[#cba153] shrink-0">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 leading-none truncate max-w-[120px]">{locationName}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <CartIcon />
            <button className="relative text-gray-800 dark:text-white hover:text-[#cba153] dark:hover:text-[#cba153] transition-colors">
              <Bell size={24} />
              <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-white dark:border-black"></span>
            </button>
          </div>
        </header>

        {/* Hero Section */}
        <section className="px-4 mt-2">
          <div
            className="relative w-full h-[280px] rounded-2xl overflow-hidden bg-gray-100 dark:bg-[#0a0a0a] shadow-lg dark:shadow-none"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEndHandler}
            style={{ touchAction: 'pan-y' }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0"
              >
                {/* Background Image */}
                <Image
                  src={slides[currentSlide].image}
                  alt="Promo Banner"
                  fill
                  className="object-cover"
                  priority={currentSlide === 0}
                  unoptimized={true}
                />
                {/* Gradient Overlay for Text Visibility */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent z-10 pointer-events-none"></div>

                <div className="absolute inset-0 z-20 flex flex-col justify-center px-6">
                  <motion.h2
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    className="text-[#ebe0cd] text-4xl font-black leading-tight tracking-wide font-sans mb-1 whitespace-pre-line drop-shadow-md"
                  >
                    {slides[currentSlide].title}
                  </motion.h2>
                  <motion.p
                    initial={{ y: 15, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className="text-[#cba153] font-medium text-lg mt-1 mb-2 drop-shadow-md"
                  >
                    {slides[currentSlide].subtitle}
                  </motion.p>
                  <motion.p
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    className="text-gray-200 text-sm mb-6 tracking-wide uppercase drop-shadow-md"
                  >
                    {slides[currentSlide].promo}
                  </motion.p>
                  <motion.button
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                    onClick={scrollToProducts}
                    className="w-max px-6 py-2 rounded-full border border-[#cba153]/60 bg-black/30 backdrop-blur-sm text-white text-sm font-semibold hover:bg-[#cba153] hover:text-black hover:border-[#cba153] transform-gpu active:scale-90 transition-all duration-300"
                  >
                    Shop Now ↓
                  </motion.button>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Carousel Indicators */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-1 rounded-full transition-all duration-300 ${currentSlide === index ? 'w-6 bg-[#cba153]' : 'w-2 bg-gray-500/50'}`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Categories Scroller */}
        <section className="mt-8 sticky top-[100px] z-40 bg-white/95 dark:bg-black/95 backdrop-blur-xl pt-4 pb-0 px-4 -mx-4 w-[calc(100%+2rem)] border-b border-gray-200/50 dark:border-white/5 transition-colors duration-300">
          <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide transform-gpu scroll-smooth overscroll-x-contain">
            {CATEGORIES.map((category) => {
              const isSelected = selectedCategory === category.name;
              return (
                <button
                  key={category.name}
                  onClick={() => setSelectedCategory(category.name)}
                  className={`flex flex-col items-center justify-center min-w-[85px] h-[85px] p-2 rounded-[24px] transform-gpu active:scale-95 transition-all duration-300 ${isSelected
                    ? 'bg-[#cba153] dark:bg-[#cba153] shadow-[0_8px_20px_rgba(203,161,83,0.3)] border-transparent'
                    : 'bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-[#161616] shadow-sm'
                    }`}
                >
                  <div className={`p-2 rounded-xl mb-1 ${isSelected ? 'bg-black/10' : 'bg-transparent'}`}>
                    <img
                      src={`https://img.icons8.com/ios-filled/50/${isSelected ? 'ffffff' : (theme === 'light' ? '6b7280' : '9ca3af')}/${category.icon}.png`}
                      alt={category.name}
                      className={`w-7 h-7 object-contain ${isSelected ? 'brightness-0 invert' : ''}`}
                    />
                  </div>
                  <span className={`text-[11px] uppercase tracking-wider font-black ${isSelected ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                    {category.name}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Product Section Header */}
        {selectedCategory === 'New' && (
          <div ref={productSectionRef} className="px-6 mt-6 flex justify-between items-center scroll-mt-[190px]">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Bestsellers</h2>
              <img src="https://img.icons8.com/ios-filled/50/ff4d4d/fire-element.png" alt="fire" className="w-5 h-5" />
            </div>
            <button className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
            </button>
          </div>
        )}

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
