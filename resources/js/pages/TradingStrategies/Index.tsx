import React, { useState, useEffect, useMemo } from 'react';
import { Head, useForm, router, Link } from '@inertiajs/react';
import { PageProps } from '@/types';
import { Breadcrumbs } from '@/components/breadcrumbs';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { BrainCircuit, Plus, Pencil, Trash2, Search, X, ArrowUpDown } from 'lucide-react';
import debounce from 'lodash-es/debounce';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Strategy {
  id: number;
  name: string;
  description: string | null;
  type: string | null;
  risk_level: string | null;
  target_assets: string | null;
  timeframe: string | null;
  created_at: string;
  updated_at: string;
}

interface PaginationLink {
  url: string | null;
  label: string;
  active: boolean;
}

interface PaginatedStrategies {
  current_page: number;
  data: Strategy[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: PaginationLink[];
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}

interface TradingStrategiesProps extends PageProps {
  breadcrumbs: {
    name: string;
    href: string;
  }[];
  strategies: PaginatedStrategies;
  filters: {
    search?: string;
    type?: string;
    risk_level?: string;
    timeframe?: string;
  };
  sort: {
    by: string;
    direction: 'asc' | 'desc';
  };
}

export default function TradingStrategiesIndex({ breadcrumbs, strategies, filters, sort }: TradingStrategiesProps) {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState<Strategy | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [strategyToDelete, setStrategyToDelete] = useState<Strategy | null>(null);

  // Form for adding a new strategy
  const { data: addData, setData: setAddData, post: addStrategy, processing: addProcessing, errors: addErrors, reset: resetAddForm } = useForm({
    name: '',
    description: '',
    type: '',
    risk_level: '',
    target_assets: '',
    timeframe: '',
  });

  // Form for editing a strategy
  const { data: editData, setData: setEditData, put: updateStrategy, processing: editProcessing, errors: editErrors, reset: resetEditForm } = useForm({
    name: '',
    description: '',
    type: '',
    risk_level: '',
    target_assets: '',
    timeframe: '',
  });

  // Form for deleting a strategy
  const { delete: deleteStrategy, processing: deleteProcessing } = useForm();

  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [filterType, setFilterType] = useState(filters.type || '');
  const [filterRisk, setFilterRisk] = useState(filters.risk_level || '');
  const [filterTimeframe, setFilterTimeframe] = useState(filters.timeframe || '');
  const [sortBy, setSortBy] = useState(sort.by);
  const [sortDirection, setSortDirection] = useState(sort.direction);

  // Memoize the debounced function
  const debouncedFetch = useMemo(
    () =>
      debounce((params: Record<string, string | number | undefined>) => {
        router.get(route('my-strategies.index'), params, {
          preserveState: true,
          preserveScroll: true,
          replace: true,
        });
      }, 300),
    [] // No dependencies needed as router is stable
  );

  useEffect(() => {
    const params: Record<string, string | number> = {};
    // Only add parameters if they have a value
    if (searchTerm) params.search = searchTerm;
    if (filterType) params.type = filterType;
    if (filterRisk) params.risk_level = filterRisk;
    if (filterTimeframe) params.timeframe = filterTimeframe;
    // Always include sort parameters
    params.sort_by = sortBy;
    params.sort_direction = sortDirection;

    // Call the memoized debounced function
    debouncedFetch(params);

    // Cleanup function to cancel debounce on effect re-run or unmount
    return () => {
      debouncedFetch.cancel();
    };
  }, [searchTerm, filterType, filterRisk, filterTimeframe, sortBy, sortDirection, debouncedFetch]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addStrategy(route('my-strategies.store'), {
      onSuccess: () => {
        setIsAddDialogOpen(false);
        resetAddForm();
        toast({
          title: 'Success',
          description: 'Strategy created successfully.',
        });
      },
      onError: () => {
        toast({
          title: 'Error',
          description: 'Failed to create strategy.',
          variant: 'destructive',
        });
      },
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStrategy) return;

    updateStrategy(route('my-strategies.update', { strategy: editingStrategy.id }), {
      onSuccess: () => {
        setEditingStrategy(null);
        resetEditForm();
        toast({
          title: 'Success',
          description: 'Strategy updated successfully.',
        });
      },
      onError: () => {
        toast({
          title: 'Error',
          description: 'Failed to update strategy.',
          variant: 'destructive',
        });
      },
    });
  };

  const handleDelete = () => {
    if (!strategyToDelete) return;

    deleteStrategy(route('my-strategies.destroy', { strategy: strategyToDelete.id }), {
      onSuccess: () => {
        setStrategyToDelete(null);
        setIsDeleteDialogOpen(false);
        toast({
          title: 'Success',
          description: 'Strategy deleted successfully.',
        });
      },
      onError: () => {
        toast({
          title: 'Error',
          description: 'Failed to delete strategy.',
          variant: 'destructive',
        });
      },
    });
  };

  const openEditDialog = (strategy: Strategy) => {
    setEditingStrategy(strategy);
    setEditData({
      name: strategy.name,
      description: strategy.description || '',
      type: strategy.type || '',
      risk_level: strategy.risk_level || '',
      target_assets: strategy.target_assets || '',
      timeframe: strategy.timeframe || '',
    });
  };

  const openDeleteDialog = (strategy: Strategy) => {
    setStrategyToDelete(strategy);
    setIsDeleteDialogOpen(true);
  };

  return (
    <AppLayout>
      <Head title="My Trading Strategies" />

      <div className="container py-6">
        <Breadcrumbs breadcrumbs={breadcrumbs} />

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">My Trading Strategies</h1>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Strategy
          </Button>
        </div>

        {/* Filter and Sort Controls */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {/* Search Input */}
          <div className="relative xl:col-span-2">
            <Input
              type="text"
              placeholder="Search by name/description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10"
            />
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 h-6 w-6 -translate-y-1/2"
                onClick={() => setSearchTerm('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Type Filter */}
          <Select value={filterType} onValueChange={(value) => setFilterType(value === 'all' ? '' : value)}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Scalping">Scalping</SelectItem>
              <SelectItem value="Day Trading">Day Trading</SelectItem>
              <SelectItem value="Swing Trading">Swing Trading</SelectItem>
              <SelectItem value="Position Trading">Position Trading</SelectItem>
              <SelectItem value="Algorithmic">Algorithmic</SelectItem>
            </SelectContent>
          </Select>

          {/* Risk Level Filter */}
          <Select value={filterRisk} onValueChange={(value) => setFilterRisk(value === 'all' ? '' : value)}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by Risk" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Risk Levels</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="High">High</SelectItem>
            </SelectContent>
          </Select>

          {/* Timeframe Filter */}
          <Select value={filterTimeframe} onValueChange={(value) => setFilterTimeframe(value === 'all' ? '' : value)}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by Timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Timeframes</SelectItem>
              <SelectItem value="M1">M1</SelectItem>
              <SelectItem value="M5">M5</SelectItem>
              <SelectItem value="M15">M15</SelectItem>
              <SelectItem value="H1">H1</SelectItem>
              <SelectItem value="H4">H4</SelectItem>
              <SelectItem value="D1">D1</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sort Control - Placed below filters for simplicity */}
        <div className="mb-6 flex items-center justify-end gap-2">
          <Label className="text-sm">Sort by:</Label>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px] h-9 text-sm">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">Date Created</SelectItem>
              <SelectItem value="updated_at">Date Updated</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="type">Type</SelectItem>
              <SelectItem value="risk_level">Risk Level</SelectItem>
              <SelectItem value="timeframe">Timeframe</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}>
            <ArrowUpDown className="h-4 w-4" />
            <span className="sr-only">Toggle Sort Direction ({sortDirection})</span>
          </Button>
        </div>

        {strategies.data.length === 0 ? (
          <Card className="bg-card">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <BrainCircuit className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No Strategies Yet</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                Create your first trading strategy to share with others.
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Strategy
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {strategies.data.map((strategy) => (
              <Card key={strategy.id} className="transition-shadow duration-200 hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold">{strategy.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  {strategy.description ? (
                    <p className="text-sm text-muted-foreground">{strategy.description}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No description provided.</p>
                  )}
                </CardContent>
                <CardContent className="pt-2 text-sm text-muted-foreground">
                  {strategy.type && <p><strong>Type:</strong> {strategy.type}</p>}
                  {strategy.risk_level && <p><strong>Risk:</strong> {strategy.risk_level}</p>}
                  {strategy.target_assets && <p><strong>Assets:</strong> {strategy.target_assets}</p>}
                  {strategy.timeframe && <p><strong>Timeframe:</strong> {strategy.timeframe}</p>}
                </CardContent>
                <CardFooter className="flex justify-end space-x-2 pt-0">
                  <Button variant="outline" size="sm" onClick={() => openEditDialog(strategy)}>
                    <Pencil className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => openDeleteDialog(strategy)}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
        <Pagination links={strategies.links} />
      </div>

      {/* Add Strategy Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Strategy</DialogTitle>
            <DialogDescription>
              Create a new trading strategy to share with others.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Strategy Name</Label>
                <Input
                  id="name"
                  value={addData.name}
                  onChange={(e) => setAddData('name', e.target.value)}
                  placeholder="e.g., EUR/USD Momentum Scalper"
                />
                {addErrors.name && <p className="text-sm text-destructive">{addErrors.name}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={addData.description}
                  onChange={(e) => setAddData('description', e.target.value)}
                  placeholder="Describe your trading strategy..."
                  rows={4}
                />
                {addErrors.description && <p className="text-sm text-destructive">{addErrors.description}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">Type</Label>
                <Input
                  id="type"
                  value={addData.type}
                  onChange={(e) => setAddData('type', e.target.value)}
                  placeholder="e.g., Trend Following"
                />
                {addErrors.type && <p className="text-sm text-destructive">{addErrors.type}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="risk_level">Risk Level</Label>
                <Input
                  id="risk_level"
                  value={addData.risk_level}
                  onChange={(e) => setAddData('risk_level', e.target.value)}
                  placeholder="e.g., High"
                />
                {addErrors.risk_level && <p className="text-sm text-destructive">{addErrors.risk_level}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="target_assets">Target Assets</Label>
                <Input
                  id="target_assets"
                  value={addData.target_assets}
                  onChange={(e) => setAddData('target_assets', e.target.value)}
                  placeholder="e.g., EUR/USD, GBP/USD"
                />
                {addErrors.target_assets && <p className="text-sm text-destructive">{addErrors.target_assets}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="timeframe">Timeframe</Label>
                <Input
                  id="timeframe"
                  value={addData.timeframe}
                  onChange={(e) => setAddData('timeframe', e.target.value)}
                  placeholder="e.g., 1H, 4H"
                />
                {addErrors.timeframe && <p className="text-sm text-destructive">{addErrors.timeframe}</p>}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setIsAddDialogOpen(false);
                resetAddForm();
              }}>
                Cancel
              </Button>
              <Button type="submit" disabled={addProcessing}>
                {addProcessing ? 'Creating...' : 'Create Strategy'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Strategy Dialog */}
      <Dialog open={!!editingStrategy} onOpenChange={(open) => !open && setEditingStrategy(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Strategy</DialogTitle>
            <DialogDescription>
              Update your trading strategy details.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Strategy Name</Label>
                <Input
                  id="edit-name"
                  value={editData.name}
                  onChange={(e) => setEditData('name', e.target.value)}
                />
                {editErrors.name && <p className="text-sm text-destructive">{editErrors.name}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editData.description}
                  onChange={(e) => setEditData('description', e.target.value)}
                  rows={4}
                />
                {editErrors.description && <p className="text-sm text-destructive">{editErrors.description}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-type">Type</Label>
                <Input
                  id="edit-type"
                  value={editData.type}
                  onChange={(e) => setEditData('type', e.target.value)}
                  placeholder="e.g., Trend Following"
                />
                {editErrors.type && <p className="text-sm text-destructive">{editErrors.type}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-risk_level">Risk Level</Label>
                <Input
                  id="edit-risk_level"
                  value={editData.risk_level}
                  onChange={(e) => setEditData('risk_level', e.target.value)}
                  placeholder="e.g., High"
                />
                {editErrors.risk_level && <p className="text-sm text-destructive">{editErrors.risk_level}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-target_assets">Target Assets</Label>
                <Input
                  id="edit-target_assets"
                  value={editData.target_assets}
                  onChange={(e) => setEditData('target_assets', e.target.value)}
                  placeholder="e.g., EUR/USD, GBP/USD"
                />
                {editErrors.target_assets && <p className="text-sm text-destructive">{editErrors.target_assets}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-timeframe">Timeframe</Label>
                <Input
                  id="edit-timeframe"
                  value={editData.timeframe}
                  onChange={(e) => setEditData('timeframe', e.target.value)}
                  placeholder="e.g., 1H, 4H"
                />
                {editErrors.timeframe && <p className="text-sm text-destructive">{editErrors.timeframe}</p>}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setEditingStrategy(null);
                resetEditForm();
              }}>
                Cancel
              </Button>
              <Button type="submit" disabled={editProcessing}>
                {editProcessing ? 'Updating...' : 'Update Strategy'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Strategy</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the strategy "{strategyToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-between sm:justify-end gap-2 mt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setStrategyToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              variant="destructive" 
              onClick={handleDelete} 
              disabled={deleteProcessing}
            >
              {deleteProcessing ? 'Deleting...' : 'Delete Strategy'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

// Simple Pagination Component using Inertia Link
const Pagination = ({ links }: { links: PaginationLink[] }) => {
  if (!links || links.length <= 3) return null; // Hide if only prev/next/current or less

  return (
    <div className="mt-6 flex flex-wrap justify-center items-center gap-1">
      {links.map((link, index) => (
        <React.Fragment key={index}>
          {link.url === null || link.active ? (
            // Disabled or Current page link
            <span
              className={`px-3 py-1 text-sm rounded border ${link.active
                ? 'border-primary bg-primary text-primary-foreground font-semibold z-10 cursor-default' // Active page
                : 'border-input bg-background text-muted-foreground cursor-not-allowed' // Disabled
              }`}
              dangerouslySetInnerHTML={{ __html: link.label }} // Handles << & >>, page numbers
            />
          ) : (
            // Active, clickable link
            <Link
              href={link.url}
              className="px-3 py-1 text-sm rounded border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
              dangerouslySetInnerHTML={{ __html: link.label }} // Handles << & >>, page numbers
              preserveScroll
              preserveState
              replace
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
