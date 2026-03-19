'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFilters, SortOption } from '@/context/FilterContext';
import { Search, X, ChevronRight } from 'lucide-react';
import { CATEGORIES, CATEGORY_SUBCATEGORIES } from '@/constants/categories';
import { supabase } from '@/utils/supabase/client';
import { useQuery } from '@tanstack/react-query';

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
    const trackRef = React.useRef<HTMLDivElement>(null);

    // Fetch unique category/subcategory combinations for deep filtering
    const { data: categoryStructure } = useQuery({
        queryKey: ['filterCategoryStructure'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('products')
                .select('gender, category, sub_subcategory');
            if (error) throw error;
            
            // Build a tree: Gender -> Category -> Sub-Subcategories
            const tree: Record<string, Record<string, Set<string>>> = {};
            data.forEach(p => {
                if (!p.gender) return;
                if (!tree[p.gender]) tree[p.gender] = {};
                if (!p.category) return;
                if (!tree[p.gender][p.category]) tree[p.gender][p.category] = new Set();
                if (p.sub_subcategory) tree[p.gender][p.category].add(p.sub_subcategory);
            });
            return tree;
        },
        enabled: isDrawerOpen
    });

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
                                <div className="px-5 relative pt-4 pb-6">
                                    <div 
                                        ref={trackRef}
                                        className="h-1.5 w-full bg-gray-100 dark:bg-white/5 rounded-full relative"
                                    >
                                        {/* Filled Track */}
                                        <div 
                                            className="absolute left-0 top-0 h-full bg-[#cba153] rounded-full"
                                            style={{ width: `${(tempFilters.maxPrice / 10000) * 100}%` }}
                                        />
                                        
                                        {/* Drag Handle */}
                                        <motion.div
                                            drag="x"
                                            dragConstraints={trackRef}
                                            dragElastic={0}
                                            dragMomentum={false}
                                            onDrag={(e, info) => {
                                                if (!trackRef.current) return;
                                                const rect = trackRef.current.getBoundingClientRect();
                                                const trackWidth = rect.width;
                                                const offsetX = info.point.x - rect.left;
                                                const newPercent = Math.min(Math.max(0, offsetX), trackWidth) / trackWidth;
                                                const newValue = Math.round((newPercent * 10000) / 100) * 100;
                                                setTempFilters(prev => ({ ...prev, maxPrice: newValue }));
                                            }}
                                            animate={{ x: `${(tempFilters.maxPrice / 10000) * 100}%` }}
                                            style={{ left: 0, x: '-50%' }}
                                            className="absolute top-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-xl border-2 border-[#cba153] cursor-grab active:cursor-grabbing z-10 flex items-center justify-center p-0"
                                        >
                                            <div className="flex gap-0.5">
                                                <div className="w-0.5 h-3 bg-[#cba153]/30 rounded-full" />
                                                <div className="w-0.5 h-3 bg-[#cba153]/30 rounded-full" />
                                                <div className="w-0.5 h-3 bg-[#cba153]/30 rounded-full" />
                                            </div>
                                        </motion.div>
                                    </div>
                                    <div className="flex justify-between mt-8 text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                                        <span>0 ETB</span>
                                        <span>10,000+ ETB</span>
                                    </div>
                                </div>
                            </section>

                            {/* Category Hierarchy */}
                            <section className="space-y-6">
                                <h3 className="text-xs font-black text-[#cba153] uppercase tracking-widest mb-4">Category Selection</h3>
                                
                                {/* Level 1: Gender */}
                                <div className="space-y-3">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Main Category</span>
                                    <div className="flex flex-wrap gap-2">
                                        {['Men', 'Women', 'Accessories', 'Unisex'].map((g) => (
                                            <button
                                                key={g}
                                                onClick={() => setTempFilters(prev => ({ 
                                                    ...prev, 
                                                    gender: prev.gender === g ? '' : g,
                                                    category: '',
                                                    subSubCategory: ''
                                                }))}
                                                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                                                    tempFilters.gender === g
                                                        ? 'bg-[#cba153] border-[#cba153] text-black shadow-lg shadow-[#cba153]/20'
                                                        : 'bg-transparent border-gray-200 dark:border-white/10 text-gray-500'
                                                }`}
                                            >
                                                {g}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Level 2: Category (Revealed if Gender selected) */}
                                <AnimatePresence>
                                    {tempFilters.gender && (
                                        <motion.div 
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="space-y-3 overflow-hidden"
                                        >
                                            <div className="flex items-center gap-2 px-1">
                                                <ChevronRight size={10} className="text-[#cba153]" />
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sub Category</span>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {Object.keys(categoryStructure?.[tempFilters.gender] || {}).map((cat) => (
                                                    <button
                                                        key={cat}
                                                        onClick={() => setTempFilters(prev => ({ 
                                                            ...prev, 
                                                            category: prev.category === cat ? '' : cat,
                                                            subSubCategory: ''
                                                        }))}
                                                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                                                            tempFilters.category === cat
                                                                ? 'bg-[#cba153] border-[#cba153] text-black'
                                                                : 'bg-transparent border-gray-200 dark:border-white/10 text-gray-500'
                                                        }`}
                                                    >
                                                        {cat}
                                                    </button>
                                                ))}
                                                {Object.keys(categoryStructure?.[tempFilters.gender] || {}).length === 0 && (
                                                    <span className="text-[10px] text-gray-500 italic px-1">No sub-categories available</span>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Level 3: Sub-Subcategory (Revealed if Category selected) */}
                                <AnimatePresence>
                                    {(tempFilters.gender && tempFilters.category && Array.from(categoryStructure?.[tempFilters.gender]?.[tempFilters.category] || []).length > 0) && (
                                        <motion.div 
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="space-y-3 overflow-hidden"
                                        >
                                            <div className="flex items-center gap-2 px-1">
                                                <ChevronRight size={10} className="text-[#cba153]" />
                                                <ChevronRight size={10} className="-ms-1.5 text-[#cba153]" />
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Type / Detail</span>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {Array.from(categoryStructure?.[tempFilters.gender]?.[tempFilters.category] || []).map((subSub) => (
                                                    <button
                                                        key={subSub}
                                                        onClick={() => setTempFilters(prev => ({ 
                                                            ...prev, 
                                                            subSubCategory: prev.subSubCategory === subSub ? '' : subSub 
                                                        }))}
                                                        className={`px-4 py-2 rounded-xl text-[10px] font-medium border transition-all ${
                                                            tempFilters.subSubCategory === subSub
                                                                ? 'bg-[#cba153] border-[#cba153] text-black'
                                                                : 'bg-transparent border-gray-200 dark:border-white/10 text-gray-400'
                                                        }`}
                                                    >
                                                        {subSub}
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
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
