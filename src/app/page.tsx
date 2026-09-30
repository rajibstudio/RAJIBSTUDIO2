import { SmoothScroll } from "@/components/ui/SmoothScroll";
import { LightboxProvider } from "@/components/ui/Lightbox";
import { Nav } from "@/components/ui/Nav";
import { Hero } from "@/components/hero/Hero";
import { About } from "@/components/sections/About";
import { Stories } from "@/components/sections/Stories";
import { Portfolio } from "@/components/sections/Portfolio";
import { Films } from "@/components/sections/Films";
import { Services } from "@/components/sections/Services";
import { Packages } from "@/components/sections/Packages";
import { Testimonials } from "@/components/sections/Testimonials";
import { Social } from "@/components/sections/Social";
import { Contact } from "@/components/sections/Contact";
import { Footer } from "@/components/sections/Footer";

export default function Home() {
  return (
    <SmoothScroll>
      <LightboxProvider>
        <Nav />
        <main>
          <Hero />
          <About />
          <Stories />
          <Portfolio />
          <Films />
          <Services />
          <Packages />
          <Testimonials />
          <Social />
          <Contact />
        </main>
        <Footer />
      </LightboxProvider>
    </SmoothScroll>
  );
}
