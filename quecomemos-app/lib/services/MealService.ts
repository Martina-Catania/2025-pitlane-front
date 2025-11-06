'use client';

import { createClient } from '@/lib/supabase/client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export interface RegisterMealData {
  mealId: number;
  date: string;
  portions?: {
    portionFraction: number;
    foodPortions: Array<{
      foodId: number;
      portionFraction: number;
      absoluteQuantity?: number;
    }>;
  };
}

export interface MealRegistrationResult {
  success: boolean;
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

      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        return {
          success: false,
          error: 'Authentication required. Please log in to register meals.'
        };
      }

      console.log('Registering meal:', {
        mealId: mealData.mealId,
        date: mealData.date,
        portions: mealData.portions,
        profileId: profileId,
        mealName: mealName
      });

      // Calculate quantity based on portions (default to 1 for full meal)
      const quantity = mealData.portions?.portionFraction || 1;
      const description = `Consumption of ${mealName} at ${new Date(mealData.date).toLocaleString()}`;

      const response = await fetch(`${API_BASE_URL}/consumptions/individual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          name: description,
          description: description,
          profileId: profileId,
          meals: [{
            mealId: mealData.mealId,
            quantity: quantity
          }],
          consumedAt: mealData.date,
          portions: mealData.portions || null
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

      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        return {
          success: false,
          error: 'Authentication required. Please log in to register meals.'
        };
      }

      // Calculate quantity based on portions (default to 1 for full meal)
      const quantity = mealData.portions?.portionFraction || 1;
      const description = `Group consumption of ${mealName} at ${new Date(mealData.date).toLocaleString()}`;

      const response = await fetch(`${API_BASE_URL}/consumptions/group`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          name: description,
          description: description,
          profileId: profileId,
          groupId: groupId,
          meals: [{
            mealId: mealData.mealId,
            quantity: quantity
          }],
          consumedAt: mealData.date,
          portions: mealData.portions || null
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