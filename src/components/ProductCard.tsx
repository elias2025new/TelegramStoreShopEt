
import Image from 'next/image';
import Link from 'next/link';
import { Database } from '@/types/supabase';

type Product = Database['public']['Tables']['products']['Row'];

interface ProductCardProps {
    product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
    return (
        <Link href={`/product/${product.id}`} className="block group">
            <div className="bg-white dark:bg-gray-900 rounded-lg overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 transition-all hover:shadow-md">
                <div className="relative aspect-square w-full bg-gray-100 dark:bg-gray-800">
                    {product.image_url ? (
                        <Image
                            src={product.image_url}
                            alt={product.name}
                            fill
                            className="object-cover object-center group-hover:opacity-90 transition-opacity"
                            sizes="(max-width: 768px) 50vw, 33vw"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                            No Image
                        </div>
                    )}
                </div>
                <div className="p-3">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">
                        {product.name}
                    </h3>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                        {product.category}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                        <span className="text-base font-bold text-gray-900 dark:text-white">
                            {new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB' }).format(product.price)}
                        </span>
                        <button className="bg-blue-600 text-white p-1.5 rounded-full hover:bg-blue-700 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="9" cy="21" r="1" />
                                <circle cx="20" cy="21" r="1" />
                                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </Link>
    );
}
