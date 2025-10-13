'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Activity, Info, UtensilsCrossed } from 'lucide-react';
import { API_BASE_URL } from '@/lib/config/api';

interface Consumption {
  ConsumptionID: number;
  name: string;
  consumedAt: string;
}

interface Group {
  GroupID: number;
  name: string;
  description?: string;
  consumptions?: Consumption[];
}

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;

  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGroup = useCallback(async () => {
    try {
      setLoading(true);
      console.debug('Fetching group', `${API_BASE_URL}/groups/${groupId}`);
      const res = await fetch(`${API_BASE_URL}/groups/${groupId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
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
  const goMeals = () => alert('Meals functionality coming soon');

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
              <Button onClick={fetchGroup}>Retry</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="p-2">
          <ArrowLeft className="w-4 h-4" />
        </Button>

        <div className="flex-1">
          <h1 className="text-3xl font-bold">{group?.name}</h1>
          {group?.description && <p className="text-muted-foreground mt-1">{group.description}</p>}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={goInfo}>
            <Info className="w-4 h-4 mr-2" /> Group information
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 mr-2" /> Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {group?.consumptions && group.consumptions.length > 0 ? (
              <div className="space-y-3">
                {group!.consumptions!.slice(0, 10).map((c) => (
                  <div key={c.ConsumptionID} className="border-l-4 border-primary pl-4">
                    <p className="font-medium">{c.name}</p>
                    <p className="text-sm text-muted-foreground">{formatDate(c.consumedAt)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No recent activity</h3>
                <p className="text-muted-foreground">Meals consumed by the group will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UtensilsCrossed className="w-5 h-5 mr-2" /> Group Meals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <UtensilsCrossed className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Group meals</h3>
              <p className="text-muted-foreground mb-4">Manage the meals planned and consumed by the group</p>
              <Button onClick={goMeals}>View group meals</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}