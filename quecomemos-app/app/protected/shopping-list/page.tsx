'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/contexts/UserContext';
import { useGlobalNotification } from '@/lib/contexts/NotificationContext';
import { PlannedMealsService, ShoppingListItem } from '@/lib/services/PlannedMealsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

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
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<ShoppingDateRange>('all');

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

  const fetchList = async () => {
    if (!profileId) {
      return;
    }

    try {
      setLoading(true);
      const list = await PlannedMealsService.getShoppingList({
        profileId: groupId ? undefined : profileId,
        groupId,
        includePurchased: true,
        startDate: dateRangePayload.startDate,
        endDate: dateRangePayload.endDate
      });
      setItems(list);
    } catch (error) {
      showError('Failed to load shopping list', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [profileId, groupId, dateRangePayload.startDate, dateRangePayload.endDate]);

  const handleToggle = async (item: ShoppingListItem, checked: boolean) => {
    if (!profileId) {
      return;
    }

    try {
      await PlannedMealsService.updateShoppingStatus({
        profileId: groupId ? profileId : profileId,
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
