"use client";

import { motion } from "framer-motion";
import { Code, Database, BrainCircuit, Blocks } from "lucide-react";

const technologies = [
  { name: ".NET", category: "Backend", icon: <Code className="w-5 h-5 text-purple-400" />, color: "border-purple-500/30" },
  { name: "Node.js", category: "Backend", icon: <Code className="w-5 h-5 text-green-400" />, color: "border-green-500/30" },
  { name: "Angular", category: "Frontend", icon: <Code className="w-5 h-5 text-red-400" />, color: "border-red-500/30" },
  { name: "Vue.js", category: "Frontend", icon: <Code className="w-5 h-5 text-green-300" />, color: "border-green-300/30" },
  { name: "Next.js", category: "Fullstack", icon: <Code className="w-5 h-5 text-white" />, color: "border-white/30" },
  { name: "MSSQL", category: "Database", icon: <Database className="w-5 h-5 text-blue-400" />, color: "border-blue-400/30" },
  { name: "MySQL", category: "Database", icon: <Database className="w-5 h-5 text-blue-500" />, color: "border-blue-500/30" },
  { name: "MongoDB", category: "Database", icon: <Database className="w-5 h-5 text-green-500" />, color: "border-green-500/30" },
  { name: "Blockchain", category: "Web3", icon: <Blocks className="w-5 h-5 text-[#00f0ff]" />, color: "border-[#00f0ff]/30" },
  { name: "AI Agent", category: "AI", icon: <BrainCircuit className="w-5 h-5 text-[#7000ff]" />, color: "border-[#7000ff]/30" },
];

export default function TechStack() {
  return (
    <section id="tech" className="py-24 relative bg-black/50 border-y border-white/5">
      <div className="container mx-auto px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Đa Dạng <span className="text-glow-purple">Tech Stack</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Sẵn sàng đáp ứng mọi yêu cầu kỹ thuật với kho tàng công nghệ hiện đại, từ Backend, Frontend, Database cho đến Web3 và AI.
          </p>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-4 md:gap-6">
          {technologies.map((tech, index) => (
            <motion.div
              key={tech.name}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              whileHover={{ y: -5, scale: 1.05 }}
              className={`flex items-center gap-3 px-6 py-4 rounded-2xl glassmorphism border ${tech.color} hover:bg-white/10 transition-all cursor-default group`}
            >
              <div className="bg-white/5 p-2 rounded-lg group-hover:scale-110 transition-transform">
                {tech.icon}
              </div>
              <div>
                <h4 className="font-bold text-white text-lg">{tech.name}</h4>
                <p className="text-xs text-gray-400">{tech.category}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
