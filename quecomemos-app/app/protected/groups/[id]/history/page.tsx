'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Activity, ChefHat, Calendar, Search, Filter } from 'lucide-react';
import { useUser } from '@/lib/contexts/UserContext';
import { API_BASE_URL } from '@/lib/config/api';

interface Consumption {
  ConsumptionID: number;
  name: string;
  description?: string;
  consumedAt: string;
  profileId?: string;
  profile?: {
    id: string;
    username?: string;
  };
}

interface Group {
  GroupID: number;
  name: string;
  description?: string;
  consumptions?: Consumption[];
}

export default function GroupHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;

  const [group, setGroup] = useState<Group | null>(null);
  const [consumptions, setConsumptions] = useState<Consumption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Context hooks
  const { } = useUser();

  const fetchGroupHistory = useCallback(async () => {
    try {
      setLoading(true);
      console.debug('Fetching group history', `${API_BASE_URL}/groups/${groupId}`);
      const res = await fetch(`${API_BASE_URL}/groups/${groupId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      console.debug('Group history payload', data);
      setGroup(data);
      setConsumptions(data.consumptions || []);
    } catch (err) {
      console.debug('Error fetching group history', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchGroupHistory();
  }, [fetchGroupHistory]);



  const formatShortDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short'
    }) : '';

  // Filter and sort consumptions
  const filteredAndSortedConsumptions = consumptions
    .filter(consumption => 
      consumption.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (consumption.description && consumption.description.toLowerCase().includes(searchTerm.toLowerCase()))
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

function GroupHistorySkeleton() {
  return (
    <div className="container mx-auto p-6 space-y-6 border border-amber-700/50 rounded-lg bg-gradient-to-br from-amber-800/10 to-amber-900/10">
      {/* Header skeleton */}
      <div className="flex items-center space-x-4">
        <div className="w-8 h-8 bg-muted rounded animate-pulse"></div>
        <div className="flex-1">
          <div className="w-48 h-8 bg-muted rounded animate-pulse mb-2"></div>
          <div className="w-96 h-4 bg-muted/70 rounded animate-pulse"></div>
        </div>
      </div>

      {/* Filters skeleton */}
      <Card className="bg-gradient-to-br from-amber-800/30 to-amber-900/30 border-amber-700/50">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 h-10 bg-muted rounded animate-pulse"></div>
            <div className="w-32 h-10 bg-muted rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>

      {/* History cards skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="bg-gradient-to-br from-amber-800/30 to-amber-900/30 border-amber-700/50 animate-pulse">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="w-6 h-6 bg-muted rounded animate-pulse"></div>
                <div className="w-20 h-4 bg-muted/70 rounded animate-pulse"></div>
              </div>
              <div className="w-3/4 h-6 bg-muted rounded animate-pulse"></div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="w-full h-4 bg-muted/70 rounded animate-pulse"></div>
              <div className="w-2/3 h-4 bg-muted/70 rounded animate-pulse"></div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-muted/70 rounded animate-pulse"></div>
                <div className="w-32 h-4 bg-muted/70 rounded animate-pulse"></div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-muted/70 rounded animate-pulse"></div>
                <div className="w-24 h-4 bg-muted/70 rounded animate-pulse"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

  if (loading) {
    return <GroupHistorySkeleton />;
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
              <Button onClick={fetchGroupHistory}>Retry</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6 border border-amber-700/50 rounded-lg bg-gradient-to-br from-amber-800/10 to-amber-900/10">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="p-2">
          <ArrowLeft className="w-4 h-4" />
        </Button>

        <div className="flex-1">
          <h1 className="text-3xl font-bold">Activity History</h1>
          <p className="text-muted-foreground mt-1">
            Complete meal consumption history for {group?.name}
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-gradient-to-br from-amber-800/30 to-amber-900/30 border-amber-700/50">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search meals or descriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-amber-700/50 rounded-md bg-background/50 text-gray-300 placeholder:text-gray-500"
              />
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="px-3 py-2 border border-amber-700/50 rounded-md bg-background/50 text-gray-300"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-4 pt-4 border-t border-amber-700/30 flex items-center justify-between text-sm text-gray-400">
            <span>
              {filteredAndSortedConsumptions.length} of {consumptions.length} activities
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
            <Card key={date} className="bg-gradient-to-br from-amber-800/30 to-amber-900/30 border-amber-700/50">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-lg text-amber-200">
                  <Calendar className="w-5 h-5 mr-2" />
                  {new Date(date).toLocaleDateString('es-ES', { 
                    weekday: 'long',
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                  <span className="ml-auto text-sm font-normal text-gray-400">
                    {dayConsumptions.length} meal{dayConsumptions.length !== 1 ? 's' : ''}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dayConsumptions.map((consumption) => (
                    <div 
                      key={consumption.ConsumptionID} 
                      className="border-l-4 border-amber-700 pl-4 py-3 bg-amber-900/20 rounded-r-lg"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <ChefHat className="w-4 h-4 text-amber-700" />
                            <p className="font-medium text-gray-300">{consumption.name}</p>
                          </div>
                          {consumption.description && (
                            <p className="text-sm text-gray-400 mt-1 ml-6">
                              {consumption.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 ml-6 text-xs text-gray-500">
                            <span>
                              {new Date(consumption.consumedAt).toLocaleTimeString('es-ES', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            {consumption.profile?.username && (
                              <span>by {consumption.profile.username}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center text-amber-700">
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
        <Card className="bg-gradient-to-br from-amber-800/30 to-amber-900/30 border-amber-700/50">
          <CardContent className="py-12">
            <div className="text-center">
              <Activity className="w-12 h-12 mx-auto text-amber-700 mb-4" />
              <h3 className="text-lg font-medium mb-2 text-gray-300">
                {searchTerm ? 'No matching activities found' : 'No activity history'}
              </h3>
              <p className="text-gray-400 mb-4">
                {searchTerm 
                  ? `No activities match "${searchTerm}". Try adjusting your search terms.`
                  : 'This group has no recorded meal consumption history yet.'
                }
              </p>
              {searchTerm && (
                <Button variant="outline" onClick={() => setSearchTerm('')} className="bg-amber-700 hover:bg-amber-600 text-white border-amber-600">
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