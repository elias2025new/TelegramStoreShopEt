'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase/client';
import ProductCard from './ProductCard';
import { Database } from '@/types/supabase';
import { useFilters } from '@/context/FilterContext';

type Product = Database['public']['Tables']['products']['Row'];

interface ProductGridProps {
    selectedCategory?: string;
    selectedSubcategory?: string | null;
    searchQuery?: string;
}

async function fetchProducts() {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        throw new Error(error.message);
    }

    return data as Product[];
}

export default function ProductGrid({ selectedCategory = 'All', selectedSubcategory = null, searchQuery = '' }: ProductGridProps) {
    const { filters } = useFilters();
    const { data: products, isLoading, error } = useQuery({
        queryKey: ['products'],
        queryFn: fetchProducts,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
    });

    if (isLoading) {
        return (
            <div className="grid grid-cols-2 gap-2 px-3 pb-24">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white dark:bg-[#1c1c1e] rounded-xl border border-gray-100 dark:border-[#2a2a2a] flex flex-col h-[260px] animate-pulse">
                        <div className="aspect-square w-full bg-gray-100 dark:bg-[#111111] rounded-t-xl" />
                        <div className="p-2 space-y-2">
                            <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-3/4" />
                            <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 text-center text-red-500">
                Error loading products: {error.message}
            </div>
        );
    }

    if (!products || products.length === 0) {
        return (
            <div className="p-8 text-center text-gray-500">
                No products found.
            </div>
        );
    }

    const filtered = products.filter((p: Product) => {
        // --- 1. Base Global Search ---
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            const nameMatch = p.name.toLowerCase().includes(query);
            const descMatch = p.description?.toLowerCase().includes(query);
            // @ts-ignore
            const subSubMatch = p.sub_subcategory?.toLowerCase().includes(query);
            if (!(nameMatch || descMatch || subSubMatch)) return false;
        }

        // --- 2. Category/Gender Filter (Main Tabs) ---
        const categoryMatch = selectedCategory === 'All' || (() => {
            const cat = selectedCategory.toLowerCase();
            const pGender = p.gender?.toLowerCase();
            const pCat = p.category?.toLowerCase();

            // Handle Gender-based Main Categories
            if (['men', 'women', 'accessories', 'unisex'].includes(cat)) {
                if (cat === 'accessories') return pGender === 'accessories';
                if (cat === 'unisex') return pGender === 'unisex';
                return pGender === cat || pGender === 'unisex';
            }
            
            // Handle regular categories
            return pCat === cat;
        })();
        if (!categoryMatch) return false;

        // Skip category match if we have a selected subcategory (it will be matched next)
        if (selectedSubcategory) {
            const sub = selectedSubcategory.toLowerCase();
            const matchesSub = p.category?.toLowerCase() === sub;
            // @ts-ignore
            const matchesSubSub = p.sub_subcategory?.toLowerCase() === sub;
            if (!(matchesSub || matchesSubSub)) return false;
        }

        // --- 3. Advanced Drawer Filters ---
        
        // Gender Filter (from Drawer)
        if (filters.gender) {
            const pGender = p.gender?.toLowerCase();
            if (!pGender) return false;
            
            if (filters.gender.toLowerCase() === 'unisex') {
                if (pGender !== 'unisex') return false;
            } else {
                if (pGender !== filters.gender.toLowerCase() && pGender !== 'unisex') return false;
            }
        }

        // Category Filter (from Drawer)
        if (filters.category) {
            const pCat = p.category?.toLowerCase();
            if (!pCat || pCat !== filters.category.toLowerCase()) return false;
        }

        // Sub-Subcategory Filter (from Drawer)
        if (filters.subSubCategory) {
            // @ts-ignore
            const pSubSub = p.sub_subcategory?.toLowerCase();
            if (!pSubSub || pSubSub !== filters.subSubCategory.toLowerCase()) return false;
        }

        // Price Filter
        if (p.price < filters.minPrice || p.price > filters.maxPrice) return false;

        // Stock Filter
        if (filters.hideOutOfStock && p.quantity <= 0) return false;

        // Size Filter
        if (filters.selectedSizes.length > 0) {
            const productSizes = p.sizes || [];
            const hasSizeMatch = filters.selectedSizes.some(s => productSizes.includes(s));
            if (!hasSizeMatch) return false;
        }

        // New Arrivals (Last 14 days)
        if (filters.onlyNewArrivals) {
            const created = new Date(p.created_at).getTime();
            const now = new Date().getTime();
            const diffDays = (now - created) / (1000 * 60 * 60 * 24);
            if (diffDays > 14) return false;
        }

        return true;
    });

    // --- 4. Sorting logic ---
    const sorted = [...filtered].sort((a, b) => {
        switch (filters.sortBy) {
            case 'price-low':
                return a.price - b.price;
            case 'price-high':
                return b.price - a.price;
            case 'newest':
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            case 'popular':
                // Popularity fallback to ID length or similar if no sales stats yet
                return b.id.length - a.id.length;
            default:
                return 0;
        }
    });

    if (sorted.length === 0) {
        return (
            <div className="p-8 text-center text-gray-500">
                {searchQuery || filters.gender || filters.category || filters.subSubCategory || filters.selectedSizes.length > 0
                    ? `No products match your current filters`
                    : `No products in "${selectedCategory}"`
                }
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 gap-2 px-3 transform-gpu">
            {sorted.map((product) => (
                <ProductCard key={product.id} product={product} />
            ))}
        </div>
    );
}
