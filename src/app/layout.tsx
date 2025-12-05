"use client";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Toast from "@/components/Toast";
import ReactQueryProvider from "@/global/components/ReactQueryProvider";
import StompProvider from "@/global/stomp/StompProvider";
import { LanguageProvider } from "@/contexts/LanguageContext";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { usePathname } from "next/navigation";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isChatPage = pathname.startsWith("/chat");

  return (
    <html lang="en" className="h-full bg-gray-900">
      <body className={`${inter.className} h-full`}>
        <LanguageProvider>
          <ReactQueryProvider>
            <StompProvider>
              <div className="flex flex-col h-full">
                <Header />
                <main className="flex-1 bg-gradient-to-br from-gray-800 via-gray-700 to-gray-600 pt-16">
                  {children}
                </main>
                <Footer />
                <Toast />
              </div>
            </StompProvider>
          </ReactQueryProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}