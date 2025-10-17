'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Activity, Info, UtensilsCrossed, ChefHat } from 'lucide-react';
import { useUser } from '@/lib/contexts/UserContext';
import { useMeals } from '@/lib/contexts/MealsContext';
import { useGlobalNotification } from '@/lib/contexts/NotificationContext';
import { RegisterMealModal } from '@/components/modals';
import { API_BASE_URL } from '@/lib/config/api';

interface Consumption {
  ConsumptionID: number;
  name: string;
  consumedAt: string;
}

interface Group {
  GroupID: number;
  name: string;
  description?: string;
  consumptions?: Consumption[];
}

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;

  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRegisterMealModalOpen, setIsRegisterMealModalOpen] = useState(false);

  // Context hooks
  const { userData } = useUser();
  const { getMealById } = useMeals();
  const { showSuccess, showError } = useGlobalNotification();

  const fetchGroup = useCallback(async () => {
    try {
      setLoading(true);
      console.debug('Fetching group', `${API_BASE_URL}/groups/${groupId}`);
      const res = await fetch(`${API_BASE_URL}/groups/${groupId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      console.debug('Group payload', data);
      setGroup(data);
    } catch (err) {
      console.debug('Error fetching group', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchGroup();
  }, [fetchGroup]);

  const formatDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

  const goInfo = () => router.push(`/protected/groups/${groupId}/info`);
  const goHistory = () => router.push(`/protected/groups/${groupId}/history`);

  // RegisterMealModal handlers
  const openRegisterMealModal = () => {
    setIsRegisterMealModalOpen(true);
  };

  const closeRegisterMealModal = () => {
    setIsRegisterMealModalOpen(false);
  };

  const handleRegisterGroupMeal = async (mealData: { mealId: number; date: string }) => {
    try {
      if (!userData?.profile) {
        showError('Authentication Required', 'Please make sure you are logged in to register a meal.');
        return;
      }

      if (!group) {
        showError('Group Not Found', 'Group information is not available.');
        return;
      }

      // Get the meal information from context
      const meal = getMealById(mealData.mealId);
      const mealName = meal?.name || `Meal #${mealData.mealId}`;

      const consumptionData = {
        name: mealName,
        description: `Group meal consumed on ${mealData.date}`,
        meals: [{
          mealId: mealData.mealId,
          quantity: 1
        }],
        profileId: userData.profile.id,
        groupId: parseInt(groupId),
        consumedAt: mealData.date
      };

      const response = await fetch('http://localhost:3005/consumptions/group', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(consumptionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to register group meal consumption');
      }

      const consumption = await response.json();
      console.log('Group meal consumption registered successfully:', consumption);
      
      showSuccess(
        'Group Meal Registered Successfully!', 
        `"${mealName}" has been recorded for ${group.name} on ${mealData.date}.`
      );
      
      closeRegisterMealModal();
      
      // Refresh group data to update consumption list
      await fetchGroup();
      
    } catch (error) {
      console.error('Error registering group meal consumption:', error);
      showError(
        'Registration Failed',
        error instanceof Error ? error.message : 'An unexpected error occurred while registering the group meal. Please try again.'
      );
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          <div className="h-8 bg-muted animate-pulse rounded" />
          <div className="h-64 bg-muted animate-pulse rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center space-x-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="p-2">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold">Error</h1>
        </div>
        <Card>
          <CardContent>
            <p className="text-destructive">{error}</p>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" onClick={() => router.back()}>
                Back
              </Button>
              <Button onClick={fetchGroup}>Retry</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:space-x-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="p-2 self-start">
          <ArrowLeft className="w-4 h-4" />
        </Button>

        <div className="flex-1">
          <h1 className="text-3xl font-bold">{group?.name}</h1>
          {group?.description && <p className="text-muted-foreground mt-1">{group.description}</p>}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={openRegisterMealModal} className="w-full sm:w-auto">
            <ChefHat className="w-4 h-4 mr-2" /> Register Group Meal
          </Button>
          <Button variant="outline" onClick={goInfo} className="w-full sm:w-auto">
            <Info className="w-4 h-4 mr-2" /> Group information
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 mr-2" /> Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {group?.consumptions && group.consumptions.length > 0 ? (
              <div className="space-y-3">
                {/* Scrollable container for activities */}
                <div className="max-h-80 overflow-y-auto pr-2 space-y-3">
                  {group!.consumptions!.slice(0, 10).map((c) => (
                    <div key={c.ConsumptionID} className="border-l-4 border-primary pl-4 py-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{c.name}</p>
                          <p className="text-sm text-muted-foreground">{formatDate(c.consumedAt)}</p>
                        </div>
                        <div className="flex items-center text-muted-foreground">
                          <ChefHat className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* View more button */}
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    {group!.consumptions!.length > 10 && (
                      <p className="text-sm text-muted-foreground">
                        Showing 10 of {group!.consumptions!.length} activities
                      </p>
                    )}
                    <Button variant="outline" size="sm" onClick={goHistory} className="ml-auto">
                      View Complete History
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No recent activity</h3>
                <p className="text-muted-foreground mb-4">Meals consumed by the group will appear here</p>
                <Button variant="outline" onClick={openRegisterMealModal}>
                  <ChefHat className="w-4 h-4 mr-2" />
                  Register First Group Meal
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UtensilsCrossed className="w-5 h-5 mr-2" /> Group Meals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <UtensilsCrossed className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Group meals</h3>
              <p className="text-muted-foreground mb-4">Register and track meals consumed by this group</p>
              <Button onClick={openRegisterMealModal}>
                <ChefHat className="w-4 h-4 mr-2" />
                Register Group Meal
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Register Meal Modal */}
      <RegisterMealModal
        isOpen={isRegisterMealModalOpen}
        onClose={closeRegisterMealModal}
        onSubmit={handleRegisterGroupMeal}
      />
    </div>
  );
}