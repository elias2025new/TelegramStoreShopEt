'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { motion, useAnimation } from 'framer-motion';
import { useCart } from '@/context/CartContext';

export default function CartIcon() {
    const { totalItems } = useCart();
    const controls = useAnimation();

    useEffect(() => {
        if (totalItems > 0) {
            controls.start({
                scale: [1, 1.3, 1],
                transition: { duration: 0.3 }
            });
        }
    }, [totalItems, controls]);

    return (
        <Link href="/cart" className="relative group p-1">
            <motion.div animate={controls} className="relative">
                <img
                    src="https://img.icons8.com/ios-filled/50/ffffff/shopping-cart.png"
                    alt="cart"
                    className="w-6 h-6 group-hover:brightness-75 transition-all"
                />
                {totalItems > 0 && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border border-black"
                    >
                        {totalItems}
                    </motion.span>
                )}
            </motion.div>
        </Link>
    );
}
