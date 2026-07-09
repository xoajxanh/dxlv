"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface AvatarProps {
  name: string;
  avatarUrl?: string;
  size?: "sm" | "md" | "lg";
  online?: boolean;
  className?: string;
}

const sizeMap = { sm: "w-10 h-10 text-sm", md: "w-12 h-12 text-base", lg: "w-16 h-16 text-xl" };

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

function getColor(name: string) {
  const colors = [
    "#2b5278","#1c6e5c","#5c3d7a","#7a3d3d","#3d5c7a",
    "#7a5c3d","#3d7a5c","#5c7a3d","#7a3d5c","#3d3d7a"
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export function Avatar({ name, avatarUrl, size = "md", online, className }: AvatarProps) {
  return (
    <div className={cn("relative flex-shrink-0", className)}>
      <div className={cn("rounded-full flex items-center justify-center font-semibold text-white overflow-hidden", sizeMap[size])}
           style={{ background: getColor(name) }}>
        {avatarUrl
          ? <Image src={avatarUrl} alt={name} width={64} height={64} className="w-full h-full object-cover" />
          : getInitials(name)}
      </div>
      {online && (
        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
              style={{ background: "var(--tg-online)", borderColor: "var(--tg-sidebar)" }} />
      )}
    </div>
  );
}
