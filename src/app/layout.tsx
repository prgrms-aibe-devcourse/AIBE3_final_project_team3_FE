"use client";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ReactQueryProvider from "@/global/components/ReactQueryProvider";
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
          <Header />
          <main
            className={
              isChatPage
                ? "flex-1 bg-gradient-to-br from-gray-800 via-gray-700 to-gray-600"
                : "min-h-screen pt-16 bg-gradient-to-br from-gray-800 via-gray-700 to-gray-600"
            }
          >
            {children}
          </main>
          {isChatPage ? null : <Footer />}
        </ReactQueryProvider>
      </body>
    </html>
  );
}
