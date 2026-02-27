import React from 'react';
import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import BottomNav from "@/components/BottomNav";
import ScrollToTop from "@/components/ScrollToTop";
import { Analytics } from "@vercel/analytics/next";

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
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://img.icons8.com" />
        <link rel="dns-prefetch" href="https://img.icons8.com" />
        {/* Blocking inline script: apply stored theme before first paint to prevent flash */}
        <script dangerouslySetInnerHTML={{
          __html: `
          (function(){
            try {
              var t = localStorage.getItem('theme');
              var resolved = (t === 'light') ? 'light' : 'dark';
              document.documentElement.classList.toggle('dark', resolved === 'dark');
              document.documentElement.classList.toggle('light', resolved === 'light');
              document.documentElement.style.setProperty('color-scheme', resolved);
            } catch(e){}
          })()
        `}} />
      </head>
      <body
        className={`antialiased bg-[#f0f2f5] dark:bg-black text-gray-900 dark:text-white`}
      >
        <Providers>
          <ScrollToTop />
          <div
            className="mx-auto max-w-md min-h-screen bg-[#f8f9fa] dark:bg-black shadow-sm flex flex-col relative"
            style={{
              paddingTop: 'calc(var(--tg-safe-area-inset-top, 0px) + var(--tg-content-safe-area-inset-top, 0px))',
            }}
          >
            {children}
          </div>
          <BottomNav />
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
