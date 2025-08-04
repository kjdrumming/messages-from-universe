import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Mail, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { auth } from '@/lib/auth';

interface AdminLoginProps {
  onCheckEmail: (email: string, userType: 'admin') => void;
  onBack?: () => void;
}

const AdminLogin = ({ onCheckEmail, onBack }: AdminLoginProps) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAdminSignIn = async () => {
    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    setIsLoading(true);
    
    try {
      // Send admin magic link directly - let Supabase handle the authentication
      console.log('AdminLogin: Sending admin magic link for:', email.trim());
      const result = await auth.sendMagicLink(email.trim(), 'admin');
      
      if (result.success) {
        onCheckEmail(email.trim(), 'admin');
        toast.success('Check your email for the admin sign-in link!');
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Admin login error:', error);
      toast.error('Failed to process admin login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAdminSignIn();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        <Card className="shadow-xl border-2 border-gradient-to-r from-purple-300 to-indigo-300">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Admin Portal
            </CardTitle>
            <CardDescription>
              Enter your admin email to access the dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="admin-email">Admin Email Address</Label>
              <Input
                id="admin-email"
                type="email"
                placeholder="Enter your admin email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                className="border-purple-200 focus:border-indigo-400"
                disabled={isLoading}
              />
            </div>
            
            <Button 
              onClick={handleAdminSignIn} 
              className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
              disabled={!email.trim() || isLoading}
            >
              {isLoading ? (
                <>
                  <Mail className="w-4 h-4 mr-2 animate-pulse" />
                  Sending Admin Magic Link...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Admin Sign In
                </>
              )}
            </Button>

            <div className="text-center mt-4 space-y-2">
              <div className="p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
                <p className="text-xs text-gray-700 font-medium flex items-center justify-center">
                  <Shield className="w-3 h-3 mr-1" />
                  Admin Access Only
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Only registered administrators can access this portal
                </p>
              </div>
            </div>

            {onBack && (
              <div className="text-center">
                <Button
                  variant="ghost"
                  onClick={onBack}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Customer Login
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminLogin;
