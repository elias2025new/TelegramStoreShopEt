
'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase/client';
import ProductCard from './ProductCard';
import { Database } from '@/types/supabase';

type Product = Database['public']['Tables']['products']['Row'];

interface ProductGridProps {
    selectedCategory?: string;
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

export default function ProductGrid({ selectedCategory = 'All' }: ProductGridProps) {
    const { data: products, isLoading, error } = useQuery({
        queryKey: ['products'],
        queryFn: fetchProducts,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
    });

    if (isLoading) {
        return (
            <div className="grid grid-cols-2 gap-3 px-4 pb-24">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-[#1c1c1e] rounded-xl h-56 animate-pulse border border-[#2a2a2a]"></div>
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

    const filtered =
        selectedCategory === 'All'
            ? products
            : products.filter(
                (p) =>
                    p.category?.toLowerCase() === selectedCategory.toLowerCase()
            );

    if (filtered.length === 0) {
        return (
            <div className="p-8 text-center text-gray-500">
                No products in &quot;{selectedCategory}&quot;.
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 gap-3 px-4 pb-32 transform-gpu scroll-smooth">
            {filtered.map((product) => (
                <ProductCard key={product.id} product={product} />
            ))}
        </div>
    );
}
