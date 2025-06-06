// Updated: 2025-07-29 16:30:12
// Updated: 2025-07-29 16:30:08

const About = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-background to-ramen-50">
      <div className="section-padding container-custom">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-in">
            <h2 className="font-playfair text-4xl md:text-5xl font-bold mb-6 text-foreground">
              Our Story
            </h2>
            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
              Located in Cincinnati's vibrant University Heights neighborhood, Maki Express Ramen House has become a beloved destination for authentic Japanese cuisine. With a 4.2-star rating from over 240 reviews, we're proud to serve our community with traditional ramen, fresh sushi, and classic Japanese comfort food.
            </p>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Our menu features everything from rich tonkotsu ramen and delicate shoyu broths to fresh onigiri, crispy takoyaki, and hearty katsu dishes. Each bowl is carefully crafted with attention to authentic flavors and traditional preparation methods that honor Japanese culinary heritage.
            </p>
            <div className="grid grid-cols-3 gap-6 text-center">
              <div className="p-4">
                <div className="text-3xl font-bold text-ramen-600 mb-2">4.2★</div>
                <div className="text-sm text-muted-foreground">Yelp Rating</div>
              </div>
              <div className="p-4">
                <div className="text-3xl font-bold text-ramen-600 mb-2">240+</div>
                <div className="text-sm text-muted-foreground">Happy Reviews</div>
              </div>
              <div className="p-4">
                <div className="text-3xl font-bold text-ramen-600 mb-2">100%</div>
                <div className="text-sm text-muted-foreground">Fresh Daily</div>
              </div>
            </div>
          </div>
          
          <div className="relative animate-scale-in">
            <img 
              src="https://images.unsplash.com/photo-1721322800607-8c38375eef04?auto=format&fit=crop&w=800&q=80" 
              alt="Chef preparing ramen" 
              className="rounded-2xl shadow-2xl w-full h-[600px] object-cover hover-lift"
            />
            <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-xl shadow-xl max-w-xs">
              <p className="text-sm italic text-muted-foreground">
                "Serving authentic Japanese flavors in the heart of Cincinnati's University Heights."
              </p>
              <p className="text-sm font-semibold mt-2 text-ramen-600">- Maki Express Team</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
