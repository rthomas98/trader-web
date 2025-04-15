import React from 'react';
import { Head, router } from '@inertiajs/react';
import { ConnectedAccount } from '@/types';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, RefreshCw, ExternalLink, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils';

interface ConnectedAccountsIndexProps {
  connectedAccounts: ConnectedAccount[];
}

export default function ConnectedAccountsIndex({ connectedAccounts }: ConnectedAccountsIndexProps) {
  const getStatusIcon = (status: string, isVerified: boolean) => {
    if (status === 'PENDING' || !isVerified) {
      return <Clock className="h-5 w-5 text-yellow-500" />;
    } else if (status === 'ACTIVE' && isVerified) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else {
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusBadge = (status: string, isVerified: boolean) => {
    if (status === 'PENDING' || !isVerified) {
      return <Badge variant="warning">Pending Verification</Badge>;
    } else if (status === 'ACTIVE' && isVerified) {
      return <Badge variant="success">Active</Badge>;
    } else {
      return <Badge variant="destructive">Inactive</Badge>;
    }
  };

  const handleVerify = (id: string) => {
    router.visit(route('connected-accounts.verify', id));
  };

  const handleRefresh = (id: string) => {
    router.post(route('connected-accounts.refresh', id));
  };

  const handleRemove = (id: string) => {
    if (confirm('Are you sure you want to remove this account?')) {
      router.delete(route('connected-accounts.destroy', id));
    }
  };

  return (
    <AppLayout
      renderHeader={() => (
        <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
          Connected Accounts
        </h2>
      )}
    >
      <Head title="Connected Accounts" />

      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="mb-6 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Your Connected Accounts</h1>
            <Button onClick={() => router.visit(route('connected-accounts.create'))}>
              <Plus className="mr-2 h-4 w-4" />
              Connect New Account
            </Button>
          </div>

          {connectedAccounts.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {connectedAccounts.map((account) => (
                <Card key={account.id} className="bg-white dark:bg-gray-800">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <div className="flex items-center">
                        <div className="mr-2">
                          {getStatusIcon(account.status, account.is_verified)}
                        </div>
                        <CardTitle>{account.institution_name}</CardTitle>
                      </div>
                      {account.is_default && (
                        <Badge className="bg-[#8D5EB7] text-white">Default</Badge>
                      )}
                    </div>
                    <CardDescription className="flex items-center">
                      {account.account_name} •••• {account.mask}
                      <span className="ml-2">{getStatusBadge(account.status, account.is_verified)}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-muted-foreground">Available Balance</p>
                        <p className="text-xl font-bold">{formatCurrency(account.available_balance)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Current Balance</p>
                        <p className="text-lg">{formatCurrency(account.current_balance)}</p>
                      </div>
                      <div className="pt-2 text-sm text-muted-foreground">
                        <p>Type: {account.account_type} {account.account_subtype && `(${account.account_subtype})`}</p>
                        <p>Connected: {formatDate(account.created_at, { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-wrap gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => router.visit(route('connected-accounts.show', account.id))}
                    >
                      <ExternalLink className="mr-1 h-3 w-3" /> Details
                    </Button>
                    {account.status === 'ACTIVE' && account.is_verified ? (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleRefresh(account.id)}
                      >
                        <RefreshCw className="mr-1 h-3 w-3" /> Refresh
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleVerify(account.id)}
                      >
                        <CheckCircle className="mr-1 h-3 w-3" /> Verify
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-white dark:bg-gray-800">
              <CardContent className="pt-6 pb-6 text-center">
                <h3 className="text-lg font-medium mb-2">No Connected Accounts</h3>
                <p className="text-muted-foreground mb-4">
                  Connect your bank accounts to deposit and withdraw funds.
                </p>
                <Button onClick={() => router.visit(route('connected-accounts.create'))}>
                  <Plus className="mr-2 h-4 w-4" />
                  Connect New Account
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
