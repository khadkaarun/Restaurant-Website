// Updated: 2025-07-29 16:30:16
// Updated: 2025-07-29 16:30:00

import { Heart, Instagram, Facebook, Twitter } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-nori-900 text-white py-12">
      <div className="section-padding container-custom">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="font-playfair text-2xl font-bold mb-4 text-ramen-300">
              Maki Express Ramen House
            </h3>
            <p className="text-gray-300 mb-4 leading-relaxed">
              Authentic Japanese ramen and Asian cuisine in Cincinnati's University Heights. 
              Fresh ingredients, traditional recipes, and a passion for Japanese culinary excellence.
            </p>
            <div className="flex space-x-4">
              <div className="bg-ramen-600 p-2 rounded-full hover:bg-ramen-700 transition-colors cursor-pointer">
                <Instagram className="w-5 h-5" />
              </div>
              <div className="bg-ramen-600 p-2 rounded-full hover:bg-ramen-700 transition-colors cursor-pointer">
                <Facebook className="w-5 h-5" />
              </div>
              <div className="bg-ramen-600 p-2 rounded-full hover:bg-ramen-700 transition-colors cursor-pointer">
                <Twitter className="w-5 h-5" />
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-lg mb-4">Quick Links</h4>
            <ul className="space-y-2 text-gray-300">
              <li><a href="#menu" className="hover:text-ramen-300 transition-colors">Menu</a></li>
              <li><a href="#about" className="hover:text-ramen-300 transition-colors">Our Story</a></li>
              <li><a href="#location" className="hover:text-ramen-300 transition-colors">Location</a></li>
              <li><a href="#" className="hover:text-ramen-300 transition-colors">Online Order</a></li>
              <li><a href="https://www.yelp.com/biz/maki-express-ramen-house-cincinnati" target="_blank" className="hover:text-ramen-300 transition-colors">Yelp Reviews</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-lg mb-4">Contact Info</h4>
            <div className="text-gray-300 space-y-2">
              <p>209 W McMillan St</p>
              <p>University Heights</p>
              <p>Cincinnati, OH 45219</p>
              <p className="mt-4">Hours: Mon-Sat 11AM-9PM</p>
              <p>Sunday: 12PM-9PM</p>
              <p className="mt-2">★★★★☆ 4.2 on Yelp (242 reviews)</p>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © 2024 Maki Express Ramen House. All rights reserved.
          </p>
          <p className="text-gray-400 text-sm flex items-center gap-2 mt-4 md:mt-0">
            Made for ramen lovers in Cincinnati
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
