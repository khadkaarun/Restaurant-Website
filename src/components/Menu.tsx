// Updated: 2025-07-29 16:30:07
// Updated: 2025-07-29 16:30:04

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame, Leaf } from 'lucide-react';

const menuCategories = [
  {
    name: "Appetizers",
    items: [
      { name: "House Salad", price: "$4.00", spicy: false, vegetarian: true },
      { name: "Edamame", price: "$4.00", spicy: false, vegetarian: true },
      { name: "Seaweed Salad", price: "$5.00", spicy: false, vegetarian: true },
      { name: "Gyoza", price: "$5.00", spicy: false, vegetarian: false },
      { name: "Shrimp Shumai", price: "$6.00", spicy: false, vegetarian: false },
      { name: "Chicken Karaage", price: "$6.00", spicy: false, vegetarian: false },
      { name: "Yasai Korokke (Croquettes)", price: "$6.00", spicy: false, vegetarian: true },
      { name: "Takoyaki", price: "$6.00", spicy: false, vegetarian: false },
      { name: "Okonomiyaki", price: "$7.50", spicy: false, vegetarian: false },
      { name: "Soft Taco with Pork Belly (2 pieces)", price: "$6.00", spicy: false, vegetarian: false },
      { name: "Onigiri - Choice of Salmon Teriyaki or Chicken karaage or Tuna Salad", price: "$3.50", spicy: false, vegetarian: false },
      { name: "Katsu Sando - Crispy and juicy chicken or pork cutlet sandwiched", price: "$8.00", spicy: false, vegetarian: false }
    ]
  },
  {
    name: "Rice",
    items: [
      { name: "Teriyaki - Served with stir-fried vegetables and steamed Japanese rice. Choice of Chicken ($10.00), Tofu ($9.00), Salmon ($12.00)", price: "$10.00", spicy: false, vegetarian: false },
      { name: "Unagi Don - Barbecue eel and sauce on top with rice", price: "$15.00", spicy: false, vegetarian: false },
      { name: "Japanese Katsu Curry - Choice of Chicken or Pork", price: "$10.00", spicy: false, vegetarian: false },
      { name: "Katsu Don - Choice of Chicken or Pork breaded and deep-fried, onion, egg and sauce on top of a bowl of rice", price: "$10.00", spicy: false, vegetarian: false },
      { name: "Ten Don - Shrimp tempura, onion, egg and sauce on top of bowl of rice", price: "$12.00", spicy: false, vegetarian: false },
      { name: "Gyudon - Thinly sliced beef, sliced onions and sauce on top of bowl of rice", price: "$12.00", spicy: false, vegetarian: false }
    ]
  },
  {
    name: "Ramen",
    items: [
      { name: "Tonkotsu Ramen - Pork chashu, pork belly, bamboo, soft boiled egg, black garlic oil, chilli oil and green onion", price: "$11.00", spicy: false, vegetarian: false },
      { name: "Miso Ramen - Pork chashu, pork belly, bamboo, soft boiled egg, corn, bean sprout, green onion, black garlic oil and Naruto", price: "$12.00", spicy: false, vegetarian: false },
      { name: "Shoyu Ramen - Pork chashu, bamboo, green onion, Naruto, white onion, soft boiled egg and black garlic oil", price: "$10.00", spicy: false, vegetarian: false },
      { name: "Tom Yum Shrimp Ramen - Thai style Tom Yum broth with shrimp, cherry tomato, mushroom, cilantro and green onion", price: "$11.00", spicy: true, vegetarian: false },
      { name: "Vegetable Ramen - Steam broccoli, corn, mushroom, bamboo, carrot, zucchini and tofu with mushroom broth", price: "$11.00", spicy: false, vegetarian: true },
      { name: "Tan Tan Ramen - Spicy ramen noodles with stir-fried ground chicken, egg and green onion", price: "$11.00", spicy: true, vegetarian: false },
      { name: "Spicy Chicken Karaage Ramen - Spicy Tonkotsu ramen noodles with chicken karaage, and green onion", price: "$12.00", spicy: true, vegetarian: false },
      { name: "Ann Tori Ramen (LIMITED) - Ramen noodle in shoyu chicken broth with grilled chicken, bamboo, egg and green onion", price: "$12.00", spicy: false, vegetarian: false }
    ]
  },
  {
    name: "Soba & Udon",
    items: [
      { name: "Soba (Choice of Hot or Cold soup) - With shrimp tempura and vegetable tempura", price: "$12.00", spicy: false, vegetarian: false },
      { name: "Udon (Choice of Tofu, Chicken, Shrimp Tempura and Beef) - Japanese wheat noodles in tempura broth with broccoli, corn, shitake mushroom, carrot, zucchini, and seaweed", price: "$12.00", spicy: false, vegetarian: false },
      { name: "Pho (Choice of Chicken or Beef) - Rice noodle with bean sprout, basil, jalapeno, lime and meat ball", price: "$12.00", spicy: false, vegetarian: false },
      { name: "Curry Udon (Choice of Katsu Pork or Katsu Chicken) - Japanese wheat noodles with light curry broth with your choice of meat", price: "$12.00", spicy: false, vegetarian: false }
    ]
  },
  {
    name: "Topping & Extra",
    items: [
      { name: "Soft boiled egg", price: "$1.50", spicy: false, vegetarian: true },
      { name: "Pork Chashu", price: "$1.50", spicy: false, vegetarian: false },
      { name: "Pork Belly", price: "$1.50", spicy: false, vegetarian: false },
      { name: "Corn", price: "$1.00", spicy: false, vegetarian: true },
      { name: "Mushroom", price: "$1.00", spicy: false, vegetarian: true },
      { name: "Noodle", price: "$2.00", spicy: false, vegetarian: true },
      { name: "Bamboo", price: "$1.00", spicy: false, vegetarian: true },
      { name: "Rice", price: "$2.00", spicy: false, vegetarian: true },
      { name: "Garlic", price: "$1.00", spicy: false, vegetarian: true }
    ]
  }
];

