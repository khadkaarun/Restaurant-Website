-- Add Katsu Ramen to the menu
INSERT INTO public.menu_items (id, category_id, name, description, price_cents, is_available) VALUES
    (gen_random_uuid(), 'b08282bb-02ee-44cf-9177-6face2eec7cf', 'Katsu Ramen', 'Rich ramen broth with choice of crispy katsu chicken or pork cutlet', 1400, true);