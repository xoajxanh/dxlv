import { cookies } from "next/headers";
import LoginForm from "./LoginForm";
import Link from "next/link";
import { logoutAction } from "./actions";
import { Folder, LogOut, ShieldCheck, MessageSquare, ExternalLink, Cpu } from "lucide-react";
import { getDictionary } from "@/i18n/get-dictionary";

export default async function DemoPage({ params }: { params: Promise<{ lang: string }> }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("dxlv_secure_demo_token");
  const { lang } = await params;
  const dict = await getDictionary(lang as "en" | "vi");

  // If not authorized, render LoginForm
  if (!token || token.value !== "authorized") {
    // Pass both login and demo dictionaries to LoginForm
    return <LoginForm lang={lang} dict={{ login: dict.login, demo: dict.demo }} />;
  }

  // Define the demo projects list
  const demos = [
    {
      id: "meeyland",
      title: "Meeyland — Chat & Calls",
      description: lang === "vi"
        ? "Ứng dụng nhắn tin Telegram-style thời gian thực, chat nhóm, hiển thị trạng thái đang soạn thảo, thông báo đã xem và cuộc gọi video đa người dùng tích hợp SignalR, LiveKit, và backend .NET Core."
        : "Telegram-style real-time messaging, group chats, typing indicators, read receipts, and multi-user video calls utilizing SignalR, LiveKit, and .NET Core backend.",
      icon: <MessageSquare className="w-8 h-8 text-[#00f0ff]" />,
      launchUrl: `/${lang}/demo/meeyland`,
      techStack: [".NET 10", "ASP.NET Core", "SignalR", "Next.js", "React", "LiveKit", "Docker"]
    }
  ];

  return (
    <div className="min-h-screen bg-black pt-32 pb-20 px-6 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-[#7000ff]/10 rounded-full blur-[150px] -z-10" />
      <div className="absolute bottom-0 left-0 w-[30rem] h-[30rem] bg-[#00f0ff]/5 rounded-full blur-[120px] -z-10" />

      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-12 border-b border-white/10 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <Link href={`/${lang}`} className="flex items-center group transition-transform hover:scale-105">
              <img
                src="/logo.png"
                alt="DXLV Solutions"
                className="w-auto h-8 object-contain"
              />
            </Link>
            <div className="hidden sm:block w-px h-8 bg-white/20"></div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#7000ff]/10 border border-[#7000ff]/20 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-[#7000ff]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Demo Portal</h1>
                <p className="text-gray-400 text-xs">{dict.demo.subtitle}</p>
              </div>
            </div>
          </div>

          <form action={logoutAction.bind(null, lang)}>
            <button type="submit" className="flex items-center gap-2 text-gray-400 hover:text-[#ff4757] transition-colors px-4 py-2 rounded-lg hover:bg-white/5">
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">{dict.demo.logout}</span>
            </button>
          </form>
        </div>

        {/* Dashboard Grid */}
        <div className="space-y-8">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Folder className="w-6 h-6 text-[#00f0ff]" />
              {dict.demo.title}
            </h2>
            <p className="text-gray-400 text-sm">{dict.demo.description}</p>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {demos.map((demo) => (
              <div
                key={demo.id}
                className="glassmorphism border border-white/10 rounded-3xl p-8 hover:border-white/20 hover:bg-white/[0.03] transition-all group shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
              >
                {/* Visual card highlight */}
                <div className="absolute top-0 right-0 w-64 h-64 opacity-20 rounded-full pointer-events-none bg-gradient-to-br from-[#00f0ff]/20 to-transparent blur-3xl group-hover:opacity-40 transition-opacity" />

                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                      {demo.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white group-hover:text-[#00f0ff] transition-colors">
                        {demo.title}
                      </h3>
                      <div className="flex flex-wrap gap-2 mt-1.5">
                        {demo.techStack.map((tech) => (
                          <span
                            key={tech}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/5 border border-white/5 text-[#94a3b8]"
                          >
                            <Cpu className="w-3 h-3 text-[#7000ff]" />
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-400 text-sm leading-relaxed max-w-2xl">
                    {demo.description}
                  </p>
                </div>

                <Link
                  href={demo.launchUrl}
                  className="px-6 py-4 rounded-xl bg-gradient-to-r from-[#00f0ff] to-[#7000ff] text-white font-bold flex items-center gap-2 hover:opacity-90 transition-opacity shadow-lg shadow-cyan-950/20 shrink-0 w-full md:w-auto justify-center"
                >
                  <span>Launch Demo</span>
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
