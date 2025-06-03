// Updated: 2025-07-29 16:30:11
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Capacitor } from '@capacitor/core';
import { AuthProvider } from "@/hooks/useAuth";
import { CartProvider } from "@/hooks/useCart";
import Index from "./pages/Index";
import Menu from "./pages/Menu";

import Gallery from "./pages/Gallery";
import Contact from "./pages/Contact";
import Auth from "./pages/Auth";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import Admin from "./pages/Admin";


import MobileApp from "./pages/MobileApp";
import OrderHistory from "./pages/OrderHistory";
import ResetPassword from "./pages/ResetPassword";
import AccountSettings from "./pages/AccountSettings";
import SetupPassword from "./pages/SetupPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Check if we're in a Capacitor mobile environment
const isMobileApp = Capacitor.isNativePlatform();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={isMobileApp ? <Navigate to="/mobile-app" replace /> : <Index />} />
              <Route path="/menu" element={<Menu />} />
              
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/order-success" element={<OrderSuccess />} />
              <Route path="/order-success/:orderId" element={<OrderSuccess />} />
              <Route path="/admin" element={<Admin />} />
              
              
              <Route path="/mobile-app" element={<MobileApp />} />
              <Route path="/order-history" element={<OrderHistory />} />
              <Route path="/account-settings" element={<AccountSettings />} />
              <Route path="/setup-password" element={<SetupPassword />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
