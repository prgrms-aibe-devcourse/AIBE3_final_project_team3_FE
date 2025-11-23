"use client";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ReactQueryProvider from "@/global/components/ReactQueryProvider";
import StompProvider from "@/global/stomp/StompProvider";
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
    <html lang="en" className={isChatPage ? "h-full" : ""}>
      <body
        className={`${inter.className} bg-gray-900 ${
          isChatPage ? "h-full flex flex-col" : ""
        }`}
      >
        <ReactQueryProvider>
          <StompProvider>
            <Header />
            <main className="min-h-screen pt-16 bg-gradient-to-br from-gray-800 via-gray-700 to-gray-600">
              {children}
            </main>
            <Footer />
          </StompProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
