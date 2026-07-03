"use client";

import { MapPin, Phone, Mail, Globe, Link as LinkIcon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black pt-20 pb-10 relative overflow-hidden">
      <div className="absolute bottom-0 right-0 w-[50rem] h-[50rem] bg-[#00f0ff]/5 rounded-full blur-[150px] -z-10 translate-y-1/2" />
      
      <div className="container mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="lg:col-span-1">
            <Link href="#home" className="flex items-center gap-2 mb-6">
              <Image 
                src="/logo.jpg" 
                alt="DXLV Solutions" 
                width={150} 
                height={50} 
                className="object-contain opacity-90 hover:opacity-100 transition-opacity rounded-xl"
              />
            </Link>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Giải pháp công nghệ toàn diện cho doanh nghiệp, chuyên trị các dự án khó với chi phí cố định tối ưu.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#00f0ff] hover:text-black hover:border-transparent transition-all">
                <Globe className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#00f0ff] hover:text-black hover:border-transparent transition-all">
                <LinkIcon className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#00f0ff] hover:text-black hover:border-transparent transition-all">
                <Globe className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#00f0ff] hover:text-black hover:border-transparent transition-all">
                <LinkIcon className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-xl font-bold mb-6">Dịch vụ</h4>
            <ul className="space-y-4">
              <li><a href="#" className="text-gray-400 hover:text-[#00f0ff] transition-colors">E-Commerce</a></li>
              <li><a href="#" className="text-gray-400 hover:text-[#00f0ff] transition-colors">HRM / ERP</a></li>
              <li><a href="#" className="text-gray-400 hover:text-[#00f0ff] transition-colors">CRM Systems</a></li>
              <li><a href="#" className="text-gray-400 hover:text-[#00f0ff] transition-colors">Blockchain</a></li>
              <li><a href="#" className="text-gray-400 hover:text-[#00f0ff] transition-colors">AI Agents</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xl font-bold mb-6">Công ty</h4>
            <ul className="space-y-4">
              <li><a href="#about" className="text-gray-400 hover:text-[#00f0ff] transition-colors">Về chúng tôi</a></li>
              <li><a href="#" className="text-gray-400 hover:text-[#00f0ff] transition-colors">Tuyển dụng</a></li>
              <li><a href="#" className="text-gray-400 hover:text-[#00f0ff] transition-colors">Tin tức</a></li>
              <li><a href="#" className="text-gray-400 hover:text-[#00f0ff] transition-colors">Chính sách bảo mật</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xl font-bold mb-6">Liên hệ</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#00f0ff] shrink-0 mt-1" />
                <span className="text-gray-400">Số 139 phố Yên Lạc, phường Vĩnh Tuy, Thành phố Hà Nội</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-[#00f0ff] shrink-0" />
                <span className="text-gray-400">0989600992</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-[#00f0ff] shrink-0" />
                <span className="text-gray-400">phongtonghop.dxlv@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 text-center flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} CÔNG TY TNHH DỊCH VỤ VÀ TƯ VẤN DXLV. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Powered by</span>
            <span className="font-bold text-white">Next.js</span>
            <span>&</span>
            <span className="font-bold text-[#00f0ff]">Tailwind</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
