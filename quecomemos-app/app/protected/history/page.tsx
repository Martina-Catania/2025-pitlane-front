'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Activity, ChefHat, Calendar, Search, Filter, User } from 'lucide-react';
import { useUser } from '@/lib/contexts/UserContext';
import { API_BASE_URL } from '@/lib/config/api';

interface Consumption {
  ConsumptionID: number;
  name: string;
  description?: string;
  consumedAt: string;
  profileId?: string;
  mealId?: number;
  meal?: {
    MealID: number;
    name: string;
    description?: string;
  };
}

export default function UserHistoryPage() {
  const router = useRouter();
  const [consumptions, setConsumptions] = useState<Consumption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Context hooks
  const { userData } = useUser();
  const profile = userData.profile;

  const fetchUserHistory = useCallback(async () => {
    if (!profile?.id) return;
    
    try {
      setLoading(true);
      console.debug('Fetching user history', `${API_BASE_URL}/consumptions/user/${profile.id}`);
      const res = await fetch(`${API_BASE_URL}/consumptions/user/${profile.id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      console.debug('User history payload', data);
      setConsumptions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.debug('Error fetching user history', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    fetchUserHistory();
  }, [fetchUserHistory]);

  const formatDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) : '';

  const formatShortDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short'
    }) : '';

  // Filter and sort consumptions
  const filteredAndSortedConsumptions = consumptions
    .filter(consumption => 
      consumption.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (consumption.description && consumption.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (consumption.meal?.name && consumption.meal.name.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      const dateA = new Date(a.consumedAt).getTime();
      const dateB = new Date(b.consumedAt).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

  // Group consumptions by date
  const groupedConsumptions = filteredAndSortedConsumptions.reduce((acc, consumption) => {
    const date = new Date(consumption.consumedAt).toDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(consumption);
    return acc;
  }, {} as Record<string, Consumption[]>);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          <div className="h-8 bg-muted animate-pulse rounded" />
          <div className="h-64 bg-muted animate-pulse rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center space-x-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="p-2">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold">Error</h1>
        </div>
        <Card>
          <CardContent>
            <p className="text-destructive">{error}</p>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" onClick={() => router.back()}>
                Back
              </Button>
              <Button onClick={fetchUserHistory}>Retry</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="p-2">
          <ArrowLeft className="w-4 h-4" />
        </Button>

        <div className="flex-1">
          <h1 className="text-3xl font-bold">My Personal Consumption History</h1>
          <p className="text-muted-foreground mt-1">
            Record of your individual meal consumption activity (excludes group meals)
          </p>
        </div>

        {/* User Info */}
        {profile && (
          <div className="flex items-center gap-3 bg-muted/50 p-3 rounded-lg border">
            <div className="w-10 h-10 bg-amber-800/30 border border-amber-700/50 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <div className="font-medium text-sm">
                {profile.username || 'User'}
              </div>
              <div className="text-xs text-muted-foreground capitalize">
                {profile.role}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                placeholder="Search meals or descriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background"
              />
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="px-3 py-2 border border-input rounded-md bg-background"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {filteredAndSortedConsumptions.length} of {consumptions.length} meals
              {searchTerm && ` matching "${searchTerm}"`}
            </span>
            {consumptions.length > 0 && (
              <span>
                From {formatShortDate(consumptions[consumptions.length - 1]?.consumedAt)} to {formatShortDate(consumptions[0]?.consumedAt)}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* History Content */}
      {filteredAndSortedConsumptions.length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedConsumptions).map(([date, dayConsumptions]) => (
            <Card key={date}>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-lg">
                  <Calendar className="w-5 h-5 mr-2" />
                  {new Date(date).toLocaleDateString('es-ES', { 
                    weekday: 'long',
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                  <span className="ml-auto text-sm font-normal text-muted-foreground">
                    {dayConsumptions.length} meal{dayConsumptions.length !== 1 ? 's' : ''}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dayConsumptions.map((consumption) => (
                    <div 
                      key={consumption.ConsumptionID} 
                      className="border-l-4 border-primary pl-4 py-3 bg-muted/30 rounded-r-lg"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <ChefHat className="w-4 h-4 text-primary" />
                            <p className="font-medium">{consumption.name}</p>
                          </div>
                          {consumption.description && (
                            <p className="text-sm text-muted-foreground mt-1 ml-6">
                              {consumption.description}
                            </p>
                          )}
                          {consumption.meal && consumption.meal.name !== consumption.name && (
                            <p className="text-sm text-amber-600 mt-1 ml-6">
                              From meal: {consumption.meal.name}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 ml-6 text-xs text-muted-foreground">
                            <span>
                              {new Date(consumption.consumedAt).toLocaleTimeString('es-ES', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center text-muted-foreground">
                          <Activity className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {searchTerm ? 'No matching meals found' : 'No individual consumption history'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm 
                  ? `No meals match "${searchTerm}". Try adjusting your search terms.`
                  : 'You haven\'t recorded any individual meal consumption yet. Start by registering some meals!'
                }
              </p>
              {searchTerm && (
                <Button variant="outline" onClick={() => setSearchTerm('')}>
                  Clear Search
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}