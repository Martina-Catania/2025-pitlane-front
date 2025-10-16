'use client';

import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { API_BASE_URL } from '@/lib/config/api';

interface Preference {
  PreferenceID: number;
  name: string;
}

interface GroupMember {
  GroupMemberID: number;
  role: string;
  joinedAt: string;
  profile: {
    id: string;
    username: string;
    role: string;
  };
}

interface PreferenceData {
  name: string;
  count: number;
  percentage: number;
  [key: string]: any;
}

interface GroupPreferencesPieChartProps {
  groupId: string;
  members: GroupMember[];
}

// Color palette for the pie chart
const COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', 
  '#d084d0', '#ffb347', '#87ceeb', '#dda0dd', '#98fb98',
  '#f0e68c', '#ff6347', '#40e0d0', '#ee82ee', '#90ee90'
];

export default function GroupPreferencesPieChart({ groupId, members }: GroupPreferencesPieChartProps) {
  const [preferencesData, setPreferencesData] = useState<PreferenceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGroupPreferences = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get session for auth
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          throw new Error('No authenticated session');
        }

        // Fetch all preferences to get names
        const preferencesResponse = await fetch(`${API_BASE_URL}/preferences`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!preferencesResponse.ok) {
          throw new Error('Failed to fetch preferences');
        }

        const allPreferences: Preference[] = await preferencesResponse.json();
        const preferenceMap = new Map<number, string>();
        allPreferences.forEach(pref => {
          preferenceMap.set(pref.PreferenceID, pref.name);
        });

        // Fetch member preferences
        const memberPreferences = new Map<number, number>(); // preferenceId -> count
        
        for (const member of members) {
          try {
            const memberResponse = await fetch(`${API_BASE_URL}/profile/${member.profile.id}/full`, {
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
              },
            });

            if (memberResponse.ok) {
              const memberData = await memberResponse.json();
              const preferences = memberData.Preference || [];
              
              preferences.forEach((pref: { PreferenceID: number }) => {
                const currentCount = memberPreferences.get(pref.PreferenceID) || 0;
                memberPreferences.set(pref.PreferenceID, currentCount + 1);
              });
            }
          } catch (memberError) {
            console.warn(`Failed to fetch preferences for member ${member.profile.username}:`, memberError);
          }
        }

        // Process data for the pie chart
        const totalMembers = members.length;
        const chartData: PreferenceData[] = [];

        memberPreferences.forEach((count, preferenceId) => {
          const preferenceName = preferenceMap.get(preferenceId);
          if (preferenceName) {
            chartData.push({
              name: preferenceName,
              count,
              percentage: Math.round((count / totalMembers) * 100)
            });
          }
        });

        // Sort by count descending
        chartData.sort((a, b) => b.count - a.count);

        setPreferencesData(chartData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load group preferences');
      } finally {
        setLoading(false);
      }
    };

    if (members.length > 0) {
      fetchGroupPreferences();
    } else {
      setLoading(false);
    }
  }, [groupId, members]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded shadow-lg p-3">
          <p className="font-medium text-foreground">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            {data.count} member{data.count !== 1 ? 's' : ''} ({data.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            Group Preferences Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Loading preferences...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            Group Preferences Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (preferencesData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            Group Preferences Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No preferences set by group members yet</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5" />
          Group Preferences Distribution
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Dietary preferences across {members.length} group member{members.length !== 1 ? 's' : ''}
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={preferencesData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
                animationBegin={0}
                animationDuration={800}
              >
                {preferencesData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]} 
                    stroke="#fff" 
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ fontSize: '12px' }}
                formatter={(value: string, entry: any) => {
                  const count = entry.payload?.count || 0;
                  return (
                    <span style={{ color: entry.color }}>
                      {value} ({count} member{count !== 1 ? 's' : ''})
                    </span>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Summary stats */}
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div className="text-center p-2 bg-muted rounded">
            <p className="font-medium">{preferencesData.length}</p>
            <p className="text-muted-foreground">Different preferences</p>
          </div>
          <div className="text-center p-2 bg-muted rounded">
            <p className="font-medium">
              {preferencesData.reduce((sum, item) => sum + item.count, 0)}
            </p>
            <p className="text-muted-foreground">Total preferences</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}