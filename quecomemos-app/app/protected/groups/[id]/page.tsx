'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Activity, Info, ChefHat } from 'lucide-react';
import Image from 'next/image';
import { API_BASE_URL } from '@/lib/config/api';
import type { Group } from '@/components/groups';

interface Consumption {
  MealConsumptionID: number;
  name: string;
  consumedAt: string;
  portionFraction?: number;
  totalKcal?: number;
  source?: 'individual' | 'voting' | 'game' | 'group';
  meal?: {
    MealID: number;
    name: string;
    description?: string;
  };
  profile?: {
    id: string;
    username: string;
  };
  votingSession?: {
    VotingSessionID: number;
  };
  gameSession?: {
    GameSessionID: number;
    gameType: string;
  };
}

// Extend the imported Group interface to include mealConsumptions
interface GroupWithConsumptions extends Group {
  mealConsumptions?: Consumption[];
}

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;

  const [group, setGroup] = useState<GroupWithConsumptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  // Context hooks  

  const fetchGroup = useCallback(async () => {
    try {
      setLoading(true);
      console.debug('Fetching group', `${API_BASE_URL}/groups/${groupId}`);
      const res = await fetch(`${API_BASE_URL}/groups/${groupId}`);
      if (!res.ok) {
        if (res.status === 404) {
          // Group deleted or doesn't exist
          setNotFound(true);
          return;
        }
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      console.debug('Group payload', data);
      setGroup(data);
    } catch (err) {
      console.debug('Error fetching group', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchGroup();
  }, [fetchGroup]);

  const formatDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

  const goInfo = () => router.push(`/protected/groups/${groupId}/info`);
  const goHistory = () => router.push(`/protected/groups/${groupId}/history`);

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

  if (notFound) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h1 className="text-3xl font-bold mb-4">This is not the group you are looking for</h1>

          <div className="flex justify-center mb-4">
            <Image
              src="https://gifdb.com/images/high/these-are-not-the-droids-you-re-looking-for-page-meme-ygs7tyrw9v1a7k52.gif"
              alt="These aren't the droids you're looking for"
              width={272}
              height={153}
              className="w-90 h-auto rounded shadow-md"
              unoptimized={true}
              style={{ maxWidth: '290px' }}
            />
          </div>
          </div>
          <div className="flex justify-center">
            <Button onClick={() => router.replace('/protected/groups')} className="bg-amber-700 text-white">
              Go to groups
            </Button>
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
              <Button onClick={fetchGroup}>Retry</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:space-x-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="p-2 self-start">
          <ArrowLeft className="w-4 h-4" />
        </Button>

        <div className="flex-1">
          <h1 className="text-3xl font-bold">{group?.name}</h1>
          {group?.description && <p className="text-muted-foreground mt-1">{group.description}</p>}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={goInfo} className="w-full sm:w-auto">
            <Info className="w-4 h-4 mr-2" /> Group information
          </Button>
          <Button 
            variant="outline" 
            onClick={() => router.push(`/protected/groups/${groupId}/voting`)} 
            className="w-full sm:w-auto border-amber-600 text-amber-600 hover:bg-amber-600 hover:text-white"
          >
            <ChefHat className="w-4 h-4 mr-2" /> Group Voting
          </Button>
          <Button 
            variant="outline" 
            onClick={() => router.push(`/protected/groups/${groupId}/game`)} 
            className="w-full sm:w-auto border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
          >
            <ChefHat className="w-4 h-4 mr-2" /> Group Game
          </Button>
        </div>
      </div>

        {/* Recent Activity */}
      <Card className="bg-gradient-to-br from-amber-800/30 to-amber-900/30 border-amber-700/50">
        <CardHeader>
          <CardTitle className="flex items-center text-amber-200">
            <Activity className="w-5 h-5 mr-2" /> Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {group?.mealConsumptions && group.mealConsumptions.length > 0 ? (
            <div className="space-y-3">
              {/* Scrollable container for activities */}
              <div className="max-h-80 overflow-y-auto pr-2 space-y-3">
                {group!.mealConsumptions!.slice(0, 10).map((c: Consumption) => {
                  // Format game type for display
                  const displayName = c.source === 'game' && c.gameSession?.gameType
                    ? c.gameSession.gameType
                        .split('_')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                        .join(' ') + ' Game'
                    : c.meal?.name || c.name;

                  const sourceLabel = c.source === 'voting' ? 'Voting' : c.source === 'game' ? 'Game' : c.source === 'group' ? 'Group Meal' : 'Manual';
                  const sourceColor = c.source === 'voting' ? 'text-purple-400 bg-purple-900/30 border-purple-700' : 
                                    c.source === 'game' ? 'text-blue-400 bg-blue-900/30 border-blue-700' : 
                                    c.source === 'group' ? 'text-amber-400 bg-amber-900/30 border-amber-700' :
                                    'text-green-400 bg-green-900/30 border-green-700';

                  return (
                    <div key={c.MealConsumptionID} className="border-l-4 border-amber-700 pl-4 py-3 bg-amber-950/20 rounded-r-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <ChefHat className="w-4 h-4 text-amber-400" />
                            <p className="font-medium text-gray-200">{displayName}</p>
                            {c.source && (
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${sourceColor}`}>
                                {sourceLabel}
                              </span>
                            )}
                          </div>
                          
                          {/* Participants info */}
                          {c.profile && (
                            <p className="text-sm text-amber-500 ml-6">
                              Registered by {c.profile.username}
                            </p>
                          )}
                          
                          {/* Date and time */}
                          <p className="text-xs text-gray-400 ml-6 mt-1">
                            {new Date(c.consumedAt).toLocaleString('es-ES', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* View more button */}
              <div className="pt-4 border-t border-amber-700/30">
                <div className="flex items-center justify-between">
                  {group!.mealConsumptions!.length > 10 && (
                    <p className="text-sm text-gray-400">
                      Showing 10 of {group!.mealConsumptions!.length} activities
                    </p>
                  )}
                  <Button variant="outline" size="sm" onClick={goHistory} className="ml-auto bg-amber-700 hover:bg-amber-600 text-white border-amber-600">
                    View Complete History
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 mx-auto text-amber-700 mb-4" />
              <h3 className="text-lg font-medium mb-2 text-gray-300">No recent activity</h3>
              <p className="text-gray-400 mb-4">Group meals will appear here once members start eating together</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}