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
        <Link href="/cart" className="relative group flex items-center justify-center">
            <motion.div animate={controls} className="relative flex items-center justify-center">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-gray-900 dark:text-white group-hover:text-[#cba153] transition-colors"
                >
                    <circle cx="8" cy="21" r="1" />
                    <circle cx="19" cy="21" r="1" />
                    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                </svg>
                {totalItems > 0 && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-2 -right-2 flex h-4.5 w-4.5 min-w-[18px] min-h-[18px] items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-white dark:border-black shadow-lg px-1"
                    >
                        {totalItems}
                    </motion.span>
                )}
            </motion.div>
        </Link>
    );
}
