// Updated: 2025-07-29 16:30:15
// Updated: 2025-07-29 16:30:10
// Updated: 2025-07-29 16:30:02

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Phone, Clock, Star } from 'lucide-react';

const Location = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-ramen-50 to-background">
      <div className="section-padding container-custom">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="font-playfair text-4xl md:text-5xl font-bold mb-6 text-foreground">
            Visit Us
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Located in Cincinnati's University Heights, come experience authentic Japanese flavors in our welcoming atmosphere
          </p>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-fade-in">
            <Card className="p-6 hover-lift border-0 shadow-lg">
              <CardContent className="p-0">
                <div className="flex items-start gap-4">
                  <div className="bg-ramen-100 p-3 rounded-full">
                    <MapPin className="w-6 h-6 text-ramen-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Address</h3>
                    <p className="text-muted-foreground">
                      209 W McMillan St<br />
                      University Heights<br />
                      Cincinnati, OH 45219
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="p-6 hover-lift border-0 shadow-lg">
              <CardContent className="p-0">
                <div className="flex items-start gap-4">
                  <div className="bg-ramen-100 p-3 rounded-full">
                    <Clock className="w-6 h-6 text-ramen-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Hours</h3>
                    <div className="text-muted-foreground space-y-1">
                      <p>Monday - Saturday: 11:00 AM - 9:00 PM</p>
                      <p>Sunday: 12:00 PM - 9:00 PM</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="p-6 hover-lift border-0 shadow-lg">
              <CardContent className="p-0">
                <div className="flex items-start gap-4">
                  <div className="bg-ramen-100 p-3 rounded-full">
                    <Star className="w-6 h-6 text-ramen-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Reviews</h3>
                    <div className="text-muted-foreground space-y-1">
                      <p>4.2★ rating on Yelp</p>
                      <p>242+ customer reviews</p>
                      <p>Casual dining atmosphere</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Button 
              size="lg" 
              className="w-full bg-ramen-600 hover:bg-ramen-700 text-white py-6 text-lg font-semibold rounded-full hover-lift"
              onClick={() => window.open('https://maps.google.com/?q=209+W+McMillan+St,+Cincinnati,+OH+45219', '_blank')}
            >
              Get Directions
            </Button>
          </div>
          
          <div className="relative animate-scale-in">
            <div className="bg-ramen-100 rounded-2xl p-8 text-center">
              <MapPin className="w-16 h-16 text-ramen-600 mx-auto mb-6 animate-float" />
              <h3 className="font-playfair text-2xl font-semibold mb-4">Find Us in University Heights</h3>
              <p className="text-muted-foreground mb-6">
                Located on W McMillan Street in Cincinnati's University Heights neighborhood. 
                We're easily accessible and a favorite spot for students and locals alike!
              </p>
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h4 className="font-semibold mb-4">Dining Options</h4>
                <p className="text-sm text-muted-foreground">
                  Dine-in, takeout, and delivery available. 
                  Casual atmosphere perfect for quick lunches or relaxed dinners.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Location;
