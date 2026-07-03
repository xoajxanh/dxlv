"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Menu, X, ChevronRight } from "lucide-react";
import Image from "next/image";

const navLinks = [
  { name: "Trang chủ", href: "#home" },
  { name: "Về chúng tôi", href: "#about" },
  { name: "Công nghệ", href: "#tech" },
  { name: "Dịch vụ", href: "#services" },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "glassmorphism py-4" : "bg-transparent py-6"
      }`}
    >
      <div className="container mx-auto px-6 md:px-12 flex items-center justify-between">
        <Link href="#home" className="flex items-center gap-2 group">
          <Image 
            src="/logo.jpg" 
            alt="DXLV Solutions" 
            width={120} 
            height={40} 
            className="object-contain opacity-90 group-hover:opacity-100 transition-opacity rounded-xl"
            priority
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
          <button className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-6 py-2.5 rounded-full text-sm font-medium transition-all hover:border-[#00f0ff] hover:shadow-[0_0_15px_rgba(0,240,255,0.4)] flex items-center gap-2 group cursor-pointer">
            Liên hệ ngay
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Mobile Nav Toggle */}
        <button
          className="md:hidden text-white cursor-pointer"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
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
          <button className="bg-gradient-to-r from-[#00f0ff] to-[#7000ff] text-white px-6 py-3 rounded-xl text-sm font-bold mt-4 cursor-pointer">
            Liên hệ ngay
          </button>
        </motion.div>
      )}
    </motion.nav>
  );
}
