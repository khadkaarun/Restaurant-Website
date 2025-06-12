import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Key } from 'lucide-react';

export default function ResetPassword() {
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validSession, setValidSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Log all URL parameters for debugging
  console.log('All URL search params:', Object.fromEntries(searchParams.entries()));
  console.log('Current URL:', window.location.href);

  useEffect(() => {
    const handlePasswordReset = async () => {
      try {
        // Check if this page was reached via password reset link
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token') || searchParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token');
        const type = hashParams.get('type') || searchParams.get('type');
        
        console.log('Hash params:', Object.fromEntries(hashParams.entries()));
        console.log('Search params:', Object.fromEntries(searchParams.entries()));
        console.log('Type:', type);
        console.log('Access token exists:', !!accessToken);
        console.log('Refresh token exists:', !!refreshToken);

        if (type === 'recovery' && accessToken && refreshToken) {
          console.log('Setting session with tokens...');
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          
          console.log('Set session result:', { data, error });
          
          if (!error && data.session) {
            setValidSession(true);
            console.log('Valid session established');
          } else {
            console.error('Failed to set session:', error);
          }
        } else {
          console.log('No valid reset tokens found');
        }
      } catch (error) {
        console.error('Error handling password reset:', error);
      } finally {
        setCheckingSession(false);
      }
    };

    handlePasswordReset();
  }, [searchParams]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are the same.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Password updated!",
        description: "Your password has been successfully updated. You can now sign in.",
      });

      // Sign out and redirect to auth page
      await supabase.auth.signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Error updating password:', error);
      toast({
        title: "Error updating password",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Verifying reset link...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!validSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="text-center">
              <Key className="h-12 w-12 mx-auto mb-4 text-destructive" />
              <CardTitle className="text-2xl font-playfair">Invalid Reset Link</CardTitle>
              <CardDescription>
                This password reset link is invalid or has expired. Please request a new one.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/auth">
                <Button className="w-full">
                  Back to Sign In
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Link to="/auth" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to sign in
          </Link>
        </div>
        
        <Card>
          <CardHeader className="text-center">
            <Key className="h-12 w-12 mx-auto mb-4 text-primary" />
            <CardTitle className="text-2xl font-playfair">Reset Your Password</CardTitle>
            <CardDescription>Enter your new password below</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Password
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}