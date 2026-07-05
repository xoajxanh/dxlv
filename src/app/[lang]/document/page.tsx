import { cookies } from "next/headers";
import LoginForm from "./LoginForm";
import fs from "fs";
import path from "path";
import Link from "next/link";
import { logoutAction } from "./actions";
import { Folder, FileText, LogOut, ShieldCheck } from "lucide-react";
import { getDictionary } from "@/i18n/get-dictionary";

// Hàm đệ quy để đọc cấu trúc thư mục
function getDirectoryTree(dirPath: string, basePath = "") {
  if (!fs.existsSync(dirPath)) return [];
  
  const items = fs.readdirSync(dirPath, { withFileTypes: true });
  const tree: any[] = [];
  
  for (const item of items) {
    const itemPath = path.join(dirPath, item.name);
    const relativePath = path.posix.join(basePath, item.name);
    
    if (item.isDirectory()) {
      tree.push({
        type: "directory",
        name: item.name,
        path: relativePath,
        children: getDirectoryTree(itemPath, relativePath),
      });
    } else {
      tree.push({
        type: "file",
        name: item.name,
        path: relativePath,
      });
    }
  }
  
  // Sort: folders first, then files
  return tree.sort((a, b) => {
    if (a.type === b.type) return a.name.localeCompare(b.name);
    return a.type === "directory" ? -1 : 1;
  });
}

// Component render đệ quy cây thư mục
function FileTree({ items, level = 0, emptyText }: { items: any[], level?: number, emptyText: string }) {
  if (items.length === 0) {
    return <p className="text-gray-500 italic text-sm py-2">{emptyText}</p>;
  }

  return (
    <ul className={`space-y-2 ${level > 0 ? "ml-6 border-l border-white/10 pl-4 mt-2" : ""}`}>
      {items.map((item, index) => (
        <li key={index}>
          {item.type === "directory" ? (
            <div className="mb-2">
              <div className="flex items-center gap-2 text-white font-medium py-2">
                <Folder className="w-5 h-5 text-[#00f0ff]" />
                {item.name}
              </div>
              <FileTree items={item.children} level={level + 1} emptyText={emptyText} />
            </div>
          ) : (
            <Link 
              href={`/api/docs/${item.path}`} 
              target="_blank"
              className="flex items-center gap-2 text-gray-300 hover:text-[#00f0ff] py-1.5 transition-colors group"
            >
              <FileText className="w-4 h-4 text-gray-500 group-hover:text-[#00f0ff] transition-colors" />
              {item.name}
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
}

export default async function DocumentPage({ params }: { params: Promise<{ lang: string }> }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("dxlv_secure_doc_token");
  const { lang } = await params;
  const dict = await getDictionary(lang as "en" | "vi");

  // Nếu không có token -> Render trang Đăng nhập
  if (!token || token.value !== "authorized") {
    return <LoginForm lang={lang} dict={dict.login} />;
  }

  // Nếu có token -> Đọc thư mục secure_docs
  const secureDocsPath = path.join(process.cwd(), "secure_docs");
  let tree = [];
  try {
    tree = getDirectoryTree(secureDocsPath);
  } catch (error) {
    console.error("Error reading secure_docs", error);
  }

  return (
    <div className="min-h-screen bg-black pt-32 pb-20 px-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-[#7000ff]/10 rounded-full blur-[150px] -z-10" />
      
      <div className="container mx-auto max-w-4xl">
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
              <div className="w-10 h-10 rounded-xl bg-[#00f0ff]/10 border border-[#00f0ff]/20 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-[#00f0ff]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Secure Portal</h1>
                <p className="text-gray-400 text-xs">{dict.document.subtitle}</p>
              </div>
            </div>
          </div>
          
          <form action={logoutAction}>
            <button type="submit" className="flex items-center gap-2 text-gray-400 hover:text-[#ff4757] transition-colors px-4 py-2 rounded-lg hover:bg-white/5">
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">{dict.document.logout}</span>
            </button>
          </form>
        </div>

        <div className="glassmorphism border border-white/10 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Folder className="w-5 h-5 text-gray-400" />
            secure_docs/
          </h2>
          
          <div className="bg-black/40 border border-white/5 rounded-xl p-6">
            <FileTree items={tree} emptyText={dict.document.empty} />
          </div>
        </div>
      </div>
    </div>
  );
}
