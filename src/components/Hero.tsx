"use client";

import { motion } from "framer-motion";
import { ArrowRight, Code2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function Hero({ dict }: { dict: any }) {
  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden bg-grid-pattern">
      {/* Background glowing orbs & Image Layer */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/hero-bg.png"
          alt="Abstract tech background"
          fill
          sizes="100vw"
          quality={60}
          className="object-cover opacity-30 mix-blend-screen"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050505]/80 to-[#050505] z-10" />
      </div>
      
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00f0ff]/20 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-[#7000ff]/20 rounded-full blur-[120px] -z-10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-[#0055ff]/10 rounded-full blur-[150px] -z-10" />

      <div className="container mx-auto px-6 md:px-12 z-20 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-8"
        >
          <Code2 className="w-4 h-4 text-[#00f0ff]" />
          <span className="text-sm font-medium text-gray-300">Leading Technology Solutions</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 leading-tight tracking-tight"
        >
          {dict.title} <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] via-[#0055ff] to-[#7000ff]">{dict.subtitle}</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-gray-400 text-lg md:text-2xl max-w-3xl mx-auto mb-10 font-light"
        >
          {dict.description}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6"
        >
          <button className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white text-black font-bold text-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 cursor-pointer group">
            {dict.viewMore}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          
          <Link href="https://zalo.me/0984852389" target="_blank" className="w-full sm:w-auto px-8 py-4 rounded-xl border border-white/20 bg-white/5 backdrop-blur-sm text-white font-bold text-lg hover:bg-white/10 transition-all hover:border-[#00f0ff]/50 cursor-pointer text-center block">
            {dict.cta}
          </Link>
        </motion.div>
      </div>

      {/* Decorative lines */}
      <div className="absolute left-0 bottom-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="absolute left-1/2 bottom-0 w-[1px] h-32 bg-gradient-to-b from-transparent to-[#00f0ff]/50" />
    </section>
  );
}
