"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Menu, X, ChevronRight, Globe } from "lucide-react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

export default function Navbar({ dict, lang }: { dict: any; lang: string }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const navLinks = [
    { name: dict.home, href: `/${lang}/#home` },
    { name: dict.about, href: `/${lang}/#about` },
    { name: dict.tech, href: `/${lang}/#tech` },
    { name: dict.services, href: `/${lang}/#services` },
  ];

  const switchLanguage = () => {
    const newLang = lang === "vi" ? "en" : "vi";
    // Thay thế lang hiện tại trên pathname bằng lang mới
    const newPathname = pathname.replace(`/${lang}`, `/${newLang}`);
    router.push(newPathname || `/${newLang}`);
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 animate-slide-down ${
        isScrolled ? "glassmorphism py-4" : "bg-transparent py-6"
      }`}
    >
      <div className="container mx-auto px-6 md:px-12 flex items-center justify-between">
        <Link href={`/${lang}/#home`} className="flex items-center gap-2 group">
          <Image 
            src="/logo.png" 
            alt="DXLV Solutions" 
            width={160} 
            height={60} 
            className="object-contain w-auto h-auto opacity-90 group-hover:opacity-100 transition-all hover:scale-105 duration-300"
            priority
            loading="eager"
          />
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-gray-300 hover:text-white transition-colors text-sm font-medium hover:text-glow-cyan"
            >
              {link.name}
            </Link>
          ))}
          
          <div className="flex items-center gap-4 border-l border-white/20 pl-4">
            <button 
              onClick={switchLanguage}
              className="flex items-center gap-2 text-sm font-bold text-gray-300 hover:text-[#00f0ff] transition-colors"
            >
              <Globe className="w-4 h-4" />
              {lang.toUpperCase()}
            </button>
            <Link href="https://zalo.me/0984852389" target="_blank" className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-6 py-2.5 rounded-full text-sm font-medium transition-all hover:border-[#00f0ff] hover:shadow-[0_0_15px_rgba(0,240,255,0.4)] flex items-center gap-2 group cursor-pointer">
              {dict.contact}
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Mobile Nav Toggle */}
        <div className="md:hidden flex items-center gap-4">
          <button 
            onClick={switchLanguage}
            className="flex items-center gap-2 text-sm font-bold text-gray-300 hover:text-[#00f0ff] transition-colors"
          >
            <Globe className="w-4 h-4" />
            {lang.toUpperCase()}
          </button>
          <button
            className="text-white cursor-pointer"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden absolute top-full left-0 right-0 glassmorphism border-t border-white/10 p-6 flex flex-col gap-4"
        >
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-gray-300 hover:text-white py-2 font-medium"
            >
              {link.name}
            </Link>
          ))}
          <Link href="https://zalo.me/0984852389" target="_blank" className="bg-gradient-to-r from-[#00f0ff] to-[#7000ff] text-white px-6 py-3 rounded-xl text-sm font-bold mt-4 cursor-pointer text-center block">
            {dict.contact}
          </Link>
        </motion.div>
      )}
    </nav>
  );
}
