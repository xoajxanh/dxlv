"use client";

import { motion } from "framer-motion";
import { ShoppingCart, Users, Factory, LineChart } from "lucide-react";
import Image from "next/image";

const domains = [
  {
    title: "E-Commerce",
    description: "Nền tảng thương mại điện tử mạnh mẽ, tối ưu hóa tỷ lệ chuyển đổi và trải nghiệm người dùng.",
    icon: <ShoppingCart className="w-8 h-8 text-[#00f0ff]" />,
    gradient: "from-[#00f0ff]/20 to-transparent",
  },
  {
    title: "HRM Systems",
    description: "Phần mềm quản lý nhân sự số hóa, đánh giá KPI và tự động hóa quy trình tuyển dụng.",
    icon: <Users className="w-8 h-8 text-[#7000ff]" />,
    gradient: "from-[#7000ff]/20 to-transparent",
  },
  {
    title: "ERP Solutions",
    description: "Hệ thống quản trị nguồn lực doanh nghiệp toàn diện, kết nối các phòng ban hiệu quả.",
    icon: <Factory className="w-8 h-8 text-[#0055ff]" />,
    gradient: "from-[#0055ff]/20 to-transparent",
  },
  {
    title: "CRM Platforms",
    description: "Công cụ quản lý quan hệ khách hàng thông minh, tích hợp AI để dự đoán xu hướng bán hàng.",
    icon: <LineChart className="w-8 h-8 text-[#00f0ff]" />,
    gradient: "from-[#00f0ff]/20 to-transparent",
  },
];

export default function Domains() {
  return (
    <section id="services" className="py-24 relative overflow-hidden">
      {/* Background Texture Layer */}
      <div className="absolute inset-0 z-0 opacity-20 mix-blend-color-dodge">
        <Image
          src="/texture.png"
          alt="Tech Pattern"
          fill
          className="object-cover"
        />
      </div>
      
      <div className="container mx-auto px-6 md:px-12 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Lĩnh Vực <span className="text-glow-cyan">Trọng Tâm</span>
            </h2>
            <p className="text-gray-400 text-lg">
              Chúng tôi cung cấp các giải pháp chuyên sâu, được thiết kế riêng biệt để giải quyết các bài toán đặc thù của từng lĩnh vực.
            </p>
          </motion.div>
          <motion.button
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="px-6 py-3 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 transition-colors font-medium cursor-pointer shrink-0 backdrop-blur-md"
          >
            Xem tất cả dịch vụ
          </motion.button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {domains.map((domain, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -10 }}
              className={`relative overflow-hidden rounded-3xl bg-black/40 backdrop-blur-xl p-8 border border-white/10 group shadow-lg`}
            >
              <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl ${domain.gradient} opacity-50 rounded-full blur-[50px] -z-10 group-hover:opacity-100 transition-opacity duration-500`} />
              
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner">
                {domain.icon}
              </div>
              <h3 className="text-2xl font-bold mb-4">{domain.title}</h3>
              <p className="text-gray-400 text-lg leading-relaxed">
                {domain.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
