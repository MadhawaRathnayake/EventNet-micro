import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavigationBar from "./components/common/navigationbar";
import Providers from "./Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EventNet", // Updated this to match your brand!
  description: "Event booking application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* EVERYTHING visual must go inside the body tag */}
      <body className="min-h-full flex flex-col">
        <Providers>
          
          {/* 1. Navigation at the top */}
          <NavigationBar />
          
          {/* 2. Main content area (flex-grow pushes the footer down) */}
          <main className="flex-grow">
            {children}
          </main>
          
          {/* 3. Footer at the bottom */}
          <footer className="text-center py-6 text-gray-500 bg-gray-900 text-sm">
            © {new Date().getFullYear()} EventNet. All rights reserved.
          </footer>
          
        </Providers>
      </body>
    </html>
  );
}