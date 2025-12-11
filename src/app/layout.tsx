"use client";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Toast from "@/components/Toast";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ReactQueryProvider from "@/global/components/ReactQueryProvider";
import StompProvider from "@/global/stomp/StompProvider";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <body className={`${inter.className} app-shell`}>
        <ThemeProvider>
          <LanguageProvider>
            <ReactQueryProvider>
              <StompProvider>
                <div className="flex flex-col min-h-screen">
                  <Header />
                  <main className="app-main flex-1 pt-16">
                    {children}
                  </main>
                  <Footer />
                  <Toast />
                </div>
              </StompProvider>
            </ReactQueryProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}