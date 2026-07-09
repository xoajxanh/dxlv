"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

export default function RootPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (user) router.replace("/chat");
    else router.replace("/login");
  }, [user, isLoading, router]);

  return (
    <div className="h-full flex items-center justify-center" style={{ background: "var(--tg-sidebar)" }}>
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
           style={{ borderColor: "var(--tg-accent)", borderTopColor: "transparent" }} />
    </div>
  );
}
