import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import fs from "fs";
import path from "path";

// Basic MIME types map
const mimeTypes: Record<string, string> = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
  ".txt": "text/plain",
};

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ path: string[] }> }
) {
  // 1. Kiểm tra xác thực (Cookie)
  const cookieStore = await cookies();
  const token = cookieStore.get("dxlv_secure_doc_token");

  if (!token || token.value !== "authorized") {
    return new NextResponse("401 Unauthorized - Vui lòng đăng nhập qua cổng nội bộ.", {
      status: 401,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  // 2. Xây dựng đường dẫn file tuyệt đối
  const params = await props.params;
  const filePathArray = params.path || [];
  const safePath = path.join(...filePathArray);
  
  // Tránh truy cập ngược (Directory Traversal Attack) bằng cách đảm bảo path đã được normalize
  // path.join sẽ xử lý các '../', nhưng ta nên nối thêm base dir để lấy đường dẫn tuyệt đối
  const baseDir = path.join(process.cwd(), "secure_docs");
  const fullPath = path.join(baseDir, safePath);

  // Đảm bảo file nằm trong thư mục secure_docs (tránh hacker dùng path manipulation)
  if (!fullPath.startsWith(baseDir)) {
    return new NextResponse("403 Forbidden", { status: 403 });
  }

  // 3. Kiểm tra file tồn tại
  try {
    const stat = await fs.promises.stat(fullPath);
    if (!stat.isFile()) {
      return new NextResponse("403 Forbidden - Không thể đọc thư mục trực tiếp", { status: 403 });
    }
  } catch (error) {
    return new NextResponse("404 Not Found - File không tồn tại", { status: 404 });
  }

  // 4. Đọc file và xác định Content-Type
  const fileBuffer = await fs.promises.readFile(fullPath);
  const ext = path.extname(fullPath).toLowerCase();
  const contentType = mimeTypes[ext] || "application/octet-stream";

  // 5. Trả về file cho trình duyệt
  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      // Có thể thêm Cache-Control nếu muốn
      "Cache-Control": "private, max-age=3600",
    },
  });
}
