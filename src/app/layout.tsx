import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import Navbar from "../components/Navbar";
import SpotlightBackground from "../components/SpotlightBackground";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StellarSure | Smart Contract Insurance Platform",
  description: "Web3 Insurance Processing DApp built on Stellar using Soroban smart contracts",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark selection:bg-zinc-800 selection:text-zinc-100" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-950 text-zinc-100 min-h-screen flex flex-col dot-pattern`}
      >
        <SpotlightBackground />
        <Providers>
          <Navbar />
          <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 relative z-10">
            {children}
          </main>
          <footer className="border-t border-zinc-900 bg-zinc-950 py-6 text-center text-xs text-zinc-600 relative z-10">
            &copy; {new Date().getFullYear()} StellarSure. Powered by Soroban & Stellar SDKs.
          </footer>
        </Providers>
      </body>
    </html>
  );
}
