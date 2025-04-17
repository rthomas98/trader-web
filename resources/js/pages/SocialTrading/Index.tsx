import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { PageProps } from '@/types';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, UserPlus, UserCheck, UserMinus } from 'lucide-react';
import { useState } from 'react';
import axios from 'axios';

interface Trader {
  id: number;
  name: string;
  email: string;
  followers_count?: number;
  is_following: boolean;
  is_current_user: boolean;
}

interface SocialTradingProps extends PageProps {
  auth: PageProps['auth'];
  breadcrumbs: {
    name: string;
    href: string;
  }[];
  stats: {
    followers: number;
    following: number;
  };
  recentFollowers: Trader[];
  popularTraders: Trader[];
}

export default function Index({ auth, breadcrumbs, stats, recentFollowers, popularTraders }: SocialTradingProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const currentUserId = auth.user.id;

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      await axios.get(route('social.search'), {
        params: { query: searchQuery }
      });
      // TODO: Display search results
    } catch (error) {
      console.error('Error searching traders:', error);
    }
  };

  const handleFollow = async (traderId: number) => {
    if (traderId === currentUserId) return;
    try {
      await axios.post(route('social.follow', traderId));
      // Refresh the page to update the following status
      // Use Inertia visit for smoother update without full reload if possible
      // Inertia.visit(route('social.index'), { preserveScroll: true });
      window.location.reload();
    } catch (error) {
      console.error('Error following trader:', error);
      // Optionally: Show user feedback e.g., toast notification
    }
  };

  const handleUnfollow = async (traderId: number) => {
    if (traderId === currentUserId) return;
    try {
      await axios.delete(route('social.unfollow', traderId));
      // Use Inertia visit for smoother update
      // Inertia.visit(route('social.index'), { preserveScroll: true });
      window.location.reload(); // Keep reload for simplicity for now
    } catch (error) {
      console.error('Error unfollowing trader:', error);
      // Optionally: Show user feedback
    }
  };

  return (
    <AppLayout
      user={auth.user}
      header={
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 py-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Social Trading</h1>
            <Breadcrumbs breadcrumbs={breadcrumbs} />
          </div>
        </div>
      }
    >
      <Head title="Social Trading" />

      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Followers</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.followers}</div>
              <p className="text-xs text-muted-foreground">
                People following your trading activity
              </p>
              <Button variant="outline" size="sm" className="mt-4" asChild>
                <a href={route('social.followers')}>View All</a>
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Following</CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.following}</div>
              <p className="text-xs text-muted-foreground">
                Traders you are following
              </p>
              <Button variant="outline" size="sm" className="mt-4" asChild>
                <a href={route('social.following')}>View All</a>
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Discover Traders</CardTitle>
              <Search className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex w-full max-w-sm items-center space-x-2">
                <Input 
                  type="text" 
                  placeholder="Search traders..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button 
                  type="button" 
                  size="icon" 
                  onClick={handleSearch}
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Popular Traders */}
        <Card>
          <CardHeader>
            <CardTitle>Popular Traders</CardTitle>
            <CardDescription>Traders with the most followers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {popularTraders.map((trader) => (
                <Card key={trader.id} className="overflow-hidden">
                  <CardHeader className="p-4">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarImage src={`https://api.dicebear.com/9.x/initials/svg?seed=${trader.name}`} />
                        <AvatarFallback>{trader.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-sm font-medium">{trader.name}</CardTitle>
                        <CardDescription className="text-xs">{trader.followers_count || 0} followers</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 flex justify-between">
                    <Button variant="outline" size="sm" asChild>
                      <a href={route('social.trader', trader.id)}>View Profile</a>
                    </Button>
                    {trader.is_following ? (
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => handleUnfollow(trader.id)}
                      >
                        <UserMinus className="h-4 w-4 mr-2" />
                        Unfollow
                      </Button>
                    ) : (
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => handleFollow(trader.id)}
                      >
                        Follow
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Followers */}
        {recentFollowers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Followers</CardTitle>
              <CardDescription>People who recently started following you</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {recentFollowers.map((follower) => (
                  <Card key={follower.id} className="overflow-hidden">
                    <CardHeader className="p-4">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarImage src={`https://api.dicebear.com/9.x/initials/svg?seed=${follower.name}`} />
                          <AvatarFallback>{follower.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-sm font-medium">{follower.name}</CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <Button variant="outline" size="sm" asChild className="w-full">
                        <a href={route('social.trader', follower.id)}>View Profile</a>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
