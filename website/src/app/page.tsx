import { Agent } from "@/components/Agent";
import { Footer } from "@/components/Footer";
import { Get } from "@/components/Get";
import { Hero } from "@/components/Hero";
import { Nav } from "@/components/Nav";
import { Pricing } from "@/components/Pricing";
import { Showcase } from "@/components/Showcase";
import { Ticker } from "@/components/Ticker";
import { CoatProvider } from "@/lib/coat-context";

export default function Home() {
  return (
    <CoatProvider>
      <Ticker />
      <Nav />
      <main>
        <Hero />
        <Showcase />
        <Agent />
        <Pricing />
        <Get />
      </main>
      <Footer />
    </CoatProvider>
  );
}
