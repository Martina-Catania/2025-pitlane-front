'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useUser } from '@/lib/contexts/UserContext';
import { useGlobalNotification } from '@/lib/contexts/NotificationContext';
import { PlannedMeal, PlannedMealsService } from '@/lib/services/PlannedMealsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function OverduePlannedMealModal() {
  const pathname = usePathname();
  const { userData } = useUser();
  const { showError, showSuccess } = useGlobalNotification();

  const [pendingMeals, setPendingMeals] = useState<PlannedMeal[]>([]);
  const [activeMeal, setActiveMeal] = useState<PlannedMeal | null>(null);
  const [canAutoOpen, setCanAutoOpen] = useState(false);
  const [resolveNote, setResolveNote] = useState('');
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const profileId = userData.profile?.id;

  const activeScope = useMemo(() => {
    if (!activeMeal?.groupId) {
      return 'personal';
    }
    return `group #${activeMeal.groupId}`;
  }, [activeMeal]);

  const fetchPendingMeals = useCallback(async () => {
    if (!profileId) {
      return;
    }

    try {
      const overdue = await PlannedMealsService.getPlannedMeals({
        profileId,
        onlyOverdue: true
      });

      setPendingMeals(overdue);
    } catch (error) {
      showError('Failed to load overdue planned meals', error instanceof Error ? error.message : 'Unknown error');
    }
  }, [profileId, showError]);

  useEffect(() => {
    setCanAutoOpen(true);
    fetchPendingMeals();
  }, [fetchPendingMeals, pathname]);

  useEffect(() => {
    if (!profileId) {
      return;
    }

    const intervalId = setInterval(() => {
      fetchPendingMeals();
    }, 60000);

    return () => clearInterval(intervalId);
  }, [profileId, fetchPendingMeals]);

  useEffect(() => {
    if (canAutoOpen && !activeMeal && pendingMeals.length > 0) {
      setActiveMeal(pendingMeals[0]);
      setCanAutoOpen(false);
    }
  }, [pendingMeals, activeMeal, canAutoOpen]);

  const closeAndAdvance = useCallback((resolvedMealId: number) => {
    setPendingMeals((prev) => prev.filter((meal) => meal.PlannedMealID !== resolvedMealId));
    setActiveMeal(null);
    setResolveNote('');
    setRescheduleDate('');
  }, []);

  const resolveMeal = async (payload: { wasConsumed: boolean; action?: 'rescheduled' | 'cancelled'; newPlannedFor?: string }) => {
    if (!profileId || !activeMeal) {
      return;
    }

    try {
      setSubmitting(true);
      await PlannedMealsService.resolvePlannedMeal(activeMeal.PlannedMealID, {
        requesterId: profileId,
        note: resolveNote || undefined,
        ...payload,
        newPlannedFor: payload.newPlannedFor ? new Date(payload.newPlannedFor).toISOString() : undefined
      });

      closeAndAdvance(activeMeal.PlannedMealID);
      showSuccess('Planned meal resolved', 'Thanks, your shopping list and planned meals were updated.');
      await fetchPendingMeals();
    } catch (error) {
      showError('Failed to resolve planned meal', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!activeMeal) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Pending planned meal confirmation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Did you consume {activeMeal.meal.name} ({activeScope}) planned for {new Date(activeMeal.plannedFor).toLocaleString()}?
          </p>

          <div className="space-y-2">
            <Label htmlFor="global-resolve-note">Note (optional)</Label>
            <Input
              id="global-resolve-note"
              value={resolveNote}
              onChange={(e) => setResolveNote(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="global-reschedule-date">Reschedule date (if not consumed)</Label>
            <Input
              id="global-reschedule-date"
              type="datetime-local"
              value={rescheduleDate}
              onChange={(e) => setRescheduleDate(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button disabled={submitting} onClick={() => resolveMeal({ wasConsumed: true })}>Consumed</Button>
            <Button
              variant="outline"
              disabled={submitting || !rescheduleDate}
              onClick={() => resolveMeal({ wasConsumed: false, action: 'rescheduled', newPlannedFor: rescheduleDate })}
            >
              Not consumed · Reschedule
            </Button>
            <Button
              variant="destructive"
              disabled={submitting}
              onClick={() => resolveMeal({ wasConsumed: false, action: 'cancelled' })}
            >
              Not consumed · Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
