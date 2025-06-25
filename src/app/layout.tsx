import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Inter } from "next/font/google";
import Script from "next/script";
import Link from "next/link";
import { Github } from "lucide-react";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "WebPifier",
  description: "Convert images to and from WebP format with ease.",
  other: {
    "google-adsense-account": "ca-pub-9647570304263055",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-body antialiased">
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9647570304263055"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <Header />
        {children}
        <Footer />
        <Toaster />
      </body>
    </html>
  );
}

function Header() {
  return (
    <header className="w-full z-20 bg-background/80 border-b sticky top-0 backdrop-blur flex flex-col items-center px-4 py-4 shadow-sm">
      <div className="flex w-full max-w-5xl items-center justify-between mx-auto">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-2xl font-extrabold tracking-tight text-primary drop-shadow-sm">WebPifier</Link>
          <span className="hidden sm:inline text-muted-foreground text-base font-medium ml-2">Effortless Image & Doc Conversion</span>
        </div>
        <a
          href="https://github.com/mubeenexe/WebPifier"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md border bg-card hover:bg-accent transition-colors text-sm font-semibold shadow-sm"
        >
          <Github className="w-4 h-4" />
          GitHub
        </a>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="w-full mt-12 border-t bg-background/80 py-6 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
      <span>
        <b>WebPifier</b> &copy; {new Date().getFullYear()} — Effortlessly
        convert images to and from WebP.
      </span>
      <a
        href="https://github.com/mubeenexe/WebPifier"
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-primary transition-colors"
      >
        View on GitHub
      </a>
    </footer>
  );
}
