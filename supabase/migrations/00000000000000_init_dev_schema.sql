-- =============================================
-- MAKI EXPRESS DEV ENVIRONMENT SETUP
-- Complete database schema migration
-- =============================================

-- Create custom types first
CREATE TYPE public.order_status AS ENUM (
    'pending',
    'confirmed', 
    'in_progress',
    'ready_for_pickup',
    'completed',
    'cancelled'
);

-- =============================================
-- TABLE CREATION
-- =============================================

-- Database table (system table)
CREATE TABLE public.database (
    id bigint NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Profiles table
CREATE TABLE public.profiles (
    id uuid NOT NULL,
    role text DEFAULT 'customer'::text,
    full_name text,
    phone character varying,
    sms_opt_in boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

-- Menu categories
CREATE TABLE public.menu_categories (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

-- Menu items  
CREATE TABLE public.menu_items (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    category_id uuid,
    name text NOT NULL,
    description text,
    price_cents integer NOT NULL,
    image_url text,
    is_available boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

-- Orders
CREATE TABLE public.orders (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid,
    status order_status DEFAULT 'pending'::order_status,
    customer_name text,
    customer_email text,
    customer_phone text,
    total_cents integer NOT NULL,
    square_payment_id text,
    notification_preference text DEFAULT 'email'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    special_requests text,
    PRIMARY KEY (id)
);

-- Order items
CREATE TABLE public.order_items (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    order_id uuid,
    menu_item_id uuid,
    quantity integer NOT NULL,
    unit_price_cents integer NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

-- Notifications
CREATE TABLE public.notifications (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    order_id uuid,
    channel text,
    event text,
    recipient text,
    success boolean,
    created_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

-- Push subscriptions
CREATE TABLE public.push_subscriptions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid,
    endpoint text NOT NULL,
    subscription_data jsonb NOT NULL,
    user_agent text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
);

-- Gallery items
CREATE TABLE public.gallery_items (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    image_url text NOT NULL,
    caption text,
    type text DEFAULT 'image'::text,
    created_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

-- =============================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.database ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;

-- =============================================
-- CREATE RLS POLICIES
-- =============================================

-- Database policies
CREATE POLICY "public_access" ON public.database
    FOR SELECT USING (true);

-- Profile policies
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Menu category policies
CREATE POLICY "Anyone can view menu categories" ON public.menu_categories
    FOR SELECT USING (true);

CREATE POLICY "Staff can manage menu categories" ON public.menu_categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid() 
            AND profiles.role = ANY (ARRAY['staff'::text, 'admin'::text])
        )
    );

-- Menu item policies
CREATE POLICY "Anyone can view available menu items" ON public.menu_items
    FOR SELECT USING (is_available = true);

CREATE POLICY "Staff can manage menu items" ON public.menu_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid() 
            AND profiles.role = ANY (ARRAY['staff'::text, 'admin'::text])
        )
    );

-- Order policies
CREATE POLICY "Anyone can view orders by ID" ON public.orders
    FOR SELECT USING (true);

CREATE POLICY "Users can view their own orders" ON public.orders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Staff can view all orders" ON public.orders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid() 
            AND profiles.role = ANY (ARRAY['staff'::text, 'admin'::text])
        )
    );

CREATE POLICY "Users can insert their own orders" ON public.orders
    FOR INSERT WITH CHECK ((auth.uid() = user_id) OR (user_id IS NULL));

CREATE POLICY "Staff can update orders" ON public.orders
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid() 
            AND profiles.role = ANY (ARRAY['staff'::text, 'admin'::text])
        )
    );

-- Order item policies
CREATE POLICY "Users can view their own order items" ON public.order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = order_items.order_id 
            AND orders.user_id = auth.uid()
        )
    );

CREATE POLICY "Staff can view all order items" ON public.order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid() 
            AND profiles.role = ANY (ARRAY['staff'::text, 'admin'::text])
        )
    );

CREATE POLICY "Users can insert order items for their orders" ON public.order_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = order_items.order_id 
            AND ((orders.user_id = auth.uid()) OR (orders.user_id IS NULL))
        )
    );

-- Notification policies
CREATE POLICY "Staff can view all notifications" ON public.notifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid() 
            AND profiles.role = ANY (ARRAY['staff'::text, 'admin'::text])
        )
    );

-- Push subscription policies
CREATE POLICY "Users can view their own subscriptions" ON public.push_subscriptions
    FOR SELECT USING ((auth.uid() = user_id) OR (user_id IS NULL));

CREATE POLICY "Users can insert their own subscriptions" ON public.push_subscriptions
    FOR INSERT WITH CHECK ((auth.uid() = user_id) OR (user_id IS NULL));

CREATE POLICY "Users can update their own subscriptions" ON public.push_subscriptions
    FOR UPDATE USING ((auth.uid() = user_id) OR (user_id IS NULL));

CREATE POLICY "Users can delete their own subscriptions" ON public.push_subscriptions
    FOR DELETE USING ((auth.uid() = user_id) OR (user_id IS NULL));

CREATE POLICY "Staff can view all subscriptions" ON public.push_subscriptions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid() 
            AND profiles.role = ANY (ARRAY['staff'::text, 'admin'::text])
        )
    );

-- Gallery item policies
CREATE POLICY "Anyone can view gallery items" ON public.gallery_items
    FOR SELECT USING (true);

CREATE POLICY "Staff can manage gallery items" ON public.gallery_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid() 
            AND profiles.role = ANY (ARRAY['staff'::text, 'admin'::text])
        )
    );

-- =============================================
-- DATABASE FUNCTIONS
-- =============================================

-- Function to update updated_at columns
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', 'customer');
  RETURN new;
END;
$$;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX idx_menu_items_category_id ON public.menu_items(category_id);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_order_items_menu_item_id ON public.order_items(menu_item_id);
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at);
CREATE INDEX idx_notifications_order_id ON public.notifications(order_id);
CREATE INDEX idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);