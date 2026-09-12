import { useState, useEffect, useRef } from 'react';
import Lenis from 'lenis';
import Home from './pages/Home';
import AboutUs from './pages/AboutUs';
import People from './pages/People';

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const lenisRef = useRef(null);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), 
    });
    lenisRef.current = lenis;

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
      if (lenisRef.current) {
        lenisRef.current.scrollTo(0, { immediate: true });
      } else {
        window.scrollTo(0, 0);
      }
    };

    window.addEventListener('popstate', handleLocationChange);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      lenis.destroy();
    };
  }, []);

  if (currentPath === '/about-us' || currentPath === '/about') {
    return <AboutUs />;
  }

  if (currentPath === '/people') {
    return <People />;
  }

  return <Home />;
}

