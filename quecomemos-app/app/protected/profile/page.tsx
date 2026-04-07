'use client';

import { useCalorieProgress } from '@/lib/hooks/useKcalProgress';
import { CalorieProgressWithHistory } from '@/components/profile/CalorieProgressWithHistory';
import { CalorieGoalSettings } from '@/components/profile/calorie-goal';
import { BadgeProgressDisplay } from '@/components/profile/badges/BadgeProgressDisplay';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ProfilePage() {
  const { progress, loading, updateCalorieGoal } = useCalorieProgress();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Profile</h1>
        <p className="text-muted-foreground">
          Configure your preferences and nutritional goals
        </p>
      </div>
      
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3 justify-center">
          <Button asChild variant="outline">
            <Link href="/protected/shopping-list">Shopping List</Link>
          </Button>
        </div>

        {/* Progreso de calorías con historial */}
        {progress && (
          <CalorieProgressWithHistory
            consumed={progress.consumed}
            goal={progress.goal}
            remaining={progress.remaining}
            percentage={progress.percentage}
            loading={loading}
            consumptionHistory={progress.consumptionHistory}
          />
        )}

        {/* Configuración de objetivo */}
        <div className="max-w-md mx-auto">
          {progress && (
            <CalorieGoalSettings
              currentGoal={progress.goal}
              onUpdate={updateCalorieGoal}
            />
          )}
        </div>

        {/* Badges & Achievements */}
        <BadgeProgressDisplay />
      </div>
    </div>
  );
}