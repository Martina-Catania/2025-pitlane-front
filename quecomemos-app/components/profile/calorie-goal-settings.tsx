'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface CalorieGoalSettingsProps {
  currentGoal: number;
  onUpdate: (newGoal: number) => Promise<boolean>;
}

export function CalorieGoalSettings({ currentGoal, onUpdate }: CalorieGoalSettingsProps) {
  const [goal, setGoal] = useState(currentGoal.toString());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setGoal(currentGoal.toString());
  }, [currentGoal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newGoal = parseInt(goal);
    if (isNaN(newGoal) || newGoal < 500 || newGoal > 10000) {
      toast.error('The goal must be between 500 and 10,000 calories');
      return;
    }

    setLoading(true);
    const success = await onUpdate(newGoal);
    setLoading(false);

    if (success) {
      toast.success(`Your new goal is ${newGoal.toLocaleString()} calories per day`);
    } else {
      toast.error('Failed to update the goal');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Set Calorie Goal</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="calorie-goal">Calorie Goal (kcal/day)</Label>
            <Input
              id="calorie-goal"
              type="number"
              min="500"
              max="10000"
              step="50"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="2000"
            />
            <p className="text-xs text-muted-foreground">
              Recommended: 1500-2500 kcal for maintenance
            </p>
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Goal
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}