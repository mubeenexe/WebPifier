import Link from "next/link";
import { Github } from "lucide-react";
import React from "react";

const Header = () => (
    <header className="w-full z-20 bg-background/80 border-b sticky top-0 backdrop-blur flex flex-col items-center px-4 py-4 shadow-sm rounded-none">
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

export default Header; 