const Menu = () => {
  return (
    <section id="menu" className="py-20 bg-background">
      <div className="section-padding container-custom">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="font-playfair text-4xl md:text-5xl font-bold mb-6 text-foreground">
            Our Menu
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Authentic Japanese cuisine crafted with traditional techniques and premium ingredients
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <span className="text-sm text-muted-foreground">Legend:</span>
            <Badge variant="destructive" className="flex items-center gap-1">
              <Flame className="w-3 h-3" />
              Spicy
            </Badge>
            <Badge className="bg-green-600 text-white hover:bg-green-700 flex items-center gap-1">
              <Leaf className="w-3 h-3" />
              Vegetarian
            </Badge>
          </div>
        </div>
        
        {menuCategories.map((category, categoryIndex) => (
          <div key={category.name} className="mb-16">
            <h3 className="font-playfair text-2xl md:text-3xl font-bold mb-8 text-center text-ramen-600">
              {category.name}
            </h3>
            
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {category.items.map((item, index) => (
                <Card 
                  key={`${category.name}-${index}`}
                  className="overflow-hidden hover-lift card-shadow border-0 bg-white"
                  style={{ animationDelay: `${(categoryIndex * 100) + (index * 50)}ms` }}
                >
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-playfair text-lg font-semibold text-foreground">
                        {item.name}
                      </h4>
                      <div className="bg-ramen-50 px-3 py-1 rounded-full">
                        <span className="font-bold text-ramen-600">{item.price}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      {item.spicy && (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <Flame className="w-3 h-3" />
                          Spicy
                        </Badge>
                      )}
                      {item.vegetarian && (
                        <Badge className="bg-green-600 text-white hover:bg-green-700 flex items-center gap-1">
                          <Leaf className="w-3 h-3" />
                          Vegetarian
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Menu;
