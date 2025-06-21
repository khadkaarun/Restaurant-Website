// Updated: 2025-07-29 16:30:23
// Updated: 2025-07-29 16:30:14
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const usePushNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if push notifications are supported
    setIsSupported('serviceWorker' in navigator && 'PushManager' in window);
    
    if (isSupported) {
      setPermission(Notification.permission);
      
      // Register service worker
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('Service Worker registered:', registration);
          return registration.pushManager.getSubscription();
        })
        .then(sub => {
          setSubscription(sub);
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }, [isSupported]);

  const requestPermission = async () => {
    if (!isSupported) {
      toast({
        title: "Not Supported",
        description: "Push notifications are not supported in this browser.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);
      
      if (permission === 'granted') {
        await subscribeToPush();
        toast({
          title: "Notifications Enabled",
          description: "You'll receive updates about your orders!",
        });
        return true;
      } else {
        toast({
          title: "Permission Denied",
          description: "Enable notifications in your browser settings to receive order updates.",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast({
        title: "Error",
        description: "Failed to enable notifications. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const subscribeToPush = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Generate VAPID keys or use your own
      const applicationServerKey = urlB64ToUint8Array(
        'BEl62iUYgUivxIkv69yViEuiBIa40HI80YmqjFGEgj4_PJjxjMiAcXcNWp6oTVnOBx7dKG5BHhZ5bxKOwNUDfek'
      );

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey,
      });

      setSubscription(subscription);
      
      // Store subscription in database
      await storeSubscription(subscription);
      
      return subscription;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      throw error;
    }
  };

  const storeSubscription = async (subscription: PushSubscription) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Store subscription in Supabase
      const { error } = await supabase.functions.invoke('store-push-subscription', {
        body: {
          subscription: subscription.toJSON(),
          userId: user?.id || null,
          userAgent: navigator.userAgent,
        }
      });

      if (error) {
        console.error('Error storing subscription:', error);
      }
    } catch (error) {
      console.error('Error storing subscription:', error);
    }
  };

  const unsubscribe = async () => {
    if (subscription) {
      try {
        await subscription.unsubscribe();
        setSubscription(null);
        
        // Remove from database
        await supabase.functions.invoke('remove-push-subscription', {
          body: { endpoint: subscription.endpoint }
        });
        
        toast({
          title: "Notifications Disabled",
          description: "You won't receive push notifications anymore.",
        });
      } catch (error) {
        console.error('Error unsubscribing:', error);
        toast({
          title: "Error",
          description: "Failed to disable notifications.",
          variant: "destructive",
        });
      }
    }
  };

  return {
    permission,
    subscription,
    isSupported,
    requestPermission,
    unsubscribe,
    isSubscribed: !!subscription,
  };
};

// Helper function to convert VAPID key
function urlB64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}