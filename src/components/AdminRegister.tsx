import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Mail, ArrowLeft, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { auth } from '@/lib/auth';

interface AdminRegisterProps {
  onCheckEmail: (email: string, userType: 'admin') => void;
  onBack: () => void;
}

const AdminRegister = ({ onCheckEmail, onBack }: AdminRegisterProps) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }

    setIsLoading(true);
    
    try {
      // Check if user already exists
      const userProfile = await auth.checkUserByEmail(email.trim());
      
      if (userProfile.hasAdmin) {
        toast.error('An admin account with this email already exists. Please use the regular login.');
        setIsLoading(false);
        return;
      }

      // Send magic link for admin registration
      const result = await auth.sendMagicLink(email.trim(), 'admin');
      
      if (result.success) {
        onCheckEmail(email.trim(), 'admin');
        toast.success('Admin registration link sent! Please check your email to complete setup.');
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Admin registration error:', error);
      toast.error('Failed to process registration. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRegister();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        <Card className="shadow-xl border-2 border-purple-300">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl text-purple-600">
              Admin Registration
            </CardTitle>
            <CardDescription>
              Register for administrator access to the platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Admin Registration</p>
                  <p className="text-xs text-amber-700 mt-1">
                    Admin accounts require approval. You'll receive access after verification.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="border-purple-200 focus:border-purple-400"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="border-purple-200 focus:border-purple-400"
                  disabled={isLoading}
                />
              </div>
            </div>
            
            <Button 
              onClick={handleRegister} 
              className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
              disabled={!email.trim() || !name.trim() || isLoading}
            >
              {isLoading ? (
                <>
                  <Mail className="w-4 h-4 mr-2 animate-pulse" />
                  Sending Registration Link...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Request Admin Access
                </>
              )}
            </Button>

            <div className="text-center mt-4 space-y-2">
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-xs text-purple-700 font-medium flex items-center justify-center">
                  <Mail className="w-3 h-3 mr-1" />
                  Secure Registration Process
                </p>
                <p className="text-xs text-purple-600 mt-1">
                  We'll send you a secure link to complete your admin registration
                </p>
              </div>
            </div>

            <div className="text-center">
              <Button
                variant="ghost"
                onClick={onBack}
                className="text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminRegister;
