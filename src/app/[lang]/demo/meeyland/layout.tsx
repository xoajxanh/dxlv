import { AuthProvider } from "@/lib/meeyland/AuthContext";
import { Toaster } from "@/components/ui/meeyland/sonner";

export default function MeeylandLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="meeyland-theme h-full w-full overflow-hidden bg-background text-foreground">
      <AuthProvider>
        {children}
      </AuthProvider>
      <Toaster position="top-center" richColors />
    </div>
  );
}
