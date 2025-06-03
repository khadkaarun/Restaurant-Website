// Updated: 2025-07-29 16:30:19
// Updated: 2025-07-29 16:30:01

import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import About from '@/components/About';
import MenuPreview from '@/components/MenuPreview';
import Location from '@/components/Location';
import Footer from '@/components/Footer';
import { PushNotificationSettings } from '@/components/PushNotificationSettings';

const Index = () => {
  return (
    <div className="min-h-screen bg-background smooth-scroll">
      <Navbar />
      <Hero />
      <About />
      <MenuPreview />
      <Location />
      <Footer />
    </div>
  );
};

export default Index;
