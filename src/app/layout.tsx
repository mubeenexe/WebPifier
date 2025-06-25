import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Inter } from "next/font/google";
import Script from "next/script";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "WebPifier",
  description: "Convert images to and from WebP format with ease.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <meta name="google-adsense-account" content="ca-pub-9647570304263055" />
      <Script
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9647570304263055"
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />
      <body className="font-body antialiased">
        {children}
        <Footer />
        <Toaster />
      </body>
    </html>
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
