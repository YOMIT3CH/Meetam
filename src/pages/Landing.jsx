import Navbar from '../components/Navbar.jsx';
import Hero from '../components/sections/Hero.jsx';
import HowItWorks from '../components/sections/HowItWorks.jsx';
import Testimonials from '../components/sections/Testimonials.jsx';
import FAQAccordion from '../components/sections/FAQAccordion.jsx';
import Footer from '../components/Footer.jsx';

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Navbar />
      <main className="flex-grow relative">
        <Hero />
        <HowItWorks />
        <Testimonials />
        <FAQAccordion />
      </main>
      <Footer />
    </div>
  );
}

