-- Clean up all user data except admin accounts
-- This will remove all orders, profiles, and related data for non-admin users

-- First, delete all order items (they reference orders)
DELETE FROM public.order_items;

-- Delete all orders
DELETE FROM public.orders;

-- Delete all notifications
DELETE FROM public.notifications;

-- Delete all push subscriptions
DELETE FROM public.push_subscriptions;

-- Delete all profiles except admin roles
DELETE FROM public.profiles 
WHERE role != 'admin';
