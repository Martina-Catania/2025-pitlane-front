'use client';

import { PlannedMealsService } from '@/lib/services/PlannedMealsService';
import { API_BASE_URL } from '@/lib/config/api';
import { getAccessTokenOrThrow } from '@/lib/utils/authFetch';

export interface RegisterMealData {
  mealId: number;
  date: string;
}

export interface MealRegistrationResult {
  success: boolean;
  planned?: boolean;
  consumption?: {
    ConsumptionID: number;
    name: string;
    description?: string;
    consumedAt: string;
    profileId?: string;
    totalKcal?: number;
  };
  error?: string;
}

export class MealService {
  /**
   * Register an individual meal consumption
   */
  static async registerIndividualMeal(
    mealData: RegisterMealData,
    profileId: string,
    mealName: string,
    triggerCalorieRefresh?: () => void
  ): Promise<MealRegistrationResult> {
    try {
      console.log('Attempting to register meal:', mealData);

      const targetDate = new Date(mealData.date);
      if (!Number.isNaN(targetDate.getTime()) && targetDate > new Date()) {
        await PlannedMealsService.createPlannedMeal({
          profileId,
          mealId: mealData.mealId,
          plannedFor: targetDate.toISOString()
        });

        return {
          success: true,
          planned: true
        };
      }

      let accessToken: string;
      try {
        accessToken = await getAccessTokenOrThrow('Authentication required. Please log in to register meals.');
      } catch {
        return {
          success: false,
          error: 'Authentication required. Please log in to register meals.'
        };
      }

      console.log('Registering meal:', {
        mealId: mealData.mealId,
        date: mealData.date,
        profileId: profileId,
        mealName: mealName
      });

      const description = `Consumption of ${mealName} at ${new Date(mealData.date).toLocaleString()}`;

      const response = await fetch(`${API_BASE_URL}/meal-consumptions/individual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          name: description,
          description: description,
          profileId: profileId,
          mealId: mealData.mealId,
          consumedAt: mealData.date
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to register meal: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Meal registered successfully:', result);

      // Trigger calorie progress refresh if callback provided
      if (triggerCalorieRefresh) {
        triggerCalorieRefresh();
      }

      return {
        success: true,
        consumption: result
      };
    } catch (error) {
      console.error('Error registering meal:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred.'
      };
    }
  }

  /**
   * Register a group meal consumption
   */
  static async registerGroupMeal(
    mealData: RegisterMealData,
    profileId: string,
    groupId: number,
    mealName: string,
    triggerCalorieRefresh?: () => void
  ): Promise<MealRegistrationResult> {
    try {
      console.log('Attempting to register group meal:', mealData);

      const targetDate = new Date(mealData.date);
      if (!Number.isNaN(targetDate.getTime()) && targetDate > new Date()) {
        await PlannedMealsService.createPlannedMeal({
          profileId,
          groupId,
          mealId: mealData.mealId,
          plannedFor: targetDate.toISOString()
        });

        return {
          success: true,
          planned: true
        };
      }

      let accessToken: string;
      try {
        accessToken = await getAccessTokenOrThrow('Authentication required. Please log in to register meals.');
      } catch {
        return {
          success: false,
          error: 'Authentication required. Please log in to register meals.'
        };
      }

      const description = `Group consumption of ${mealName} at ${new Date(mealData.date).toLocaleString()}`;

      const response = await fetch(`${API_BASE_URL}/meal-consumptions/group`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          name: description,
          description: description,
          profileId: profileId,
          groupId: groupId,
          mealId: mealData.mealId,
          consumedAt: mealData.date
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to register group meal: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Group meal registered successfully:', result);

      // Trigger calorie progress refresh if callback provided
      if (triggerCalorieRefresh) {
        triggerCalorieRefresh();
      }

      return {
        success: true,
        consumption: result
      };
    } catch (error) {
      console.error('Error registering group meal:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred.'
      };
    }
  }
}