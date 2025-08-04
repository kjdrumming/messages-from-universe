import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Shield, User, ArrowLeft } from 'lucide-react';

interface UnifiedPortalSelectionProps {
  userName: string;
  onSelectPortal: (portal: 'customer' | 'admin') => void;
  onSignOut: () => void;
}

const UnifiedPortalSelection = ({ userName, onSelectPortal, onSignOut }: UnifiedPortalSelectionProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Welcome back, {userName}!
          </h1>
          <p className="text-xl text-gray-600">
            Choose which portal you'd like to access
          </p>
          <div className="flex items-center justify-center space-x-2 mt-4">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Universe Receiver
            </Badge>
            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
              Universe Messenger
            </Badge>
          </div>
        </div>

        {/* Portal Selection Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Customer Portal */}
          <Card className="hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 hover:border-blue-300 cursor-pointer"
                onClick={() => onSelectPortal('customer')}>
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl text-blue-600">Universe Receiver</CardTitle>
              <CardDescription className="text-base">
                Receive daily motivation and manage your spiritual journey
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-gray-600">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  Daily motivational messages
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  Customizable notification schedules
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  Personal journey tracking
                </div>
              </div>
              <Button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
                <Sparkles className="w-4 h-4 mr-2" />
                Enter Universe Receiver
              </Button>
            </CardContent>
          </Card>

          {/* Admin Portal */}
          <Card className="hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 hover:border-purple-300 cursor-pointer"
                onClick={() => onSelectPortal('admin')}>
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl text-purple-600">Universe Messenger</CardTitle>
              <CardDescription className="text-base">
                Manage content, users, and platform settings
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-gray-600">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                  Manage motivational messages
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                  AI message generation
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                  User management & analytics
                </div>
              </div>
              <Button className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700">
                <Shield className="w-4 h-4 mr-2" />
                Enter Universe Messenger
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Sign Out Button */}
        <div className="text-center">
          <Button
            variant="outline"
            onClick={onSignOut}
            className="border-red-300 text-red-600 hover:bg-red-50"
          >
            <User className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UnifiedPortalSelection;
