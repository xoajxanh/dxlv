import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import AboutUs from "@/components/AboutUs";
import TechStack from "@/components/TechStack";
import Domains from "@/components/Domains";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#050505] text-white selection:bg-[#00f0ff] selection:text-black">
      <Navbar />
      <Hero />
      <AboutUs />
      <TechStack />
      <Domains />
      <Footer />
    </main>
  );
}
