import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "Telegram Storefront",
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
        className={`antialiased bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100`}
        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
      >
        <Providers>
          <div className="mx-auto max-w-md min-h-screen bg-white dark:bg-gray-950 shadow-sm">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
