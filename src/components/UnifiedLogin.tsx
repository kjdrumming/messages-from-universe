import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, Mail, Shield, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { auth } from '@/lib/auth';

interface UnifiedLoginProps {
  onCheckEmail: (email: string, userType: 'customer') => void;
  onAdminRegister: () => void;
  onAdminLogin: () => void;
  onBack?: () => void;
}

const UnifiedLogin = ({ onCheckEmail, onAdminRegister, onAdminLogin, onBack }: UnifiedLoginProps) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    setIsLoading(true);
    
    try {
      // Customer portal only - always send customer magic link
      const result = await auth.sendMagicLink(email.trim(), 'customer');
      if (result.success) {
        onCheckEmail(email.trim(), 'customer');
        toast.success('Check your email for the magic link to sign in!');
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Failed to process login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSignIn();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        <Card className="shadow-xl border-2 border-gradient-to-r from-blue-300 to-purple-300">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Messages from the Universe
            </CardTitle>
            <CardDescription>
              Enter your email to receive daily zen messages
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                className="border-blue-200 focus:border-purple-400"
                disabled={isLoading}
              />
            </div>
            
            <Button 
              onClick={handleSignIn} 
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              disabled={!email.trim() || isLoading}
            >
              {isLoading ? (
                <>
                  <Mail className="w-4 h-4 mr-2 animate-pulse" />
                  Sending Magic Link...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Sign In / Register
                </>
              )}
            </Button>

            <div className="text-center space-y-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-gray-50 px-2 text-gray-500">Admin Access</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Button
                  variant="outline"
                  onClick={onAdminLogin}
                  className="w-full border-purple-300 text-purple-600 hover:bg-purple-50"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Admin Login
                </Button>
                
                <Button
                  variant="ghost"
                  onClick={onAdminRegister}
                  className="w-full text-purple-600 hover:bg-purple-50 text-sm"
                >
                  Register as Admin
                </Button>
              </div>
            </div>

            <div className="text-center mt-4 space-y-2">
              <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-purple-200">
                <p className="text-xs text-gray-700 font-medium flex items-center justify-center">
                  <Mail className="w-3 h-3 mr-1" />
                  Passwordless Authentication
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  We'll send you a secure magic link to access your account(s)
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
                  Back
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UnifiedLogin;
