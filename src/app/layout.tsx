import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ReactQueryProvider from "@/global/components/ReactQueryProvider";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "English Chat Site",
  description: "Learn English through AI-powered chat conversations",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-900`}>
        <ReactQueryProvider>
          <Header />
          <main className="min-h-screen pt-16 bg-gradient-to-br from-gray-800 via-gray-700 to-gray-600">
            {children}
          </main>
          <Footer />
        </ReactQueryProvider>
      </body>
    </html>
  );
}
