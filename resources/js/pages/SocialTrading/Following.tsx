import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { PageProps } from '@/types';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Users } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import axios from 'axios';
import { useState } from 'react';

interface Trader {
  id: number;
  name: string;
  email: string;
  followers_count: number;
  following_count: number;
  pivot: {
    created_at: string;
  };
}

interface FollowingProps extends PageProps {
  breadcrumbs: {
    name: string;
    href: string;
  }[];
  following: {
    data: Trader[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    prev_page_url: string | null;
    next_page_url: string | null;
    links: {
      url: string | null;
      label: string;
      active: boolean;
    }[];
  };
}

export default function Following({ auth, breadcrumbs, following }: FollowingProps) {
  const [unfollowingIds, setUnfollowingIds] = useState<number[]>([]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleUnfollow = async (traderId: number) => {
    setUnfollowingIds(prev => [...prev, traderId]);
    
    try {
      await axios.delete(route('social.unfollow', traderId));
      // Refresh the page to update the following status
      window.location.reload();
    } catch (error) {
      console.error('Error unfollowing trader:', error);
      setUnfollowingIds(prev => prev.filter(id => id !== traderId));
    }
  };

  return (
    <AppLayout
      user={auth.user}
      header={
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 py-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Following</h1>
            <Breadcrumbs breadcrumbs={breadcrumbs} />
          </div>
        </div>
      }
    >
      <Head title="Following" />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Traders You Follow</CardTitle>
                <CardDescription>Traders whose strategies you're following</CardDescription>
              </div>
              <Badge variant="outline" className="ml-auto">
                <UserPlus className="mr-1 h-3.5 w-3.5" />
                Following {following.total} Traders
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {following.data.length > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Trader</TableHead>
                      <TableHead>Followers</TableHead>
                      <TableHead>Following</TableHead>
                      <TableHead>Following Since</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {following.data.map((trader) => (
                      <TableRow key={trader.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10 border">
                              <AvatarImage src={`https://api.dicebear.com/9.x/initials/svg?seed=${trader.name}`} />
                              <AvatarFallback>{trader.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="ml-4">
                              <div className="font-medium">{trader.name}</div>
                              <div className="text-sm text-muted-foreground">{trader.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{trader.followers_count}</TableCell>
                        <TableCell>{trader.following_count}</TableCell>
                        <TableCell>{formatDate(trader.pivot.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button variant="outline" size="sm" asChild>
                              <a href={route('social.trader', trader.id)}>View Profile</a>
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleUnfollow(trader.id)}
                              disabled={unfollowingIds.includes(trader.id)}
                            >
                              {unfollowingIds.includes(trader.id) ? 'Unfollowing...' : 'Unfollow'}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {following.last_page > 1 && (
                  <div className="mt-6 flex justify-center">
                    <Pagination>
                      {/* Previous Button */}
                      <Pagination.Previous 
                        href={following.prev_page_url ?? '#'} 
                        disabled={!following.prev_page_url}
                      />
                      
                      {/* Page Number Links */}
                      {following.links.slice(1, -1).map((link, i) => (
                        <Pagination.Item 
                          key={i} 
                          href={link.url ?? '#'} 
                          active={link.active}
                          disabled={!link.url || link.active}
                        >
                          {/* Dangerously set inner HTML for labels like "&laquo; Previous" */}
                          <span dangerouslySetInnerHTML={{ __html: link.label }} /> 
                        </Pagination.Item>
                      ))}
                      
                      {/* Next Button */}
                      <Pagination.Next 
                        href={following.next_page_url ?? '#'} 
                        disabled={!following.next_page_url}
                      />
                    </Pagination>                    
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Not Following Anyone Yet</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  Discover and follow successful traders to learn from their strategies.
                </p>
                <Button asChild>
                  <a href={route('social.index')}>Discover Traders</a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
