import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { User } from '@/types';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Play, Pause, StopCircle, TrendingUp, Users, 
  BarChart4, Clock, Settings, AlertTriangle, ArrowUpRight, RefreshCw, Shield
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

interface CopyTradingRelationship {
  id: number;
  trader_user_id: number;
  copier_user_id: number;
  status: 'active' | 'paused' | 'stopped';
  risk_allocation_percentage: number;
  max_drawdown_percentage: number | null;
  copy_fixed_size: boolean;
  fixed_lot_size: number | null;
  copy_stop_loss: boolean;
  copy_take_profit: boolean;
  started_at: string;
  stopped_at: string | null;
  created_at: string;
  updated_at: string;
  trader?: {
    id: number;
    name: string;
    email: string;
  };
  copier?: {
    id: number;
    name: string;
    email: string;
  };
}

interface CopyTradingStats {
  active: number;
  paused: number;
  stopped: number;
  total: number;
  followers: number;
  totalCopying: number;
  totalProfit: number;
  totalCopiers: number;
  winRate: number;
}

interface CopyTradingPageProps {
  breadcrumbs: {
    name: string;
    href: string;
  }[];
  copyingRelationships: CopyTradingRelationship[];
  copierRelationships: CopyTradingRelationship[];
  stats: CopyTradingStats;
  auth: {
    user: User;
  };
}

