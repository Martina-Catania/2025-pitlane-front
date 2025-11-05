'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface CalorieProgress {
  consumed: number;
  goal: number;
  remaining: number;
  percentage: number;
}

export function useCalorieProgress(date?: Date) {
  const [progress, setProgress] = useState<CalorieProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProgress();
  }, [date]);

  const fetchProgress = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const dateParam = date ? `?date=${date.toISOString()}` : '';
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile/calorie-progress${dateParam}`, {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch calorie progress');

      const data = await response.json();
      setProgress(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const updateCalorieGoal = async (newGoal: number) => {
    try {
      const supabase = createClient();
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile/calorie-goal`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ calorie_goal: newGoal })
      });

      if (!response.ok) throw new Error('Failed to update calorie goal');

      await fetchProgress();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  };

  return { progress, loading, error, refetch: fetchProgress, updateCalorieGoal };
}