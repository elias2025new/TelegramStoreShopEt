import React from 'react';
import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "CROWN SHOES & CLOTHES",
  description: "Mini App Storefront",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://img.icons8.com" />
        <link rel="dns-prefetch" href="https://img.icons8.com" />
      </head>
      <body
        className={`antialiased bg-[#f0f2f5] dark:bg-black text-gray-900 dark:text-white transition-colors duration-300`}
      >
        <Providers>
          <div
            className="mx-auto max-w-md min-h-screen bg-[#f8f9fa] dark:bg-black shadow-sm flex flex-col relative transition-colors duration-300"
            style={{
              paddingTop: 'calc(var(--tg-safe-area-inset-top, 0px) + var(--tg-content-safe-area-inset-top, 0px))',
            }}
          >
            {children}
          </div>
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
