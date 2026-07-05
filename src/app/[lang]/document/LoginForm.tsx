"use client";

import { useState, useTransition } from "react";
import { loginAction } from "./actions";
import { Lock, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginForm({ lang, dict }: { lang: string, dict: any }) {
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      const result = await loginAction(formData);
      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        router.refresh();
      }
    });
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background effect */}
      <div className="absolute w-[40rem] h-[40rem] bg-[#00f0ff]/10 rounded-full blur-[120px] -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <Link href={`/${lang}`} className="group transition-transform hover:scale-105 mb-6">
            <img 
              src="/logo.png" 
              alt="DXLV Solutions" 
              className="w-auto h-10 object-contain"
            />
          </Link>
          <h1 className="text-2xl font-bold text-center text-white mb-2">Secure Portal</h1>
          <p className="text-gray-400 text-center text-sm">{dict.subtitle}</p>
        </div>

        <div className="glassmorphism border border-white/10 rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <input
                type="password"
                name="password"
                required
                placeholder={dict.placeholder}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff] transition-all"
              />
              {error && <p className="text-[#ff4757] text-sm mt-2 ml-1">{error}</p>}
            </div>
            
            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-gradient-to-r from-[#00f0ff] to-[#7000ff] text-white font-bold rounded-xl py-4 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isPending ? dict.authenticating : dict.submit}
              {!isPending && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>
        </div>
        
        <div className="mt-8 text-center">
          <Link href={`/${lang}`} className="inline-flex items-center gap-2 text-gray-400 hover:text-[#00f0ff] transition-colors text-sm font-medium">
            <ArrowRight className="w-4 h-4 rotate-180" />
            {dict.backHome}
          </Link>
        </div>
      </div>
    </div>
  );
}
