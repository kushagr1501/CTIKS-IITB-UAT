import Header from '../components/layout/Header';
import Nav from '../components/layout/Nav';
import Footer from '../components/layout/Footer';
import PeopleHero from '../components/sections/PeopleHero';
import CoreFacultySection from '../components/sections/CoreFacultySection';
import AssociateFacultySection from '../components/sections/AssociateFacultySection';

export default function People() {
  return (
    <div className="min-h-screen bg-ctiks-cream overflow-x-hidden">
      <Header />
      <Nav current="/people" />
      <main>
        <PeopleHero />
        <CoreFacultySection />
        <AssociateFacultySection />
      </main>
      <Footer showConnect={false} />
    </div>
  );
}
