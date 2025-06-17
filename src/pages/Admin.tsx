// Updated: 2025-07-29 16:30:07
// Updated: 2025-07-29 16:30:06
// Updated: 2025-07-29 16:30:04
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Navigate } from 'react-router-dom';
import { Users, UtensilsCrossed, Images, TrendingUp } from 'lucide-react';
import { MenuManagement } from '@/components/admin/MenuManagement';
import { GalleryManagement } from '@/components/admin/GalleryManagement';
import { OrdersManagement } from '@/components/admin/OrdersManagement';
import { StockManagement } from '@/components/admin/StockManagement';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function Admin() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    menuItems: 0,
    galleryItems: 0,
    recentOrders: 0,
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchStats();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile information",
        variant: "destructive",
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const [ordersResult, menuResult, galleryResult] = await Promise.all([
        supabase.from('orders').select('*', { count: 'exact' }),
        supabase.from('menu_items').select('*', { count: 'exact' }),
        supabase.from('gallery_items').select('*', { count: 'exact' }),
      ]);

      // Recent orders (last 24 hours)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const { count: recentCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact' })
        .gte('created_at', yesterday.toISOString());

      setStats({
        totalOrders: ordersResult.count || 0,
        menuItems: menuResult.count || 0,
        galleryItems: galleryResult.count || 0,
        recentOrders: recentCount || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!profile || (profile.role !== 'admin' && profile.role !== 'staff')) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-3xl font-bold mb-4 text-destructive">Access Denied</h1>
          <p className="text-muted-foreground mb-8">
            You don't have permission to access the admin panel.
          </p>
          <Button asChild>
            <a href="/">Go Home</a>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <div className="flex items-center gap-2">
            <p className="text-muted-foreground">Welcome back, {profile.full_name || user.email}</p>
            <Badge variant="secondary">{profile.role}</Badge>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
              <p className="text-xs text-muted-foreground">
                {stats.recentOrders} in the last 24h
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Menu Items</CardTitle>
              <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.menuItems}</div>
              <p className="text-xs text-muted-foreground">Active items</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gallery Items</CardTitle>
              <Images className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.galleryItems}</div>
              <p className="text-xs text-muted-foreground">Photos & videos</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">Coming soon</p>
            </CardContent>
          </Card>
        </div>

        {/* Management Tabs */}
        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="menu">Menu</TabsTrigger>
            <TabsTrigger value="stock">Stock</TabsTrigger>
            <TabsTrigger value="gallery">Gallery</TabsTrigger>
          </TabsList>
          
          <TabsContent value="orders">
            <OrdersManagement />
          </TabsContent>
          
          <TabsContent value="menu">
            <MenuManagement onStatsUpdate={fetchStats} />
          </TabsContent>
          
          <TabsContent value="stock">
            <StockManagement />
          </TabsContent>
          
          <TabsContent value="gallery">
            <GalleryManagement onStatsUpdate={fetchStats} />
          </TabsContent>
        </Tabs>
      </div>
      
      <Footer />
    </div>
  );
}