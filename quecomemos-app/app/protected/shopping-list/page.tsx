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

function ShoppingListContent() {
  const { userData } = useUser();
  const { showError, showSuccess } = useGlobalNotification();
  const router = useRouter();
  const searchParams = useSearchParams();
  const groupIdParam = searchParams.get('groupId');
  const groupId = groupIdParam ? parseInt(groupIdParam) : undefined;

  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const profileId = userData.profile?.id;

  const title = useMemo(() => {
    return groupId ? 'Group shopping list' : 'My shopping list';
  }, [groupId]);

  const fetchList = async () => {
    if (!profileId) {
      return;
    }

    try {
      setLoading(true);
      const list = await PlannedMealsService.getShoppingList({
        profileId: groupId ? undefined : profileId,
        groupId,
        includePurchased: true
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
  }, [profileId, groupId]);

  const handleToggle = async (item: ShoppingListItem, checked: boolean) => {
    if (!profileId) {
      return;
    }

    try {
      await PlannedMealsService.updateShoppingStatus({
        profileId: groupId ? profileId : profileId,
        groupId,
        foodId: item.foodId,
        isPurchased: checked
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
          <CardTitle>Foods to buy</CardTitle>
        </CardHeader>
        <CardContent>
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
                      Planned meals: {item.entries.map((e) => e.meal.name).join(', ')}
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
