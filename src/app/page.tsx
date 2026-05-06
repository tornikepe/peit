import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import TrustBar from "@/components/TrustBar";
import Testimonials from "@/components/Testimonials";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import Pricing from "@/components/Pricing";
import Industries from "@/components/Industries";
import Urgency from "@/components/Urgency";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";
import ChatWidget from "@/components/ChatWidget";
import ScrollReveal from "@/components/ScrollReveal";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <TrustBar />
        <div className="reveal"><Features /></div>
        <div className="reveal"><Testimonials /></div>
        <div className="reveal"><HowItWorks /></div>
        <div className="reveal"><Industries /></div>
        <div className="reveal"><Pricing /></div>
        <div className="reveal"><Urgency /></div>
        <div className="reveal"><FAQ /></div>
      </main>
      <Footer />
      <ChatWidget />
      <ScrollReveal />
    </>
  );
}
