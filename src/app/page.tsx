"use client";

import ImageConverter from "@/components/image-converter";
import { Button } from "@/components/ui/button";
import { ArrowDown } from "lucide-react";
import { motion } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";

export default function Home() {
  const converterRef = useRef<HTMLDivElement>(null);

  // Smooth scroll handler
  const handleGetStarted = (e: React.MouseEvent) => {
    e.preventDefault();
    converterRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main className="flex min-h-screen w-full flex-col items-center bg-background p-0">
      <HeroSection onGetStarted={handleGetStarted} />
      <div
        ref={converterRef}
        id="converter"
        className="w-full flex items-center justify-center px-4 sm:px-6 md:px-8 -mt-16 z-10"
      >
        <ImageConverter />
      </div>
      <FeaturesSection />
    </main>
  );
}

function HeroSection({
  onGetStarted,
}: {
  onGetStarted: (e: React.MouseEvent) => void;
}) {
  return (
    <section className="relative w-full flex flex-col items-center justify-center min-h-[60vh] py-20 bg-gradient-to-br from-primary/10 to-accent/30 text-center mb-8">
      <motion.h1
        className="text-5xl sm:text-6xl font-extrabold tracking-tight text-foreground drop-shadow-lg mb-4"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1 }}
      >
        Effortless Image Conversion
      </motion.h1>
      <motion.p
        className="text-lg sm:text-2xl text-muted-foreground max-w-2xl mx-auto mb-8"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.3 }}
      >
        Instantly convert your images to and from the modern WebP format. Fast,
        free, and privacy-friendly.
      </motion.p>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.7 }}
        className="mt-6 flex gap-4"
      >
        <motion.a
          href="#converter"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          onClick={onGetStarted}
        >
          <Button size="lg" className="px-8 py-4 text-lg font-semibold shadow-lg">
            Get Started
            <ArrowDown className="ml-2 h-5 w-5 animate-bounce" />
          </Button>
        </motion.a>
        <Link href="/compress">
          <Button
            size="lg"
            variant="outline"
            className="px-8 py-4 text-lg font-semibold border-primary text-primary hover:bg-primary/10 shadow-md hover:shadow-xl transition-all duration-200"
          >
            Try File Compressor
          </Button>
        </Link>
      </motion.div>
      <div className="absolute inset-0 pointer-events-none select-none bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent opacity-40" />
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      title: "Batch Conversion",
      description:
        "Convert up to 10 images at once. Save time and boost productivity with bulk processing.",
      icon: <ArrowDown className="h-8 w-8 text-primary" />,
    },
    {
      title: "Privacy First",
      description:
        "Your images never leave your browser. All conversions are done locally for maximum privacy.",
      icon: <span className="inline-block h-8 w-8 text-primary">🔒</span>,
    },
    {
      title: "Lightning Fast",
      description:
        "Enjoy instant conversions with no waiting or loading screens. Powered by modern web tech.",
      icon: <span className="inline-block h-8 w-8 text-primary">⚡</span>,
    },
    {
      title: "Free & Open Source",
      description:
        "No sign-up, no ads, no cost. 100% open source and available on GitHub.",
      icon: <span className="inline-block h-8 w-8 text-primary">🌐</span>,
    },
  ];
  return (
    <section className="w-full max-w-5xl mx-auto py-16 px-4">
      <motion.h2
        className="text-3xl sm:text-4xl font-bold text-center mb-8"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        Features
      </motion.h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
        {features.map((feature, idx) => (
          <motion.div
            key={idx}
            className="bg-card border rounded-xl p-6 flex flex-col items-center text-center shadow-md hover:shadow-xl transition-shadow"
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: idx * 0.15 + 0.2 }}
          >
            <div className="mb-4">{feature.icon}</div>
            <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
            <p className="text-muted-foreground text-base">
              {feature.description}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
