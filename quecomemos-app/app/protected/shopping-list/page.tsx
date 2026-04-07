'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/contexts/UserContext';
import { useGlobalNotification } from '@/lib/contexts/NotificationContext';
import { PlannedMealsService, PlannedMeal, ShoppingListItem } from '@/lib/services/PlannedMealsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { RegisterMealModal } from '@/components/modals';
import { ConfirmationModal } from '@/components/modals';
import type { PortionData } from '@/components/meal';
import type { Meal } from '@/lib/contexts/MealsContext';

type ShoppingDateRange = 'all' | 'tomorrow' | 'next-week' | 'next-month';

function getDateRangePayload(range: ShoppingDateRange): { startDate?: string; endDate?: string } {
  if (range === 'all') {
    return {};
  }

  const start = new Date();
  const end = new Date(start);

  if (range === 'tomorrow') {
    end.setHours(end.getHours() + 24);
  } else if (range === 'next-week') {
    end.setDate(end.getDate() + 7);
  } else {
    end.setDate(end.getDate() + 30);
  }

  return {
    startDate: start.toISOString(),
    endDate: end.toISOString()
  };
}

function formatPlannedFor(dateValue: string): string {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown date';
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function ShoppingListContent() {
  const { userData } = useUser();
  const { showError, showSuccess } = useGlobalNotification();
  const router = useRouter();
  const searchParams = useSearchParams();
  const groupIdParam = searchParams.get('groupId');
  const groupId = groupIdParam ? parseInt(groupIdParam) : undefined;

  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [plannedMeals, setPlannedMeals] = useState<PlannedMeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<ShoppingDateRange>('all');
  const [editingMeal, setEditingMeal] = useState<PlannedMeal | null>(null);
  const [mealPendingDelete, setMealPendingDelete] = useState<PlannedMeal | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMutatingPlannedMeal, setIsMutatingPlannedMeal] = useState(false);

  const profileId = userData.profile?.id;
  const dateRangePayload = useMemo(() => getDateRangePayload(dateRange), [dateRange]);

  const title = useMemo(() => {
    return groupId ? 'Group shopping list' : 'My shopping list';
  }, [groupId]);

  const dateRangeLabel = useMemo(() => {
    const labels: Record<ShoppingDateRange, string> = {
      all: 'All future meals',
      tomorrow: 'Tomorrow',
      'next-week': 'Next 7 days',
      'next-month': 'Next 30 days'
    };

    return labels[dateRange];
  }, [dateRange]);

  const refreshData = useCallback(async () => {
    if (!profileId) {
      return;
    }

    try {
      setLoading(true);
      const [list, futureMeals] = await Promise.all([
        PlannedMealsService.getShoppingList({
          profileId: groupId ? undefined : profileId,
          groupId,
          includePurchased: true,
          startDate: dateRangePayload.startDate,
          endDate: dateRangePayload.endDate
        }),
        PlannedMealsService.getPlannedMeals({
          profileId: groupId ? undefined : profileId,
          groupId,
          onlyFuture: true,
          startDate: dateRangePayload.startDate,
          endDate: dateRangePayload.endDate
        })
      ]);

      setItems(list);
      setPlannedMeals(futureMeals);
    } catch (error) {
      showError('Failed to load shopping data', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [profileId, groupId, dateRangePayload.startDate, dateRangePayload.endDate, showError]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const handleToggle = async (item: ShoppingListItem, checked: boolean) => {
    if (!profileId) {
      return;
    }

    try {
      await PlannedMealsService.updateShoppingStatus({
        profileId,
        groupId,
        foodId: item.foodId,
        isPurchased: checked,
        startDate: dateRangePayload.startDate,
        endDate: dateRangePayload.endDate
      });

      setItems((prev) => prev.map((entry) => (
        entry.foodId === item.foodId
          ? {
              ...entry,
              isPurchased: checked,
              purchasedQuantity: checked ? entry.totalQuantity : 0,
              entries: entry.entries.map((line) => ({ ...line, isPurchased: checked }))
            }
          : entry
      )));

      showSuccess('Shopping list updated', `${item.foodName} marked as ${checked ? 'purchased' : 'to buy'}.`);
    } catch (error) {
      showError('Failed to update shopping status', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const getPortionsForEdit = (meal: PlannedMeal): PortionData | null => {
    const baseFoods = meal.meal?.mealFoods;
    if (!baseFoods || baseFoods.length === 0 || !meal.foodItems || meal.foodItems.length === 0) {
      return null;
    }

    const fullCalories = baseFoods.reduce((sum, mf) => sum + (mf.food.kCal * mf.quantity), 0);
    const selectedCalories = meal.foodItems.reduce((sum, item) => sum + (item.food.kCal * item.quantity), 0);

    return {
      mode: 'percentage',
      portionFraction: fullCalories > 0 ? Math.min(1, selectedCalories / fullCalories) : 1,
      foodPortions: baseFoods.map((mf) => {
        const selected = meal.foodItems.find((item) => item.foodId === mf.food.FoodID);
        const quantity = selected?.quantity ?? 0;
        const fraction = mf.quantity > 0 ? quantity / mf.quantity : 0;

        return {
          foodId: mf.food.FoodID,
          portionFraction: fraction,
          absoluteQuantity: quantity
        };
      }),
      totalCalories: Math.round(selectedCalories)
    };
  };

  const handleEdit = (meal: PlannedMeal) => {
    setEditingMeal(meal);
    setIsEditModalOpen(true);
  };

  const buildFallbackMealForEdit = (meal: PlannedMeal): Meal | null => {
    if (!meal?.meal?.MealID || !meal?.meal?.mealFoods) {
      return null;
    }

    return {
      MealID: meal.meal.MealID,
      name: meal.meal.name,
      description: meal.meal.description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      profileId: meal.profileId,
      profile: {
        id: meal.profileId,
        role: 'user',
        username: 'Unknown'
      },
      mealFoods: meal.meal.mealFoods.map((mf) => ({
        quantity: mf.quantity,
        food: {
          FoodID: mf.food.FoodID,
          name: mf.food.name,
          svgLink: '',
          kCal: mf.food.kCal,
          dietaryRestrictions: [],
          preferences: []
        }
      }))
    };
  };

  const handleEditSubmit = async (mealData: { mealId: number; date: string; portions?: PortionData }) => {
    if (!profileId || !editingMeal) {
      showError('Unable to update planned meal', 'User profile or selected planned meal is missing.');
      return;
    }

    try {
      setIsMutatingPlannedMeal(true);
      await PlannedMealsService.updatePlannedMeal(editingMeal.PlannedMealID, {
        requesterId: profileId,
        mealId: mealData.mealId,
        plannedFor: mealData.date,
        portions: mealData.portions
      });

      setIsEditModalOpen(false);
      setEditingMeal(null);
      await refreshData();
      showSuccess('Planned meal updated', 'Shopping list has been refreshed with your changes.');
    } catch (error) {
      showError('Failed to update planned meal', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsMutatingPlannedMeal(false);
    }
  };

  const handleRemove = async (meal: PlannedMeal) => {
    setMealPendingDelete(meal);
  };

  const confirmRemove = async () => {
    if (!profileId) {
      showError('Unable to remove planned meal', 'User profile is missing. Please reload and try again.');
      return;
    }

    if (!mealPendingDelete) {
      showError('Unable to remove planned meal', 'No planned meal was selected for deletion.');
      return;
    }

    try {
      setIsMutatingPlannedMeal(true);
      await PlannedMealsService.deletePlannedMeal(mealPendingDelete.PlannedMealID, {
        requesterId: profileId
      });

      await refreshData();
      setMealPendingDelete(null);
      showSuccess('Planned meal removed', 'Shopping list has been refreshed.');
    } catch (error) {
      showError('Failed to remove planned meal', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsMutatingPlannedMeal(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="p-2">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="text-muted-foreground">Grouped foods needed for all future planned meals.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle>Foods to buy</CardTitle>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { value: 'tomorrow', label: 'Tomorrow' },
                  { value: 'next-week', label: 'Next week' },
                  { value: 'next-month', label: 'Next month' },
                  { value: 'all', label: 'Show all' }
                ] as Array<{ value: ShoppingDateRange; label: string }>
              ).map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={dateRange === option.value ? 'default' : 'outline'}
                  className={dateRange === option.value ? 'bg-amber-700 text-white hover:bg-amber-600' : ''}
                  onClick={() => setDateRange(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-muted-foreground">Showing: {dateRangeLabel}</p>
          {loading ? (
            <p className="text-muted-foreground">Loading shopping list...</p>
          ) : items.length === 0 ? (
            <p className="text-muted-foreground">No foods pending from future planned meals.</p>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.foodId} className="border rounded-md p-3 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="font-medium">{item.foodName}</p>
                    <p className="text-sm text-muted-foreground">
                      Total quantity: {item.totalQuantity} · Purchased: {item.purchasedQuantity} · {item.kCal} kcal/unit
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Planned meals: {item.entries.map((e) => `${e.meal.name} (${formatPlannedFor(e.plannedFor)})`).join(', ')}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Checkbox
                      checked={item.isPurchased}
                      onCheckedChange={(checked) => handleToggle(item, checked === true)}
                    />
                    <span className="text-sm">Bought</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Planned meals</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading planned meals...</p>
          ) : plannedMeals.length === 0 ? (
            <p className="text-muted-foreground">No planned meals found in this date range.</p>
          ) : (
            <div className="space-y-3">
              {plannedMeals.map((meal) => (
                <div key={meal.PlannedMealID} className="border rounded-md p-3 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="font-medium">{meal.meal.name}</p>
                    <p className="text-sm text-muted-foreground">Planned for: {formatPlannedFor(meal.plannedFor)}</p>
                    {meal.resolutionNote && (
                      <p className="text-xs text-muted-foreground">Reschedule Note: {meal.resolutionNote}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => handleEdit(meal)}>
                      Modify
                    </Button>
                    <Button type="button" variant="destructive" size="sm" onClick={() => handleRemove(meal)} disabled={isMutatingPlannedMeal}>
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <RegisterMealModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingMeal(null);
        }}
        onSubmit={handleEditSubmit}
        mode="edit"
        initialMealId={editingMeal?.mealId}
        initialMeal={editingMeal ? buildFallbackMealForEdit(editingMeal) : null}
        initialDateTime={editingMeal?.plannedFor}
        initialPortions={editingMeal ? getPortionsForEdit(editingMeal) : null}
        title="Modify Planned Meal"
        description="Update the meal, date, or portions for this planned item."
        submitLabel={isMutatingPlannedMeal ? 'Saving...' : 'Save Changes'}
      />

      <ConfirmationModal
        isOpen={!!mealPendingDelete}
        onClose={() => {
          if (!isMutatingPlannedMeal) {
            setMealPendingDelete(null);
          }
        }}
        onConfirm={confirmRemove}
        type="danger"
        title="Remove planned meal?"
        message={mealPendingDelete
          ? `This will remove "${mealPendingDelete.meal.name}" from your planned meals and update the shopping list immediately.`
          : 'This action will remove the selected planned meal.'}
        confirmText="Remove"
        cancelText="Keep"
        isLoading={isMutatingPlannedMeal}
      />
    </div>
  );
}

export default function ShoppingListPage() {
  return (
    <Suspense fallback={<div className="container mx-auto p-6 text-muted-foreground">Loading shopping list...</div>}>
      <ShoppingListContent />
    </Suspense>
  );
}
