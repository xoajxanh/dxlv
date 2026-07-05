import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: "CÔNG TY TNHH DỊCH VỤ VÀ TƯ VẤN DXLV",
  description: "DXLV CO., LTD - Giải pháp công nghệ toàn diện cho doanh nghiệp. Chuyên cung cấp các dự án phần mềm chất lượng cao, outsource và fixed-cost.",
  icons: {
    icon: "/logo-black-square.png?v=2",
  },
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}>) {
  const { lang } = await params;
  return (
    <html
      lang={lang}
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
