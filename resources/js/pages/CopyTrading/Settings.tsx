import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { PageProps } from '@/types';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import axios from 'axios';
import { route } from '@/ziggy';
import { 
  Shield, Users, CheckCircle, XCircle, AlertTriangle, 
  UserPlus, UserMinus, Settings, Bell
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

interface CopyTradingSettings {
  id?: number;
  user_id: number;
  privacy_level: 'public' | 'followers_only' | 'approved_only' | 'private';
  auto_approve_followers: boolean;
  notify_on_copy_request: boolean;
  copy_trading_bio: string | null;
}

interface CopyTradingRelationship {
  id: number;
  trader_user_id: number;
  copier_user_id: number;
  status: 'active' | 'paused' | 'stopped';
  approval_status: 'pending' | 'approved' | 'rejected';
  started_at: string;
  paused_at: string | null;
  stopped_at: string | null;
  trader?: User;
  copier?: User;
}

interface User {
  id: number;
  name: string;
  email: string;
  profile_photo_path?: string;
}

interface CopyTradingSettingsPageProps extends PageProps {
  settings: CopyTradingSettings;
  pendingRequests: CopyTradingRelationship[];
  activeCopiers: CopyTradingRelationship[];
  stats: {
    totalCopiers: number;
    pendingRequests: number;
  };
}

export default function CopyTradingSettings({ auth, settings, pendingRequests, activeCopiers, stats }: CopyTradingSettingsPageProps) {
  const [isLoading, setIsLoading] = useState<Record<number, boolean>>({});
  const [formData, setFormData] = useState<CopyTradingSettings>(settings);
  const [activeTab, setActiveTab] = useState('settings');
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle switch changes
  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };
  
  // Handle radio changes
  const handleRadioChange = (value: string) => {
    setFormData(prev => ({ ...prev, privacy_level: value as any }));
  };
  
  // Save settings
  const saveSettings = async () => {
    setIsLoading(prev => ({ ...prev, saveSettings: true }));
    
    try {
      await axios.post(route('copy-trading.updateSettings'), formData, {
        headers: {
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      });
      
      toast.success('Copy trading settings updated successfully');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings. Please try again.');
    } finally {
      setIsLoading(prev => ({ ...prev, saveSettings: false }));
    }
  };
  
  // Handle approve request
  const handleApprove = async (relationship: CopyTradingRelationship) => {
    const relationshipId = relationship.id;
    
    if (!confirm(`Are you sure you want to approve ${relationship.copier?.name}'s request to copy your trades?`)) {
      return;
    }
    
    setIsLoading(prev => ({ ...prev, [relationshipId]: true }));
    
    try {
      await axios.post(route('copy-trading.approve', relationshipId), {}, {
        headers: {
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      });
      
      // Remove from pending requests and add to active copiers
      const updatedRelationship = { 
        ...relationship, 
        approval_status: 'approved',
        status: 'active'
      };
      
      toast.success(`Approved ${relationship.copier?.name}'s request to copy your trades`);
      
      // Reload the page to update the lists
      window.location.reload();
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Failed to approve request. Please try again.');
    } finally {
      setIsLoading(prev => ({ ...prev, [relationshipId]: false }));
    }
  };
  
  // Handle reject request
  const handleReject = async (relationship: CopyTradingRelationship) => {
    const relationshipId = relationship.id;
    
    if (!confirm(`Are you sure you want to reject ${relationship.copier?.name}'s request to copy your trades?`)) {
      return;
    }
    
    setIsLoading(prev => ({ ...prev, [relationshipId]: true }));
    
    try {
      await axios.post(route('copy-trading.reject', relationshipId), {}, {
        headers: {
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      });
      
      toast.success(`Rejected ${relationship.copier?.name}'s request to copy your trades`);
      
      // Reload the page to update the lists
      window.location.reload();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to reject request. Please try again.');
    } finally {
      setIsLoading(prev => ({ ...prev, [relationshipId]: false }));
    }
  };
  
  // Handle block copier
  const handleBlock = async (relationship: CopyTradingRelationship) => {
    const relationshipId = relationship.id;
    
    if (!confirm(`Are you sure you want to block ${relationship.copier?.name} from copying your trades? This will terminate the copy trading relationship.`)) {
      return;
    }
    
    setIsLoading(prev => ({ ...prev, [relationshipId]: true }));
    
    try {
      await axios.post(route('copy-trading.block', relationshipId), {}, {
        headers: {
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      });
      
      toast.success(`Blocked ${relationship.copier?.name} from copying your trades`);
      
      // Reload the page to update the lists
      window.location.reload();
    } catch (error) {
      console.error('Error blocking copier:', error);
      toast.error('Failed to block copier. Please try again.');
    } finally {
      setIsLoading(prev => ({ ...prev, [relationshipId]: false }));
    }
  };
  
  // Helper function to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  return (
    <AppLayout
      user={auth.user}
      header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Copy Trading Settings</h2>}
    >
      <Head title="Copy Trading Settings" />
      
      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Stats Cards */}
            <Card className="bg-white dark:bg-gray-800 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Copiers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-muted-foreground mr-2" />
                  <p className="text-2xl font-bold">{stats.totalCopiers}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white dark:bg-gray-800 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <UserPlus className="h-5 w-5 text-muted-foreground mr-2" />
                  <p className="text-2xl font-bold">{stats.pendingRequests}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white dark:bg-gray-800 shadow-sm md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Privacy Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Shield className="h-5 w-5 text-muted-foreground mr-2" />
                  <p className="text-lg font-medium">
                    {formData.privacy_level === 'public' && 'Public - Anyone can copy your trades'}
                    {formData.privacy_level === 'followers_only' && 'Followers Only - Only your followers can copy your trades'}
                    {formData.privacy_level === 'approved_only' && 'Approval Required - You must approve all copy requests'}
                    {formData.privacy_level === 'private' && 'Private - No one can copy your trades'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </TabsTrigger>
                <TabsTrigger value="pending" className="relative">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Pending Requests
                  {pendingRequests.length > 0 && (
                    <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                      {pendingRequests.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="active">
                  <Users className="h-4 w-4 mr-2" />
                  Active Copiers
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="settings" className="mt-6">
                <Card className="bg-white dark:bg-gray-800 shadow-sm">
                  <CardHeader>
                    <CardTitle>Copy Trading Privacy Settings</CardTitle>
                    <CardDescription>
                      Control who can copy your trades and how requests are handled
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Privacy Level</h3>
                      <RadioGroup 
                        value={formData.privacy_level} 
                        onValueChange={handleRadioChange}
                        className="space-y-3"
                      >
                        <div className="flex items-start space-x-2">
                          <RadioGroupItem value="public" id="public" />
                          <div className="grid gap-1.5">
                            <Label htmlFor="public" className="font-medium">Public</Label>
                            <p className="text-sm text-muted-foreground">
                              Anyone can copy your trades without approval
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start space-x-2">
                          <RadioGroupItem value="followers_only" id="followers_only" />
                          <div className="grid gap-1.5">
                            <Label htmlFor="followers_only" className="font-medium">Followers Only</Label>
                            <p className="text-sm text-muted-foreground">
                              Only users who follow you can copy your trades
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start space-x-2">
                          <RadioGroupItem value="approved_only" id="approved_only" />
                          <div className="grid gap-1.5">
                            <Label htmlFor="approved_only" className="font-medium">Approval Required</Label>
                            <p className="text-sm text-muted-foreground">
                              You must manually approve all copy trading requests
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start space-x-2">
                          <RadioGroupItem value="private" id="private" />
                          <div className="grid gap-1.5">
                            <Label htmlFor="private" className="font-medium">Private</Label>
                            <p className="text-sm text-muted-foreground">
                              No one can copy your trades
                            </p>
                          </div>
                        </div>
                      </RadioGroup>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Notification Preferences</h3>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="auto_approve">Auto-approve followers</Label>
                          <p className="text-sm text-muted-foreground">
                            Automatically approve copy requests from your followers
                          </p>
                        </div>
                        <Switch 
                          id="auto_approve"
                          checked={formData.auto_approve_followers}
                          onCheckedChange={(checked) => handleSwitchChange('auto_approve_followers', checked)}
                          disabled={formData.privacy_level !== 'followers_only'}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="notify_requests">Notify on copy requests</Label>
                          <p className="text-sm text-muted-foreground">
                            Receive notifications when someone requests to copy your trades
                          </p>
                        </div>
                        <Switch 
                          id="notify_requests"
                          checked={formData.notify_on_copy_request}
                          onCheckedChange={(checked) => handleSwitchChange('notify_on_copy_request', checked)}
                        />
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Copy Trading Bio</h3>
                      <p className="text-sm text-muted-foreground">
                        Share information about your trading strategy with potential copiers
                      </p>
                      <Textarea 
                        name="copy_trading_bio"
                        value={formData.copy_trading_bio || ''}
                        onChange={handleInputChange}
                        placeholder="Describe your trading strategy, experience, and what copiers can expect..."
                        className="min-h-[120px]"
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button 
                      onClick={saveSettings}
                      disabled={isLoading.saveSettings}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      {isLoading.saveSettings ? 'Saving...' : 'Save Settings'}
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              <TabsContent value="pending" className="mt-6">
                <Card className="bg-white dark:bg-gray-800 shadow-sm">
                  <CardHeader>
                    <CardTitle>Pending Copy Requests</CardTitle>
                    <CardDescription>
                      Users waiting for your approval to copy your trades
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {pendingRequests.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No pending requests</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {pendingRequests.map((request) => (
                          <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center space-x-4">
                              <Avatar>
                                <AvatarImage src={request.copier?.profile_photo_path} />
                                <AvatarFallback>{request.copier?.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{request.copier?.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  Requested on {formatDate(request.started_at)}
                                </p>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleApprove(request)}
                                disabled={isLoading[request.id]}
                                className="text-green-500 border-green-200 hover:bg-green-50 hover:text-green-600"
                              >
                                <CheckCircle className="mr-1 h-3.5 w-3.5" />
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleReject(request)}
                                disabled={isLoading[request.id]}
                                className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                              >
                                <XCircle className="mr-1 h-3.5 w-3.5" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="active" className="mt-6">
                <Card className="bg-white dark:bg-gray-800 shadow-sm">
                  <CardHeader>
                    <CardTitle>Active Copiers</CardTitle>
                    <CardDescription>
                      Users currently copying your trades
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {activeCopiers.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No active copiers</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {activeCopiers.map((copier) => (
                          <div key={copier.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center space-x-4">
                              <Avatar>
                                <AvatarImage src={copier.copier?.profile_photo_path} />
                                <AvatarFallback>{copier.copier?.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{copier.copier?.name}</p>
                                <div className="flex items-center mt-1">
                                  <Badge variant={copier.status === 'active' ? 'success' : 'secondary'} className="text-xs">
                                    {copier.status === 'active' ? 'Active' : 'Paused'}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground ml-2">
                                    Since {formatDate(copier.started_at)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleBlock(copier)}
                                disabled={isLoading[copier.id]}
                                className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                              >
                                <UserMinus className="mr-1 h-3.5 w-3.5" />
                                Block
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