export default function CopyTradingIndex({ auth, breadcrumbs, copyingRelationships, copierRelationships, stats }: CopyTradingPageProps) {
  const [isLoading, setIsLoading] = useState<Record<number, boolean>>({});
  const [relationships, setRelationships] = useState<CopyTradingRelationship[]>(copyingRelationships);
  const [followers] = useState<CopyTradingRelationship[]>(copierRelationships);

  // Function to handle pausing/resuming copy trading
  const handleTogglePause = async (relationship: CopyTradingRelationship) => {
    const relationshipId = relationship.id;
    setIsLoading(prev => ({ ...prev, [relationshipId]: true }));
    
    const newStatus = relationship.status === 'active' ? 'paused' : 'active';
    
    try {
      await axios.put(route('copy-trading.update', relationshipId), 
        { status: newStatus },
        {
          headers: {
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          }
        }
      );
      
      // Update the local state
      setRelationships(prev => 
        prev.map(r => 
          r.id === relationshipId 
            ? { ...r, status: newStatus } 
            : r
        )
      );
      
      toast.success(`Successfully ${newStatus === 'active' ? 'resumed' : 'paused'} copying ${relationship.trader?.name}`);
    } catch (error) {
      console.error('Error toggling copy trading status:', error);
      toast.error('Failed to update copy trading status. Please try again.');
    } finally {
      setIsLoading(prev => ({ ...prev, [relationshipId]: false }));
    }
  };
  
  // Function to handle stopping copy trading
  const handleStop = async (relationship: CopyTradingRelationship) => {
    const relationshipId = relationship.id;
    
    if (!confirm(`Are you sure you want to stop copying ${relationship.trader?.name}? This action cannot be undone.`)) {
      return;
    }
    
    setIsLoading(prev => ({ ...prev, [relationshipId]: true }));
    
    try {
      // Use POST with the updated route path
      await axios.post(route('copy-trading.destroy', relationshipId), {}, {
        headers: {
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      });
      
      // Update the local state
      setRelationships(prev => 
        prev.map(r => 
          r.id === relationshipId 
            ? { ...r, status: 'stopped', stopped_at: new Date().toISOString() } 
            : r
        )
      );
      
      toast.success(`Successfully stopped copying ${relationship.trader?.name}`);
    } catch (error) {
      console.error('Error stopping copy trading:', error);
      toast.error('Failed to stop copy trading. Please try again.');
    } finally {
      setIsLoading(prev => ({ ...prev, [relationshipId]: false }));
    }
  };
  
  // Function to handle reactivating copy trading
  const handleReactivate = async (relationship: CopyTradingRelationship) => {
    const relationshipId = relationship.id;
    
    if (!confirm(`Are you sure you want to reactivate copying ${relationship.trader?.name}?`)) {
      return;
    }
    
    setIsLoading(prev => ({ ...prev, [relationshipId]: true }));
    
    try {
      // Use direct POST to the reactivate endpoint
      await axios.post(route('copy-trading.reactivate', relationshipId), {}, {
        headers: {
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          'Accept': 'application/json',
        }
      });
      
      // Update the local state
      setRelationships(prev => 
        prev.map(r => 
          r.id === relationshipId 
            ? { ...r, status: 'active', stopped_at: null, started_at: new Date().toISOString() } 
            : r
        )
      );
      
      toast.success(`Successfully reactivated copying ${relationship.trader?.name}`);
    } catch (error) {
      console.error('Error reactivating copy trading:', error);
      toast.error('Failed to reactivate copy trading. Please try again.');
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
  
  // Helper function to get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'paused':
        return <Badge variant="outline" className="text-amber-500 border-amber-500">Paused</Badge>;
      case 'stopped':
        return <Badge variant="outline" className="text-red-500 border-red-500">Stopped</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <AppLayout
      user={auth.user}
      header={
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 py-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Copy Trading Management</h1>
            <Breadcrumbs breadcrumbs={breadcrumbs} />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild className="text-[#8D5EB7]">
              <Link href={route('copy-trading.settings')}>
                <Shield className="mr-1 h-4 w-4" />
                Privacy Settings
              </Link>
            </Button>
            <Button className="bg-[#8D5EB7] hover:bg-[#8D5EB7]/90" size="sm" asChild>
              <Link href={route('copy-trading.topTraders')}>
                <Users className="mr-1 h-4 w-4" />
                Discover Traders
              </Link>
            </Button>
          </div>
        </div>
      }
    >
      <Head title="Copy Trading Management" />

      <div className="flex h-full flex-1 flex-col gap-4 p-4">
        {/* Stats Cards */}
        <div className="py-12">
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="grid gap-6 md:grid-cols-4 mb-6">
              <Card className="bg-gradient-to-br from-purple-600/10 via-purple-500/10 to-indigo-600/10 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Copying
                  </CardTitle>
                  <Users className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalCopying}</div>
                  <p className="text-xs text-muted-foreground">
                    Traders you're copying
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-green-600/10 via-green-500/10 to-emerald-600/10 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Profit
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-500">${stats.totalProfit}</div>
                  <p className="text-xs text-muted-foreground">
                    From copied trades
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-blue-600/10 via-blue-500/10 to-cyan-600/10 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Copiers
                  </CardTitle>
                  <Users className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalCopiers}</div>
                  <p className="text-xs text-muted-foreground">
                    Traders copying you
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-yellow-600/10 via-yellow-500/10 to-orange-600/10 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Win Rate
                  </CardTitle>
                  <BarChart4 className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-500">{stats.winRate}%</div>
                  <p className="text-xs text-muted-foreground">
                    Last 30 days
                  </p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="copying" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="copying">Traders I'm Copying</TabsTrigger>
                <TabsTrigger value="followers">Users Copying Me</TabsTrigger>
              </TabsList>
              {/* Traders I'm Copying Tab */}
              <TabsContent value="copying" className="space-y-4 mt-4">
                {relationships.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                      <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium">You're not copying any traders yet</h3>
                      <p className="text-sm text-muted-foreground mt-2 max-w-md">
                        Start copying successful traders to automatically replicate their trades in your account.
                      </p>
                      <Button asChild className="mt-4 bg-[#8D5EB7] hover:bg-[#8D5EB7]/90">
                        <Link href={route('social.popular')}>
                          Find Traders to Copy
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {relationships.map((relationship) => (
                      <Card key={relationship.id} className={relationship.status === 'stopped' ? 'opacity-75' : ''}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center space-x-2">
                              <Avatar>
                                <AvatarImage src={`https://api.dicebear.com/9.x/initials/svg?seed=${relationship.trader?.name}`} />
                                <AvatarFallback>{relationship.trader?.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <CardTitle className="text-base">{relationship.trader?.name}</CardTitle>
                                <CardDescription className="text-xs">{relationship.trader?.email}</CardDescription>
                              </div>
                            </div>
                            <div>
                              {getStatusBadge(relationship.status)}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center space-x-1">
                              <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>Risk: {relationship.risk_allocation_percentage}%</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>Max DD: {relationship.max_drawdown_percentage || 'N/A'}%</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>{relationship.copy_fixed_size ? `Fixed: ${relationship.fixed_lot_size} lots` : 'Proportional'}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>Since: {formatDate(relationship.started_at)}</span>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="flex justify-between pt-2">
                          <div className="flex space-x-2">
                            {relationship.status === 'active' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleTogglePause(relationship)}
                                disabled={isLoading[relationship.id]}
                              >
                                <Pause className="mr-1 h-3.5 w-3.5" />
                                Pause
                              </Button>
                            )}
                            {relationship.status === 'paused' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleTogglePause(relationship)}
                                disabled={isLoading[relationship.id]}
                              >
                                <Play className="mr-1 h-3.5 w-3.5" />
                                Resume
                              </Button>
                            )}
                            {relationship.status === 'stopped' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleReactivate(relationship)}
                                disabled={isLoading[relationship.id]}
                                className="text-green-500 border-green-200 hover:bg-green-50 hover:text-green-600"
                              >
                                <RefreshCw className="mr-1 h-3.5 w-3.5" />
                                Reactivate
                              </Button>
                            )}
                            {relationship.status !== 'stopped' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleStop(relationship)}
                                disabled={isLoading[relationship.id]}
                                className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                              >
                                <StopCircle className="mr-1 h-3.5 w-3.5" />
                                Stop
                              </Button>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="text-[#8D5EB7]"
                          >
                            <Link href={route('copy-trading.performance', relationship.id)}>
                              Performance
                              <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              {/* Users Copying Me Tab */}
              <TabsContent value="followers" className="space-y-4 mt-4">
                {followers.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                      <Users className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium">No one is copying your trades yet</h3>
                      <p className="text-sm text-muted-foreground mt-2 max-w-md">
                        As you build a successful trading history, other users may choose to copy your trades.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {followers.map((relationship) => (
                      <Card key={relationship.id} className={relationship.status === 'stopped' ? 'opacity-75' : ''}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center space-x-2">
                              <Avatar>
                                <AvatarImage src={`https://api.dicebear.com/9.x/initials/svg?seed=${relationship.copier?.name}`} />
                                <AvatarFallback>{relationship.copier?.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <CardTitle className="text-base">{relationship.copier?.name}</CardTitle>
                                <CardDescription className="text-xs">{relationship.copier?.email}</CardDescription>
                              </div>
                            </div>
                            <div>
                              {getStatusBadge(relationship.status)}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center space-x-1">
                              <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>Risk: {relationship.risk_allocation_percentage}%</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>{relationship.copy_fixed_size ? `Fixed: ${relationship.fixed_lot_size} lots` : 'Proportional'}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>Since: {formatDate(relationship.started_at)}</span>
                            </div>
                            {relationship.status === 'stopped' && relationship.stopped_at && (
                              <div className="flex items-center space-x-1">
                                <StopCircle className="h-3.5 w-3.5 text-muted-foreground" />
                                <span>Until: {formatDate(relationship.stopped_at)}</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
