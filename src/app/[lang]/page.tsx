import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import AboutUs from "@/components/AboutUs";
import TechStack from "@/components/TechStack";
import Domains from "@/components/Domains";
import Footer from "@/components/Footer";

import { getDictionary } from "@/i18n/get-dictionary";

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const dict = await getDictionary(lang as "en" | "vi");

  return (
    <main className="min-h-screen bg-[#050505] text-white selection:bg-[#00f0ff] selection:text-black">
      <Navbar dict={dict.navigation} lang={lang} />
      <Hero dict={dict.hero} />
      <AboutUs dict={dict.about} />
      <TechStack dict={dict.techStack} />
      <Domains dict={dict.domains} />
      <Footer dict={dict.footer} lang={lang} />
    </main>
  );
}
