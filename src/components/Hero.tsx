// Updated: 2025-07-29 16:30:01

import { Button } from '@/components/ui/button';
import { ChevronDown, MapPin, Clock, Star, Utensils } from 'lucide-react';
import { Link } from 'react-router-dom';

const Hero = () => {
  const scrollToMenu = () => {
    document.getElementById('menu-preview')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.4)), url('https://sumyeaysdumzyaqdsyjd.supabase.co/storage/v1/object/public/menu-images/hero-background.webp?width=1920&height=1080&resize=cover&quality=85')`
        }}
      />
      
      {/* Content */}
      <div className="relative z-10 text-center text-white px-4 md:px-8 max-w-6xl mx-auto">
        <div className="animate-fade-in">
          {/* Restaurant Logo/Badge */}
          <div className="flex justify-center mb-6">
            <div className="bg-primary/20 backdrop-blur-sm border border-primary/30 rounded-full p-4">
              <Utensils className="w-8 h-8 text-primary" />
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight">
            Maki Express
            <span className="block text-primary">Ramen House</span>
          </h1>
          
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto leading-relaxed text-gray-200">
            Authentic Japanese ramen and cuisine crafted with traditional techniques and fresh ingredients. Experience the true taste of Japan in Cincinnati.
          </p>

          {/* Quality Indicators */}
          <div className="flex justify-center items-center gap-6 mb-8">
            <div className="flex items-center gap-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <span className="text-sm text-gray-300">Premium Quality</span>
            </div>
            <div className="w-px h-6 bg-gray-500"></div>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              <span className="text-sm text-gray-300">University Heights</span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link to="/menu">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg font-semibold rounded-full hover-scale shadow-lg"
              >
                Order Now
              </Button>
            </Link>
            
            <Button 
              onClick={scrollToMenu}
              size="lg" 
              variant="outline"
              className="border-white/30 bg-white/10 backdrop-blur-sm text-white hover:bg-white hover:text-foreground px-8 py-6 text-lg font-semibold rounded-full hover-scale"
            >
              View Menu
            </Button>
          </div>

          {/* Restaurant Info */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-8 text-sm text-gray-300">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span>Pickup: 15 min average</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <span>Authentic Japanese Ramen</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <ChevronDown className="w-8 h-8 text-white/70" />
      </div>
    </section>
  );
};

export default Hero;
