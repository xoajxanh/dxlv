"use client";

import { motion } from "framer-motion";
import { Target, Users, Zap, Briefcase } from "lucide-react";
import Image from "next/image";

const features = [
  {
    icon: <Target className="w-6 h-6 text-[#00f0ff]" />,
    title: "Mục Tiêu Chính Xác",
    description: "Đảm bảo đúng tiến độ và yêu cầu, đặc biệt với các dự án Fixed Cost.",
  },
  {
    icon: <Users className="w-6 h-6 text-[#7000ff]" />,
    title: "Đội Ngũ Chuyên Gia",
    description: "Tập hợp các kỹ sư hàng đầu có kinh nghiệm với đa dạng Tech Stack.",
  },
  {
    icon: <Zap className="w-6 h-6 text-[#0055ff]" />,
    title: "Công Nghệ Đột Phá",
    description: "Tiên phong ứng dụng Blockchain, AI Agent vào các giải pháp thực tế.",
  },
  {
    icon: <Briefcase className="w-6 h-6 text-[#00f0ff]" />,
    title: "Dịch Vụ Toàn Diện",
    description: "Cung cấp từ e-commerce, HRM, ERP đến các hệ thống CRM phức tạp.",
  },
];

export default function AboutUs() {
  return (
    <section id="about" className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-6 md:px-12 relative z-10">
        
        {/* Top row: Text and Image */}
        <div className="flex flex-col lg:flex-row gap-16 items-center mb-20">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="flex-1"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Về <span className="text-glow-cyan">DXLV</span>
            </h2>
            <div className="w-20 h-1 bg-gradient-to-r from-[#00f0ff] to-[#7000ff] mb-8" />
            
            <p className="text-gray-400 text-lg mb-6 leading-relaxed">
              DXLV là công ty công nghệ tiên phong, chuyên cung cấp các giải pháp phần mềm, website và ứng dụng di động chất lượng cao. Chúng tôi tự hào là đối tác chiến lược cho các dự án <span className="text-white font-medium">outsource</span> và <span className="text-white font-medium">fixed-cost</span>.
            </p>
            
            <p className="text-gray-400 text-lg mb-8 leading-relaxed">
              Với phương châm &quot;Chất lượng là danh dự&quot;, DXLV không ngừng ứng dụng các công nghệ tiên tiến nhất như Blockchain, Trí tuệ nhân tạo (AI Agents) để mang lại lợi thế cạnh tranh vượt trội cho khách hàng.
            </p>
            
            <div className="flex gap-4">
              <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex-1 text-center backdrop-blur-sm">
                <h3 className="text-3xl font-black text-[#00f0ff] mb-2">100+</h3>
                <p className="text-sm text-gray-400">Dự án hoàn thành</p>
              </div>
              <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex-1 text-center backdrop-blur-sm">
                <h3 className="text-3xl font-black text-[#7000ff] mb-2">50+</h3>
                <p className="text-sm text-gray-400">Khách hàng hài lòng</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex-1 w-full relative"
          >
            <div className="relative w-full aspect-square md:aspect-video lg:aspect-square max-w-lg mx-auto rounded-3xl overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(112,0,255,0.2)]">
              <Image 
                src="/about.png" 
                alt="DXLV Professional Team" 
                fill 
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover"
              />
              {/* Overlay gradient for blending */}
              <div className="absolute inset-0 bg-gradient-to-tr from-[#050505]/80 via-transparent to-transparent" />
            </div>
          </motion.div>
        </div>

        {/* Bottom row: Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="glassmorphism p-6 rounded-2xl hover:bg-white/10 transition-colors group cursor-default"
            >
              <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h4 className="text-xl font-bold mb-2">{feature.title}</h4>
              <p className="text-gray-400 text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

      </div>
      
      {/* Background elements */}
      <div className="absolute top-1/2 right-0 w-96 h-96 bg-[#7000ff]/10 rounded-full blur-[100px] -z-10 translate-y-1/2" />
    </section>
  );
}
