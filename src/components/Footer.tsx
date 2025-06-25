import React from "react";

const Footer = () => (
    <footer className="w-full mt-12 border-t bg-background/80 py-6 text-center text-muted-foreground text-sm flex flex-col items-center gap-2 rounded-none">
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

export default Footer; 