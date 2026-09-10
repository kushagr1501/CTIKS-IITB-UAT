import Header from '../components/layout/Header';
import Nav from '../components/layout/Nav';
import Footer from '../components/layout/Footer';
import Hero from '../components/sections/Hero';
import Programmes from '../components/sections/Programmes';
import UpcomingEvents from '../components/sections/UpcomingEvents';
import Announcements from '../components/sections/Announcements';

export default function Home() {
  return (
    <div className="min-h-screen bg-ctiks-cream">
      <Header />
      <Nav current="/" />
      <main>
        <Hero />
        <Programmes />
        <UpcomingEvents />
        <Announcements />
      </main>
      <Footer />
    </div>
  );
}
