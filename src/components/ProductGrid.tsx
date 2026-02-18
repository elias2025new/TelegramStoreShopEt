
'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase/client';
import ProductCard from './ProductCard';
import { Database } from '@/types/supabase';

type Product = Database['public']['Tables']['products']['Row'];

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

export default function ProductGrid() {
    const { data: products, isLoading, error } = useQuery({
        queryKey: ['products'],
        queryFn: fetchProducts,
    });

    if (isLoading) {
        return (
            <div className="grid grid-cols-2 gap-4 p-4 animate-pulse">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-gray-200 dark:bg-gray-800 rounded-lg h-48"></div>
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

    return (
        <div className="grid grid-cols-2 gap-4 p-4 pb-24">
            {products.map((product) => (
                <ProductCard key={product.id} product={product} />
            ))}
        </div>
    );
}
