-- Drop existing tables to rebuild with new schema
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Custom type for order status
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'in_progress', 'ready_for_pickup', 'completed', 'cancelled');

-- Profiles table linked to auth, stores user-specific data
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('customer', 'staff', 'admin')) DEFAULT 'customer',
  full_name TEXT,
  phone VARCHAR(20),
  sms_opt_in BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Menu Categories for organization
CREATE TABLE menu_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Menu Items with proper price handling in cents
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES menu_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  price_cents INT NOT NULL,
  image_url TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gallery Items for restaurant photos
CREATE TABLE gallery_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  caption TEXT,
  type TEXT CHECK (type IN ('image', 'video')) DEFAULT 'image',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders table supporting both registered users and guests
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Nullable for guest checkouts
  status order_status DEFAULT 'pending',
  -- Guest information, required if user_id is NULL
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  -- Order details
  total_cents INT NOT NULL,
  square_payment_id TEXT,
  notification_preference TEXT CHECK (notification_preference IN ('email', 'sms')) DEFAULT 'email',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Items within each order
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id),
  quantity INT NOT NULL,
  unit_price_cents INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Log table for all outgoing notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  channel TEXT CHECK (channel IN ('email', 'sms', 'push')),
  event TEXT CHECK (event IN ('order_confirmed', 'order_ready', 'order_completed')),
  recipient TEXT,
  success BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for menu_categories (public read)
CREATE POLICY "Anyone can view menu categories" ON menu_categories
  FOR SELECT USING (true);

CREATE POLICY "Staff can manage menu categories" ON menu_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('staff', 'admin')
    )
  );

-- RLS Policies for menu_items (public read)
CREATE POLICY "Anyone can view available menu items" ON menu_items
  FOR SELECT USING (is_available = true);

CREATE POLICY "Staff can manage menu items" ON menu_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('staff', 'admin')
    )
  );

-- RLS Policies for gallery_items (public read)
CREATE POLICY "Anyone can view gallery items" ON gallery_items
  FOR SELECT USING (true);

CREATE POLICY "Staff can manage gallery items" ON gallery_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('staff', 'admin')
    )
  );

-- RLS Policies for orders
CREATE POLICY "Users can view their own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Staff can view all orders" ON orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('staff', 'admin')
    )
  );

CREATE POLICY "Staff can update orders" ON orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('staff', 'admin')
    )
  );

-- RLS Policies for order_items
CREATE POLICY "Users can view their own order items" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert order items for their orders" ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND (orders.user_id = auth.uid() OR orders.user_id IS NULL)
    )
  );

CREATE POLICY "Staff can view all order items" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('staff', 'admin')
    )
  );

-- RLS Policies for notifications
CREATE POLICY "Staff can view all notifications" ON notifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('staff', 'admin')
    )
  );

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add update triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', 'customer');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user profiles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample menu categories
INSERT INTO menu_categories (name, sort_order) VALUES
('Appetizers', 1),
('Soups & Salads', 2),
('Main Courses', 3),
('Desserts', 4),
('Beverages', 5);

-- Insert sample menu items (prices in cents)
INSERT INTO menu_items (category_id, name, description, price_cents, is_available) VALUES
-- Appetizers
((SELECT id FROM menu_categories WHERE name = 'Appetizers'), 'Golden Bruschetta', 'Crispy bread topped with fresh tomatoes, basil, and garlic', 1200, true),
((SELECT id FROM menu_categories WHERE name = 'Appetizers'), 'Truffle Arancini', 'Creamy risotto balls with truffle oil and parmesan', 1800, true),
((SELECT id FROM menu_categories WHERE name = 'Appetizers'), 'Calamari Rings', 'Fresh squid rings with spicy marinara sauce', 1500, true),

-- Soups & Salads
((SELECT id FROM menu_categories WHERE name = 'Soups & Salads'), 'Golden Mushroom Soup', 'Creamy soup with wild mushrooms and herbs', 1400, true),
((SELECT id FROM menu_categories WHERE name = 'Soups & Salads'), 'Caesar Salad', 'Crisp romaine with our signature caesar dressing', 1600, true),
((SELECT id FROM menu_categories WHERE name = 'Soups & Salads'), 'Mediterranean Bowl', 'Fresh greens, olives, feta, and balsamic vinaigrette', 1800, true),

-- Main Courses
((SELECT id FROM menu_categories WHERE name = 'Main Courses'), 'Golden Ribeye Steak', 'Premium aged ribeye with roasted vegetables', 4200, true),
((SELECT id FROM menu_categories WHERE name = 'Main Courses'), 'Lobster Thermidor', 'Fresh lobster in creamy cognac sauce', 4800, true),
((SELECT id FROM menu_categories WHERE name = 'Main Courses'), 'Truffle Pasta', 'Fresh pasta with black truffle and cream sauce', 3200, true),
((SELECT id FROM menu_categories WHERE name = 'Main Courses'), 'Herb-Crusted Salmon', 'Atlantic salmon with lemon herb crust', 2800, true),

-- Desserts
((SELECT id FROM menu_categories WHERE name = 'Desserts'), 'Chocolate Lava Cake', 'Warm chocolate cake with molten center', 1200, true),
((SELECT id FROM menu_categories WHERE name = 'Desserts'), 'Tiramisu', 'Classic Italian dessert with coffee and mascarpone', 1000, true),
((SELECT id FROM menu_categories WHERE name = 'Desserts'), 'Crème Brûlée', 'Vanilla custard with caramelized sugar top', 1100, true),

-- Beverages
((SELECT id FROM menu_categories WHERE name = 'Beverages'), 'House Wine Selection', 'Red or white wine by the glass', 1200, true),
((SELECT id FROM menu_categories WHERE name = 'Beverages'), 'Artisan Coffee', 'Freshly roasted single-origin coffee', 500, true),
((SELECT id FROM menu_categories WHERE name = 'Beverages'), 'Fresh Juice', 'Orange, apple, or mixed berry', 600, true);