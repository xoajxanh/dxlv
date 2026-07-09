interface AuthIllustrationProps {
  headline: string;
  subtitle: string;
}

export function AuthIllustration({ headline, subtitle }: AuthIllustrationProps) {
  return (
    <div className="hidden md:flex flex-col justify-center items-center p-10 bg-gradient-to-br from-[#182533] via-[#17212B] to-[#2B5278]/20 relative border-r border-[#304050]/20">
      {/* Subtle dot grid */}
      <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#3390ec_1px,transparent_1px)] [background-size:16px_16px]" />

      {/* Animated SVG */}
      <div className="w-64 h-64 relative flex items-center justify-center mb-8">
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full text-[#3390EC] animate-pulse"
          style={{ animationDuration: "6s" }}
        >
          <path d="M40,100 Q100,20 160,100 T160,150" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 6" opacity="0.3" />
          <path d="M20,70 Q100,180 180,70"          fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 5" opacity="0.2" />
          <circle cx="40"  cy="100" r="4"   fill="currentColor" opacity="0.6" />
          <circle cx="160" cy="100" r="5"   fill="currentColor" opacity="0.7" />
          <circle cx="100" cy="40"  r="3"   fill="currentColor" opacity="0.5" />
          <circle cx="100" cy="150" r="4.5" fill="currentColor" opacity="0.8" />
          <rect x="70" y="70" width="60" height="60" rx="18" fill="currentColor" />
          <path
            d="M88,94 L88,106 Q88,108 90,108 L98,108 L104,113 L104,108 L110,108 Q112,108 112,106 L112,94 Q112,92 110,92 L90,92 Q88,92 88,94 Z"
            fill="#FFFFFF"
          />
          <circle cx="100" cy="100" r="50" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.4" strokeDasharray="10 5" />
        </svg>
      </div>

      <div className="text-center max-w-xs relative z-10 space-y-3">
        <h2 className="text-2xl font-bold text-white tracking-tight leading-tight">{headline}</h2>
        <p className="text-sm text-slate-400 leading-relaxed">{subtitle}</p>
      </div>
    </div>
  );
}
