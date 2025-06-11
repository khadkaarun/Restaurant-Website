-- Remove the problematic trigger that references non-existent updated_at column
DROP TRIGGER IF EXISTS update_menu_items_updated_at ON menu_items;