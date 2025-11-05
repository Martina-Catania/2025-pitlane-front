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
      toast.error('El objetivo debe estar entre 500 y 10,000 calorías');
      return;
    }

    setLoading(true);
    const success = await onUpdate(newGoal);
    setLoading(false);

    if (success) {
      toast.success(`Tu nuevo objetivo es ${newGoal.toLocaleString()} calorías por día`);
    } else {
      toast.error('No se pudo actualizar el objetivo');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Establecer Objetivo de Calorías</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="calorie-goal">Calorías objetivo (kcal/día)</Label>
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
              Recomendado: 1500-2500 kcal para mantenimiento
            </p>
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Guardar Objetivo
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}