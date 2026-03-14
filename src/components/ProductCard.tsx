import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Database } from '@/types/supabase';
import { useFavorites } from '@/context/FavoritesContext';
import { useRouter } from 'next/navigation';
import { useTelegram } from '@/hooks/useTelegram';
import { isOutOfStock } from '@/utils/stock';

type Product = Database['public']['Tables']['products']['Row'];

interface ProductCardProps {
    product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
    const { toggleFavorite, isFavorite } = useFavorites();
    const router = useRouter();
    const { hapticFeedback } = useTelegram();
    const active = isFavorite(product.id);
    // Generate a visual pseudo-discount for the UI demo based on ID string length
    const discount = product.id ? ((product.id.length % 3) + 1) * 10 : 20;
    const oldPrice = product.price * (1 + (discount / 100));
    // Generate a visual rating placeholder
    const rating = product.id ? (4 + (product.id.length % 10) / 10).toFixed(1) : "4.5";

    const stockProduct = {
        sizes: product.sizes,
        stock: product.stock as Record<string, number> | null,
        quantity: (product as any).quantity ?? 1,
        gender: product.gender,
    };
    const outOfStock = isOutOfStock(stockProduct);

    const handleQuickAdd = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (outOfStock) return;
        // Navigate to product detail so user can select size before adding to cart
        hapticFeedback('light');
        router.push(`/product/${product.id}`);
    };

    return (
        <Link href={`/product/${product.id}`} className="block group h-full transform-gpu active:scale-[0.98] transition-all duration-200">
            <div className="bg-card-bg rounded-xl overflow-hidden border border-border-color transition-colors hover:brightness-95 dark:hover:brightness-110 flex flex-col h-full shadow-sm dark:shadow-none">

                {/* Image Section */}
                <div className="relative aspect-square w-full bg-background/50">
                    {/* Discount Badge */}
                    <div className="absolute top-1.5 left-1.5 z-10 bg-black/10 dark:bg-white/10 backdrop-blur-md px-1.5 py-[1px] rounded text-[9px] font-bold text-gray-900 dark:text-white">
                        -{discount}%
                    </div>

                    {/* Favorite Button */}
                    <button
                        className={`absolute top-1.5 right-1.5 z-10 w-6 h-6 rounded-full flex items-center justify-center shadow-sm transform-gpu active:scale-90 transition-all duration-200 ease-out ${active ? 'bg-[#cba153] scale-110' : 'bg-white/90'
                            }`}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleFavorite(product);
                            hapticFeedback('medium');
                        }}
                    >
                        <img
                            src={active ? "https://img.icons8.com/ios-filled/50/ffffff/hearts.png" : "https://img.icons8.com/ios-filled/50/222222/hearts.png"}
                            alt="heart"
                            className="w-3.5 h-3.5"
                        />
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

                    {/* Out of Stock Overlay */}
                    {outOfStock && (
                        <div className="absolute inset-0 z-20 bg-black/55 backdrop-blur-[2px] flex items-center justify-center">
                            <span className="px-3 py-1 bg-black/80 border border-white/20 text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                                Out of Stock
                            </span>
                        </div>
                    )}
                </div>

                {/* Content Section */}
                <div className="p-2 flex flex-col flex-grow">
                    <h3 className="text-xs font-medium text-gray-900 dark:text-white line-clamp-1">
                        {product.name}
                    </h3>

                    <div className="mt-0.5 flex items-baseline gap-1.5">
                        <span className="text-xs font-bold text-gray-900 dark:text-white">
                            {new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', maximumFractionDigits: 0 }).format(product.price)}
                        </span>
                        <span className="text-[9px] text-gray-400 dark:text-gray-500 line-through">
                            {new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', maximumFractionDigits: 0 }).format(oldPrice)}
                        </span>
                    </div>

                    <div className="mt-auto pt-1.5 flex items-center justify-between">
                        <div className="flex items-center gap-0.5">
                            <div className="flex text-[#cba153]">
                                <span className="text-[8px]">★★★★</span>
                                <span className="text-[8px] text-gray-600">★</span>
                            </div>
                            <span className="text-[9px] text-gray-400">{rating}</span>
                        </div>

                        <button
                            className={`text-[10px] font-bold px-2 py-1 rounded-md transform-gpu active:scale-90 transition-all duration-200 ${outOfStock
                                ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed border border-gray-200 dark:border-gray-700'
                                : 'text-[#cba153] bg-[#cba153]/10 border border-[#cba153]/20 hover:bg-[#cba153]/20'
                                }`}
                            onClick={handleQuickAdd}
                            disabled={outOfStock}
                        >
                            {outOfStock ? 'Sold Out' : '+ Add'}
                        </button>
                    </div>
                </div>
            </div>
        </Link>
    );
}
