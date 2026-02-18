import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import ProductGrid from '@/components/ProductGrid';

export default function Home() {
  const { totalItems } = useCart();

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-teal-400 bg-clip-text text-transparent">
            Storefront
          </h1>
          <div className="relative">
            <Link href="/cart" className="p-2 -mr-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors flex items-center justify-center">
              <span className="sr-only">Cart</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="8" cy="21" r="1" />
                <circle cx="19" cy="21" r="1" />
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
              </svg>
            </Link>
            {totalItems > 0 && (
              <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white pointer-events-none">
                {totalItems}
              </span>
            )}
          </div>
        </div>

        {/* Search Bar - Visual Only for now */}
        <div className="mt-2 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl leading-5 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-shadow"
            placeholder="Search products..."
          />
        </div>
      </header>

      {/* Categories Scroller - Static for now */}
      <div className="px-4 py-3 overflow-x-auto whitespace-nowrap scrollbar-hide">
        {['All', 'Electronics', 'Fashion', 'Home', 'Beauty'].map((category, i) => (
          <button
            key={category}
            className={`mr-2 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${i === 0
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      <ProductGrid />
    </main>
  );
}
