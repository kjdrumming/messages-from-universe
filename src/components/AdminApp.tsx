import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Users, MessageSquare, Sparkles, Trash2, Edit, Plus, Mail, ArrowLeft, User, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { auth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { MessageGeneratorService } from '@/lib/messageGenerator';
import type { AdminUser, MotivationalMessage } from '@/lib/supabase';
import { SessionManager, withSessionCheck } from '@/lib/session-manager';

interface Message {
  id: string;
  content: string;
  category: string;
  status: 'active' | 'draft';
  created_at: string;
  updated_at: string;
  created_by?: string;
}

interface AdminAppProps {
  onBack: () => void;
}

const AdminApp = ({ onBack }: AdminAppProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [adminProfile, setAdminProfile] = useState<AdminUser | null>(null);
  const [adminName, setAdminName] = useState('');
  const [email, setEmail] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeUsersCount, setActiveUsersCount] = useState(0);
  const [newMessage, setNewMessage] = useState('');
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Set up authentication and session management
  useEffect(() => {
    const initializeSession = async () => {
      await SessionManager.initialize();
      await checkAuthStatus();
    };

    initializeSession();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Admin auth state change:', event, session?.user?.email);
      if (event === 'SIGNED_IN' && session) {
        await handleAuthSuccess(session.user.id, session.user.email!);
      } else if (event === 'SIGNED_OUT') {
        handleAuthStateSignOut();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load messages when admin is logged in
  useEffect(() => {
    if (isLoggedIn && adminProfile) {
      loadMessages();
    }
  }, [isLoggedIn, adminProfile]);

  const checkAuthStatus = async () => {
    try {
      const user = await auth.getCurrentUser();
      if (user && user.userTypes.includes('admin')) {
        await loadAdminProfile(user.id);
        setIsLoggedIn(true);
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAdminProfile = async (authUserId: string) => {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('auth_user_id', authUserId)
        .single();

      if (error) throw error;

      setAdminProfile(data);
      setAdminName(data.name || data.email.split('@')[0]);
      
      // Load active users count
      await loadActiveUsersCount();
    } catch (error) {
      console.error('Error loading admin profile:', error);
      toast.error('Failed to load admin profile');
    }
  };

  const loadActiveUsersCount = async () => {
    try {
      const { count, error } = await supabase
        .from('customer_users')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;

      setActiveUsersCount(count || 0);
      console.log('✅ Active users count loaded:', count);
    } catch (error) {
      console.error('Error loading active users count:', error);
      // Don't show error toast as this is not critical
    }
  };

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('motivational_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const handleAuthSuccess = async (authUserId: string, userEmail: string) => {
    try {
      // Check if admin profile exists
      const { data: existingProfile } = await supabase
        .from('admin_users')
        .select('*')
        .eq('auth_user_id', authUserId)
        .single();

      if (!existingProfile) {
        // Create new admin profile
        await auth.createAdminProfile(authUserId, userEmail);
        toast.success('Welcome! Your universe messenger account has been created.');
      } else {
        toast.success('Welcome back to the Messages from the Universe Admin!');
      }

      await loadAdminProfile(authUserId);
      setIsLoggedIn(true);
    } catch (error) {
      console.error('Error handling admin auth success:', error);
      toast.error('Failed to complete admin sign-in');
    }
  };

  const handleAdminLogin = async () => {
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setIsLoading(true);
    const result = await auth.sendMagicLink(email, 'admin');
    
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
    setIsLoading(false);
  };

  // For magic link auth, sign-in and registration are the same
  const handleAdminRegister = async () => {
    await handleAdminLogin();
  };

  const handleSignOut = async () => {
    try {
      console.log('🚪 Admin requesting sign out...');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Admin sign out error:', error);
        toast.error('Failed to sign out. Please try again.');
        return;
      }
      
      // Clear session data
      SessionManager.logout();
      
      // Reset component state
      setIsLoggedIn(false);
      setAdminProfile(null);
      setAdminName('');
      setEmail('');
      setMessages([]);
      
      toast.success('You have been signed out successfully');
      console.log('✅ Admin signed out successfully');
      
      // Redirect to portal selection page
      onBack();
    } catch (error) {
      console.error('Unexpected admin sign out error:', error);
      toast.error('Failed to sign out. Please try again.');
    }
  };

  const handleAuthStateSignOut = () => {
    // This function is called by auth state change handlers only
    // Don't call onBack() here to avoid conflicts with manual signout
    console.log('🔐 Admin auth state changed to signed out');
    setIsLoggedIn(false);
    setAdminProfile(null);
    setAdminName('');
    setEmail('');
    setMessages([]);
  };

  // Check if a message already exists in the database
  const isMessageUnique = async (content: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('motivational_messages')
        .select('id')
        .eq('content', content.trim())
        .limit(1);

      if (error) {
        console.error('Error checking message uniqueness:', error);
        return true; // Allow the message if we can't check
      }

      return !data || data.length === 0;
    } catch (error) {
      console.error('Error in uniqueness check:', error);
      return true; // Allow the message if we can't check
    }
  };

  // Generate unique messages with retry logic
  const generateUniqueMessages = async (count: number, theme?: string): Promise<any[]> => {
    const uniqueMessages = [];
    let attempts = 0;
    const maxAttempts = count * 3; // Allow 3x attempts to find unique messages

    while (uniqueMessages.length < count && attempts < maxAttempts) {
      attempts++;
      
      let generatedMessage;
      if (theme) {
        generatedMessage = MessageGeneratorService.generateCustomMessage(theme);
      } else {
        const messages = await MessageGeneratorService.generateMessages(1);
        generatedMessage = messages[0];
      }

      if (generatedMessage && await isMessageUnique(generatedMessage.content)) {
        uniqueMessages.push({
          content: generatedMessage.content,
          category: generatedMessage.category,
          status: 'draft' as const,
          created_by: adminProfile?.id
        });
      }
    }

    return uniqueMessages;
  };

  const generateAIMessages = async () => {
    if (!adminProfile) return;
    
    setIsGenerating(true);
    
    try {
      toast.info('Generating unique motivational messages from multiple sources...');
      
      // Generate unique messages using our new service
      const uniqueMessages = await generateUniqueMessages(3);
      
      if (uniqueMessages.length === 0) {
        toast.warning('Could not generate any unique messages. All generated content already exists in your database.');
        return;
      }

      const { data, error } = await supabase
        .from('motivational_messages')
        .insert(uniqueMessages)
        .select();

      if (error) throw error;

      setMessages(prev => [...(data || []), ...prev]);
      
      if (uniqueMessages.length < 3) {
        toast.success(`Generated ${uniqueMessages.length} new unique messages! (${3 - uniqueMessages.length} duplicates were skipped)`);
      } else {
        toast.success(`Successfully generated ${uniqueMessages.length} new unique motivational messages!`);
      }
    } catch (error) {
      console.error('Error generating AI messages:', error);
      toast.error('Failed to generate AI messages. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateThemeMessage = async (theme: string) => {
    if (!adminProfile) return;
    
    try {
      toast.info(`Generating unique ${theme} messages...`);
      
      // Generate 3 unique messages for the selected theme
      const uniqueMessages = await generateUniqueMessages(3, theme);
      
      if (uniqueMessages.length === 0) {
        toast.warning(`Could not generate any unique ${theme} messages. All generated content already exists in your database.`);
        return;
      }

      const { data, error } = await supabase
        .from('motivational_messages')
        .insert(uniqueMessages)
        .select();

      if (error) throw error;

      setMessages(prev => [...(data || []), ...prev]);
      
      if (uniqueMessages.length < 3) {
        toast.success(`Generated ${uniqueMessages.length} new unique ${theme} messages! (${3 - uniqueMessages.length} duplicates were skipped)`);
      } else {
        toast.success(`Generated 3 new unique ${theme} messages!`);
      }
    } catch (error) {
      console.error('Error generating theme message:', error);
      toast.error('Failed to generate theme messages');
    }
  };

  const addMessage = async () => {
    if (!newMessage.trim() || !adminProfile) return;
    
    try {
      // Check if the message already exists
      const isUnique = await isMessageUnique(newMessage.trim());
      
      if (!isUnique) {
        toast.warning('This message already exists in your database. Please enter a different message.');
        return;
      }

      const { data, error } = await supabase
        .from('motivational_messages')
        .insert({
          content: newMessage.trim(),
          category: 'Custom',
          status: 'draft',
          created_by: adminProfile.id
        })
        .select()
        .single();

      if (error) throw error;

      setMessages(prev => [data, ...prev]);
      setNewMessage('');
      toast.success('Unique message added successfully!');
    } catch (error) {
      console.error('Error adding message:', error);
      toast.error('Failed to add message');
    }
  };

  const deleteMessage = async (id: string) => {
    try {
      const { error } = await supabase
        .from('motivational_messages')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMessages(prev => prev.filter(m => m.id !== id));
      toast.success('Message deleted');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  };

  const toggleMessageStatus = async (id: string) => {
    try {
      const message = messages.find(m => m.id === id);
      if (!message) return;

      const newStatus = message.status === 'active' ? 'draft' : 'active';
      
      const { error } = await supabase
        .from('motivational_messages')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      setMessages(prev => prev.map(m => 
        m.id === id ? { ...m, status: newStatus } : m
      ));
      
      toast.success(`Message ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
    } catch (error) {
      console.error('Error updating message status:', error);
      toast.error('Failed to update message status');
    }
  };

  const updateMessage = async (id: string, content: string) => {
    try {
      const { error } = await supabase
        .from('motivational_messages')
        .update({ content })
        .eq('id', id);

      if (error) throw error;

      setMessages(prev => prev.map(m => 
        m.id === id ? { ...m, content } : m
      ));
      setEditingMessage(null);
      toast.success('Message updated!');
    } catch (error) {
      console.error('Error updating message:', error);
      toast.error('Failed to update message');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Settings className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md mx-auto">
          <Card className="shadow-xl border-2 border-purple-200">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
                <Settings className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">
                Universe Messenger
              </CardTitle>
              <CardDescription>
                Enter your admin email to receive a secure sign-in link
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-email">Admin Email Address</Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="Enter your admin email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-purple-200 focus:border-purple-400"
                  disabled={isLoading}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  onClick={handleAdminLogin} 
                  className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                  disabled={!email || isLoading}
                >
                  {isLoading ? (
                    <>
                      <Mail className="w-4 h-4 mr-2 animate-pulse" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Admin Sign In
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleAdminRegister}
                  className="border-purple-300 text-purple-600 hover:bg-purple-50"
                  disabled={!email || isLoading}
                >
                  {isLoading ? (
                    <>
                      <Mail className="w-4 h-4 mr-2 animate-pulse" />
                      Sending...
                    </>
                  ) : (
                    'Register Admin'
                  )}
                </Button>
              </div>
              
              <div className="text-center mt-4 space-y-2">
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-xs text-purple-700 font-medium flex items-center justify-center">
                    <Mail className="w-3 h-3 mr-1" />
                    Secure Admin Authentication
                  </p>
                  <p className="text-xs text-purple-600 mt-1">
                    We'll send you a secure magic link for admin access
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Messages from the Universe - Admin
            </h1>
            <p className="text-gray-600">Welcome, {adminName}! Manage universal messages and inspire souls</p>
          </div>
          <div className="flex items-center space-x-3">
            <Badge variant="secondary">Admin: {adminName}</Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={onBack}
              className="border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              <User className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold">{activeUsersCount}</div>
                  <div className="text-sm text-gray-600">Active Users</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold">{messages.length}</div>
                  <div className="text-sm text-gray-600">Total Messages</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-green-600" />
                <div>
                  <div className="text-2xl font-bold">{messages.filter(m => m.status === 'active').length}</div>
                  <div className="text-sm text-gray-600">Active Messages</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Settings className="w-5 h-5 text-orange-600" />
                <div>
                  <div className="text-2xl font-bold">89%</div>
                  <div className="text-sm text-gray-600">Engagement Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="messages" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="messages" className="space-y-6">
            {/* AI Generation Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5" />
                  <span>AI Message Generator</span>
                </CardTitle>
                <CardDescription>
                  Generate inspiring messages from multiple AI sources and quote databases
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-purple-200">
                  <h4 className="font-medium text-gray-800 mb-2">✨ Generation Sources:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Quotable API - Curated inspirational quotes</li>
                    <li>• ZenQuotes - Wisdom and motivation database</li>
                    <li>• AI-crafted messages - Custom motivational content</li>
                    <li>• Fallback collection - High-quality backup messages</li>
                  </ul>
                </div>
                
                <Button 
                  onClick={generateAIMessages} 
                  disabled={isGenerating}
                  className="w-full bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700"
                >
                  {isGenerating ? (
                    <>
                      <Wand2 className="w-4 h-4 mr-2 animate-bounce" />
                      Generating from multiple sources...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate 3 New Messages
                    </>
                  )}
                </Button>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Quick Theme Messages:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => generateThemeMessage('morning')}
                      className="text-xs"
                    >
                      🌅 Morning
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => generateThemeMessage('strength')}
                      className="text-xs"
                    >
                      💪 Strength
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => generateThemeMessage('growth')}
                      className="text-xs"
                    >
                      🌱 Growth
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => generateThemeMessage('purpose')}
                      className="text-xs"
                    >
                      🎯 Purpose
                    </Button>
                  </div>
                </div>
                
                <div className="text-xs text-gray-500 text-center">
                  Messages are generated as drafts. Review and activate them below.
                </div>
              </CardContent>
            </Card>

            {/* Add New Message */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Plus className="w-5 h-5" />
                  <span>Add New Message</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Enter your motivational message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <Button onClick={addMessage} variant="outline">
                  Add Message
                </Button>
              </CardContent>
            </Card>

            {/* Messages List */}
            <Card>
              <CardHeader>
                <CardTitle>All Messages</CardTitle>
                <CardDescription>
                  Manage your motivational message collection
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div key={message.id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          {editingMessage === message.id ? (
                            <Textarea
                              value={message.content}
                              onChange={(e) => updateMessage(message.id, e.target.value)}
                              onBlur={() => setEditingMessage(null)}
                              autoFocus
                            />
                          ) : (
                            <p className="text-sm">{message.content}</p>
                          )}
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary">{message.category}</Badge>
                            <Badge variant={message.status === 'active' ? 'default' : 'outline'}>
                              {message.status}
                            </Badge>
                            <span className="text-xs text-gray-500">{new Date(message.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingMessage(message.id)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleMessageStatus(message.id)}
                          >
                            {message.status === 'active' ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteMessage(message.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage subscriptions and user preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>User management features coming soon...</p>
                  <p className="text-sm">This will include subscription management, user analytics, and more.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>App Settings</CardTitle>
                <CardDescription>
                  Configure your app preferences and integrations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Settings panel coming soon...</p>
                  <p className="text-sm">This will include notification settings, AI configuration, and more.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminApp;
