-- Add Katsu Ramen to the menu
INSERT INTO public.menu_items (id, category_id, name, description, price_cents, is_available) VALUES
    ('katsu001-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Katsu Ramen', 'Rich ramen broth with choice of crispy katsu chicken or pork cutlet', 1400, true)
ON CONFLICT (id) DO NOTHING;