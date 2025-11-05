'use client';

import { useCalorieProgress } from '@/lib/hooks/useKcalProgress';
import { CalorieProgressCard } from '@/components/profile/calorie-progress';
import { CalorieGoalSettings } from '@/components/profile/calorie-goal-settings';

export default function ProfilePage() {
  const { progress, loading, updateCalorieGoal } = useCalorieProgress();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mi Perfil</h1>
        <p className="text-muted-foreground">
          Configura tus preferencias y objetivos nutricionales
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Progreso de calorías */}
        {progress && (
          <CalorieProgressCard
            consumed={progress.consumed}
            goal={progress.goal}
            remaining={progress.remaining}
            percentage={progress.percentage}
            loading={loading}
          />
        )}

        {/* Configuración de objetivo */}
        {progress && (
          <CalorieGoalSettings
            currentGoal={progress.goal}
            onUpdate={updateCalorieGoal}
          />
        )}
      </div>
    </div>
  );
}