'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFilters, SortOption } from '@/context/FilterContext';
import { Search, X } from 'lucide-react';

const CLOTHING_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const SHOE_SIZES = ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45'];
const ALL_SIZES = [...CLOTHING_SIZES, ...SHOE_SIZES];

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
    { label: 'Newest', value: 'newest' },
    { label: 'Price: Low-High', value: 'price-low' },
    { label: 'Price: High-Low', value: 'price-high' },
    { label: 'Popularity', value: 'popular' },
];

export default function FilterDrawer() {
    const { isDrawerOpen, setDrawerOpen, tempFilters, setTempFilters, applyFilters, resetFilters } = useFilters();

    if (!isDrawerOpen) return null;

    const toggleSize = (size: string) => {
        setTempFilters(prev => ({
            ...prev,
            selectedSizes: prev.selectedSizes.includes(size)
                ? prev.selectedSizes.filter(s => s !== size)
                : [...prev.selectedSizes, size]
        }));
    };

    return (
        <AnimatePresence>
            {isDrawerOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setDrawerOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#121212] rounded-t-[32px] z-[101] max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-6 flex items-center justify-between border-b border-gray-100 dark:border-white/5">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Filters & Sort</h2>
                            <button
                                onClick={() => setDrawerOpen(false)}
                                className="p-2 rounded-full bg-gray-100 dark:bg-white/5 text-gray-500 hover:text-gray-900 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide pb-32">
                            {/* Sort By */}
                            <section>
                                <h3 className="text-xs font-black text-[#cba153] uppercase tracking-widest mb-4">Sort By</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {SORT_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.value}
                                            onClick={() => setTempFilters(prev => ({ ...prev, sortBy: opt.value }))}
                                            className={`px-4 py-3 rounded-2xl text-xs font-bold border transition-all ${
                                                tempFilters.sortBy === opt.value
                                                    ? 'bg-[#cba153] border-[#cba153] text-black shadow-lg shadow-[#cba153]/20'
                                                    : 'bg-transparent border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400'
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </section>

                            {/* Price Range */}
                            <section>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xs font-black text-[#cba153] uppercase tracking-widest">Price Range</h3>
                                    <span className="text-xs font-bold text-gray-900 dark:text-white tabular-nums">
                                        {tempFilters.minPrice} - {tempFilters.maxPrice} ETB
                                    </span>
                                </div>
                                <div className="px-2">
                                    <input
                                        type="range"
                                        min="0"
                                        max="50000"
                                        step="100"
                                        value={tempFilters.maxPrice}
                                        onChange={(e) => setTempFilters(prev => ({ ...prev, maxPrice: parseInt(e.target.value) }))}
                                        className="w-full h-1.5 bg-gray-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#cba153]"
                                    />
                                    <div className="flex justify-between mt-2 text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                                        <span>0 ETB</span>
                                        <span>50,000+ ETB</span>
                                    </div>
                                </div>
                            </section>

                            {/* Brand Filtering */}
                            <section>
                                <h3 className="text-xs font-black text-[#cba153] uppercase tracking-widest mb-4">Brand Filter</h3>
                                <div className="relative group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#cba153] transition-colors" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Search by brand name..."
                                        value={tempFilters.brand}
                                        onChange={(e) => setTempFilters(prev => ({ ...prev, brand: e.target.value }))}
                                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl py-3 pl-10 pr-4 text-xs font-bold focus:ring-2 focus:ring-[#cba153]/20 focus:outline-none transition-all placeholder:text-gray-400"
                                    />
                                </div>
                            </section>

                            {/* Sizes */}
                            <section>
                                <h3 className="text-xs font-black text-[#cba153] uppercase tracking-widest mb-4">Fit & Size</h3>
                                <div className="flex flex-wrap gap-2">
                                    {ALL_SIZES.map((size) => (
                                        <button
                                            key={size}
                                            onClick={() => toggleSize(size)}
                                            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                                                tempFilters.selectedSizes.includes(size)
                                                    ? 'bg-[#cba153] border-[#cba153] text-black'
                                                    : 'bg-transparent border-gray-200 dark:border-white/10 text-gray-500'
                                            }`}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </section>

                            {/* Options */}
                            <section className="space-y-4">
                                <label className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 cursor-pointer active:scale-95 transition-transform">
                                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Hide Out of Stock</span>
                                    <input
                                        type="checkbox"
                                        checked={tempFilters.hideOutOfStock}
                                        onChange={(e) => setTempFilters(prev => ({ ...prev, hideOutOfStock: e.target.checked }))}
                                        className="w-5 h-5 accent-[#cba153]"
                                    />
                                </label>
                                <label className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 cursor-pointer active:scale-95 transition-transform">
                                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Only New Arrivals</span>
                                    <input
                                        type="checkbox"
                                        checked={tempFilters.onlyNewArrivals}
                                        onChange={(e) => setTempFilters(prev => ({ ...prev, onlyNewArrivals: e.target.checked }))}
                                        className="w-5 h-5 accent-[#cba153]"
                                    />
                                </label>
                            </section>
                        </div>

                        {/* Footer Actions */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 bg-white dark:bg-[#121212] border-t border-gray-100 dark:border-white/5 pb-safe flex gap-3 z-10">
                            <button
                                onClick={resetFilters}
                                className="flex-1 py-4 text-xs font-black text-gray-400 uppercase tracking-widest hover:text-[#cba153] transition-colors"
                            >
                                Reset All
                            </button>
                            <button
                                onClick={applyFilters}
                                className="flex-[2] py-4 bg-[#cba153] text-black text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-[#cba153]/20 active:scale-95 transition-transform"
                            >
                                Apply Filters
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
