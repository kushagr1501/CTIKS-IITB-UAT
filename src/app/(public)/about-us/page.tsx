import type { Metadata } from 'next';
import AboutHero from '@/features/about/components/AboutHero';
import LogoSection from '@/features/about/components/LogoSection';
import MottoSection from '@/features/about/components/MottoSection';
import VisionMissionSection from '@/features/about/components/VisionMissionSection';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about CTIKS, IIT Bombay: our logo, motto, vision, and mission.',
};

export default function AboutPage() {
  return (
    <>
      <AboutHero />
      <LogoSection />
      <MottoSection />
      <VisionMissionSection />
    </>
  );
}
