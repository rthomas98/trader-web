import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { PageProps } from '@/types';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { UserCheck, Users } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';

interface Follower {
  id: number;
  name: string;
  email: string;
  followers_count: number;
  following_count: number;
  pivot: {
    created_at: string;
  };
}

interface FollowersProps extends PageProps {
  breadcrumbs: {
    name: string;
    href: string;
  }[];
  followers: {
    data: Follower[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: {
      url: string | null;
      label: string;
      active: boolean;
    }[];
    prev_page_url: string | null;
    next_page_url: string | null;
  };
  auth: PageProps['auth'];
}

export default function Followers({ auth, breadcrumbs, followers }: FollowersProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <AppLayout
      user={auth.user}
      header={
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 py-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My Followers</h1>
            <Breadcrumbs breadcrumbs={breadcrumbs} />
          </div>
        </div>
      }
    >
      <Head title="My Followers" />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Followers</CardTitle>
                <CardDescription>People following your trading activity</CardDescription>
              </div>
              <Badge variant="outline" className="ml-auto">
                <UserCheck className="mr-1 h-3.5 w-3.5" />
                {followers.total} Followers
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {followers.data.length > 0 ? (
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
                    {followers.data.map((follower) => (
                      <TableRow key={follower.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10 border">
                              <AvatarImage src={`https://api.dicebear.com/9.x/initials/svg?seed=${follower.name}`} />
                              <AvatarFallback>{follower.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="ml-4">
                              <div className="font-medium">{follower.name}</div>
                              <div className="text-sm text-muted-foreground">{follower.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{follower.followers_count}</TableCell>
                        <TableCell>{follower.following_count}</TableCell>
                        <TableCell>{formatDate(follower.pivot.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" asChild>
                            <a href={route('social.trader', follower.id)}>View Profile</a>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {followers.last_page > 1 && (
                  <div className="mt-6">
                    <Pagination>                        
                      {/* Previous Button */}
                      <Pagination.Previous 
                        href={followers.prev_page_url ?? '#'} 
                        disabled={!followers.prev_page_url}
                      />
                      
                      {/* Page Number Links */}
                      {followers.links.slice(1, -1).map((link, i) => (
                        <Pagination.Item 
                          key={i} 
                          href={link.url ?? '#'}
                          active={link.active}
                        >
                          {link.label}
                        </Pagination.Item>
                      ))}
                      
                      {/* Next Button */}
                      <Pagination.Next 
                        href={followers.next_page_url ?? '#'} 
                        disabled={!followers.next_page_url}
                      />
                    </Pagination>                    
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No Followers Yet</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  Share your trading strategies and performance to attract followers.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
