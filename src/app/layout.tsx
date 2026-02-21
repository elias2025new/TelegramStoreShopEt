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
      <body
        className={`antialiased bg-black text-white overscroll-none`}
      >
        <Providers>
          <div
            className="mx-auto max-w-md min-h-screen bg-black shadow-sm flex flex-col relative overscroll-none transform-gpu"
            style={{
              paddingTop: 'calc(var(--tg-safe-area-inset-top, 0px) + var(--tg-content-safe-area-inset-top, 0px))',
            }}
          >
            {children}
            <BottomNav />
          </div>
        </Providers>
      </body>
    </html>
  );
}
