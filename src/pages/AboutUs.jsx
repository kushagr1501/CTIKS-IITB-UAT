import Header from '../components/layout/Header';
import Nav from '../components/layout/Nav';
import Footer from '../components/layout/Footer';
import AboutHero from '../components/about/AboutHero';
import LogoSection from '../components/about/LogoSection';
import MottoSection from '../components/about/MottoSection';
import VisionMissionSection from '../components/about/VisionMissionSection';

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-ctiks-cream">
      <Header />
      <Nav current="/about-us" />
      <main>
        <AboutHero />
        <LogoSection />
        <MottoSection />
        <VisionMissionSection />
      </main>
      <Footer showConnect={false} />
    </div>
  );
}
