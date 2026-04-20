import Features from "../../components/Features";
import Footer from "../../components/Footer";
import Hero from "../../components/Hero";
import HowItWorks from "../../components/HowItWorks";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-950 to-black text-gray-100 antialiased">
      <div className="container mx-auto px-6 py-16 lg:py-24">
        <Hero />

        <div className="mt-16 space-y-20">
          <Features />
          <HowItWorks />
        </div>
      </div>

      <Footer />
    </main>
  );
}
