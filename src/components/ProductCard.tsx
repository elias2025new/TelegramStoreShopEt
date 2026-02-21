
import Image from 'next/image';
import Link from 'next/link';
import { Database } from '@/types/supabase';
import { Heart } from 'lucide-react';

type Product = Database['public']['Tables']['products']['Row'];

interface ProductCardProps {
    product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
    // Generate a visual pseudo-discount for the UI demo based on ID string length
    const discount = product.id ? ((product.id.length % 3) + 1) * 10 : 20;
    const oldPrice = product.price * (1 + (discount / 100));
    // Generate a visual rating placeholder
    const rating = product.id ? (4 + (product.id.length % 10) / 10).toFixed(1) : "4.5";

    return (
        <Link href={`/product/${product.id}`} className="block group h-full transform-gpu active:scale-[0.98] transition-all duration-200">
            <div className="bg-[#1c1c1e] rounded-xl overflow-hidden border border-[#2a2a2a] transition-colors hover:bg-[#222222] flex flex-col h-full">

                {/* Image Section */}
                <div className="relative aspect-[4/5] w-full bg-[#111111]">
                    {/* Discount Badge */}
                    <div className="absolute top-2 left-2 z-10 bg-white/10 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold text-white">
                        -{discount}%
                    </div>

                    {/* Favorite Button */}
                    <button
                        className="absolute top-2 right-2 z-10 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-sm text-gray-800 transform-gpu active:scale-90 transition-transform duration-200 ease-out"
                        onClick={(e) => e.preventDefault()}
                    >
                        <Heart size={16} fill="currentColor" />
                    </button>

                    {product.image_url ? (
                        <Image
                            src={product.image_url}
                            alt={product.name}
                            fill
                            className="object-cover object-center"
                            sizes="(max-width: 768px) 50vw, 33vw"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-600">
                            No Image
                        </div>
                    )}
                </div>

                {/* Content Section */}
                <div className="p-3 flex flex-col flex-grow">
                    <h3 className="text-sm font-medium text-white line-clamp-1">
                        {product.name}
                    </h3>

                    <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-sm font-bold text-white">
                            {new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', maximumFractionDigits: 0 }).format(product.price)}
                        </span>
                        <span className="text-[10px] text-gray-500 line-through">
                            {new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', maximumFractionDigits: 0 }).format(oldPrice)}
                        </span>
                    </div>

                    <div className="mt-auto pt-2 flex items-center justify-between">
                        <div className="flex items-center gap-1">
                            <div className="flex text-[#cba153]">
                                <span className="text-[10px]">★★★★</span>
                                <span className="text-[10px] text-gray-600">★</span>
                            </div>
                            <span className="text-[10px] text-gray-400">{rating}</span>
                        </div>

                        <button
                            className="text-xs text-gray-300 font-medium px-2 py-1 bg-[#2a2a2a] rounded hover:text-white transform-gpu active:scale-90 transition-all duration-200"
                            onClick={(e) => { e.preventDefault(); /* Add to cart logic here */ }}
                        >
                            + Add
                        </button>
                    </div>
                </div>
            </div>
        </Link>
    );
}
