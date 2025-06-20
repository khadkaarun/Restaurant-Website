# Restaurant Ordering System - Feature Documentation

## Overview
This is a comprehensive restaurant ordering system built with React, TypeScript, Supabase, and Stripe integration. This document lists all implemented features to prevent duplication of work.

---

## 🍽️ Core Restaurant Features

### Menu Management
- **Menu Categories**: Organized menu structure with categories
- **Menu Items**: Full menu item management with descriptions, prices, and images
- **Image Uploads**: Menu item images stored in Supabase storage (`menu-images` bucket)
- **Pricing**: Flexible pricing system (stored in cents for precision)
- **Item Availability**: Toggle items on/off

### Advanced Stock Management
- **Stock Status Types**:
  - `in_stock` - Available for ordering
  - `out_today` - Out until midnight
  - `out_indefinite` - Out until manually restored
  - `out_until` - Out until specific date/time
- **Daily Stock Reset**: Automatic function to reset daily stock status
- **Stock Notes**: Staff can add notes about stock status
- **Availability Function**: `is_item_available()` checks real-time availability

### Smart Order Modification System
- **Item Replacement Logic**:
  - Replace entire items with alternatives from same category
  - Replace proteins only (Teriyaki: chicken/salmon/tofu, Katsu: pork/chicken, etc.)
  - Intelligent price adjustments for protein swaps
- **Out-of-Stock Workflow**:
  - Mark items out of stock with duration options
  - Replace or cancel items when unavailable
  - Automatic total recalculation
- **Multi-step Confirmation**: Prevents accidental changes

---

## 💳 Payment & Order Processing

### Stripe Integration
- **Payment Processing**: Full Stripe Checkout integration
- **Multiple Payment Modes**: One-time payments for food orders
- **Automatic Refunds**: Partial and full refund processing
- **Payment Verification**: Secure payment confirmation
- **Edge Functions**:
  - `create-stripe-payment` - Creates checkout sessions
  - `verify-stripe-payment` - Verifies successful payments
  - `refund-stripe-payment` - Processes refunds with logging

### Order Management
- **Order Statuses**: pending → confirmed → ready_for_pickup → completed/cancelled
- **Order Creation**: `create_order_transaction()` function handles complete order processing
- **Order Items**: Detailed item tracking with quantities and special instructions
- **Customer Data**: Guest and registered customer support
- **Order History**: Complete order tracking for customers

---

## 📧 Communication System

### Email Notifications (via Resend)
- **Order Confirmation**: Sent immediately after payment
- **Ready for Pickup**: When order status changes
- **Order Cancellation**: With refund details
- **Order Modifications**: When items are swapped or cancelled
- **Edge Function**: `send-order-email` handles all email types

### Push Notifications
- **Web Push**: Browser notifications for order updates
- **Subscription Management**: Store and manage push subscriptions
- **Edge Functions**:
  - `store-push-subscription` - Saves user push subscriptions
  - `send-push-notification` - Sends targeted notifications

---

## 👤 User Management

### Authentication & Profiles
- **Supabase Auth**: Email/password authentication
- **User Profiles**: Extended user data storage
- **Roles**: customer, staff, admin role system
- **Guest Ordering**: Orders without account creation
- **Account Settings**: Profile management page

### User Features
- **Order History**: View past orders
- **Account Deletion**: `delete-user-account` edge function
- **Settings Management**: Update profile and preferences
- **SMS Opt-in**: Optional SMS notifications

---

## 🛡️ Admin & Staff Features

### Order Management Dashboard
- **Orders Overview**: Real-time order monitoring
- **Status Updates**: Change order statuses
- **Order Details**: View complete order information with customer data
- **Cancellation**: Full order cancellation with automatic refunds

### Menu Management
- **Add/Edit Items**: Complete menu item CRUD operations
- **Category Management**: Organize menu structure
- **Stock Management**: Update availability and stock status
- **Image Management**: Upload and manage menu images

### Gallery Management
- **Image Gallery**: Showcase restaurant images
- **Gallery Items**: Add/remove gallery images with captions

---

## 🏪 Customer Experience

### Ordering Flow
1. **Browse Menu**: Categorized menu with images and descriptions
2. **Add to Cart**: Shopping cart with quantity controls
3. **Special Instructions**: Per-item and order-level notes
4. **Guest/User Checkout**: Flexible checkout options
5. **Payment**: Secure Stripe processing
6. **Confirmation**: Immediate email confirmation

### Menu Features
- **Item Details**: Modal with full descriptions and options
- **Protein Selection**: Dynamic pricing for protein choices (Teriyaki, Katsu, etc.)
- **Out of Stock Indicators**: Visual badges and disabled ordering
- **Responsive Design**: Works on all devices

### Order Tracking
- **Order Status**: Real-time status updates
- **Email Updates**: Automatic notifications at each stage
- **Push Notifications**: Optional browser notifications

---

## 📱 Technical Features

### Mobile App Support
- **Capacitor Integration**: Native mobile app capabilities
- **Progressive Web App**: PWA features for mobile experience
- **Push Notifications**: Mobile-optimized notifications

### Database Structure
- **Orders Table**: Complete order tracking
- **Order Items**: Individual item details with modifications
- **Menu Items/Categories**: Menu structure
- **Profiles**: Extended user data
- **Notifications**: Communication logging
- **Gallery Items**: Image gallery management
- **Push Subscriptions**: Notification preferences

### Security & Performance
- **Row Level Security (RLS)**: Comprehensive data protection
- **Edge Functions**: Serverless backend processing
- **Image Storage**: Optimized image handling
- **Real-time Updates**: Live order status changes

---

## 🔧 Development Features

### Code Organization
- **Component Structure**: Modular React components
- **UI Components**: Shadcn/ui component library
- **Type Safety**: Full TypeScript implementation
- **Responsive Design**: Tailwind CSS with design system

### Integrations
- **Supabase**: Backend as a service
- **Stripe**: Payment processing
- **Resend**: Email service
- **Capacitor**: Mobile app framework

---

## 🚨 Important Implementation Notes

### Stock Management Logic
- Items with protein variants (Teriyaki, Katsu, Pho, Udon) use price-based identification
- Single menu item "Teriyaki" with different prices for chicken ($10), salmon ($12), tofu ($9)
- Order display shows specific protein names (e.g., "Teriyaki Chicken")

### Email System
- Uses existing `send-order-email` function for all communications
- Supports multiple event types: confirmation, ready, cancellation, modifications
- Includes order details, customer info, and refund information

### Refund Processing
- Uses existing `refund-stripe-payment` function
- Supports both partial and full refunds
- Automatic logging and customer notification
- Handles both payment_intent and checkout_session refunds

### Edge Functions Already Implemented
- ✅ `create-stripe-payment` - Payment processing
- ✅ `verify-stripe-payment` - Payment verification  
- ✅ `refund-stripe-payment` - Refund processing
- ✅ `send-order-email` - Email notifications
- ✅ `check-user-exists` - User validation
- ✅ `delete-user-account` - Account deletion
- ✅ `store-push-subscription` - Push notification setup
- ✅ `send-push-notification` - Push messaging

---

## 📋 TODO / Future Enhancements

### Potential Features (NOT YET IMPLEMENTED)
- Loyalty program
- Delivery tracking
- Multi-location support
- Inventory management
- Advanced analytics
- Social media integration
- Table reservations
- Catering orders

---
<!-- Updated: 2025-07-29 16:30:10 -->