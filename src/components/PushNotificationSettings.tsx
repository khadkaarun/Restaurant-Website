// Updated: 2025-07-29 16:30:14
import React from 'react';
import { Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export const PushNotificationSettings = () => {
  const { 
    permission, 
    isSupported, 
    isSubscribed, 
    requestPermission, 
    unsubscribe 
  } = usePushNotifications();

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Push notifications are not supported in this browser.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Push Notifications
        </CardTitle>
        <CardDescription>
          Get notified about your order status updates
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Order Updates</p>
            <p className="text-sm text-muted-foreground">
              Receive notifications when your order status changes
            </p>
          </div>
          
          {permission === 'granted' && isSubscribed ? (
            <Button 
              variant="outline" 
              size="sm"
              onClick={unsubscribe}
            >
              Disable
            </Button>
          ) : (
            <Button 
              size="sm"
              onClick={requestPermission}
              disabled={permission === 'denied'}
            >
              {permission === 'denied' ? 'Blocked' : 'Enable'}
            </Button>
          )}
        </div>
        
        {permission === 'denied' && (
          <p className="text-sm text-muted-foreground">
            Notifications are blocked. Enable them in your browser settings to receive order updates.
          </p>
        )}
      </CardContent>
    </Card>
  );
};