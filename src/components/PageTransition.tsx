'use client';

import React, { useEffect } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

interface PageTransitionProps {
    children: React.ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
    const pathname = usePathname();

    useEffect(() => {
        // Reset scroll position to top on pathname changes
        if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0, behavior: 'instant' });
        }
    }, [pathname]);

    return (
        <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{
                    duration: 0.25,
                    ease: "easeOut"
                }}
                className="w-full flex-1 flex flex-col"
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
}
