'use client';

import { API_BASE_URL } from '@/lib/config/api';
import { authFetch } from '@/lib/utils/authFetch';

export interface PlannedMealFoodItem {
  PlannedMealFoodID: number;
  foodId: number;
  quantity: number;
  isPurchased: boolean;
  food: {
    FoodID: number;
    name: string;
    svgLink: string;
    kCal: number;
  };
}

export interface PlannedMeal {
  PlannedMealID: number;
  profileId: string;
  groupId?: number | null;
  mealId: number;
  plannedFor: string;
  resolutionNote?: string | null;
  status: 'scheduled' | 'awaiting_confirmation' | 'consumed' | 'rescheduled' | 'cancelled';
  estimatedKcal: number;
  meal: {
    MealID: number;
    name: string;
    description?: string;
    mealFoods?: Array<{
      foodId: number;
      quantity: number;
      food: {
        FoodID: number;
        name: string;
        kCal: number;
      };
    }>;
  };
  foodItems: PlannedMealFoodItem[];
}

export interface ShoppingListItem {
  foodId: number;
  foodName: string;
  svgLink: string;
  kCal: number;
  totalQuantity: number;
  purchasedQuantity: number;
  isPurchased: boolean;
  entries: Array<{
    plannedMealFoodId: number;
    plannedMealId: number;
    plannedFor: string;
    quantity: number;
    isPurchased: boolean;
    meal: {
      MealID: number;
      name: string;
    };
  }>;
}

export class PlannedMealsService {
  static async createPlannedMeal(payload: {
    profileId: string;
    mealId: number;
    groupId?: number;
    plannedFor: string;
    resolutionNote?: string;
  }): Promise<PlannedMeal> {
    const response = await authFetch(`${API_BASE_URL}/planned-meals`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to create planned meal');
    }

    return response.json();
  }

  static async getPlannedMeals(params: {
    profileId?: string;
    groupId?: number;
    onlyFuture?: boolean;
    onlyOverdue?: boolean;
    startDate?: string;
    endDate?: string;
    includeInactive?: boolean;
  }): Promise<PlannedMeal[]> {
    const query = new URLSearchParams();

    if (params.profileId) query.set('profileId', params.profileId);
    if (params.groupId) query.set('groupId', String(params.groupId));
    if (params.onlyFuture) query.set('onlyFuture', 'true');
    if (params.onlyOverdue) query.set('onlyOverdue', 'true');
    if (params.startDate) query.set('startDate', params.startDate);
    if (params.endDate) query.set('endDate', params.endDate);
    if (params.includeInactive) query.set('includeInactive', 'true');

    const response = await authFetch(`${API_BASE_URL}/planned-meals?${query.toString()}`, {
      cache: 'no-store'
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to fetch planned meals');
    }

    return response.json();
  }

  static async updatePlannedMeal(plannedMealId: number, payload: {
    requesterId: string;
    mealId?: number;
    plannedFor?: string;
    portions?: {
      portionFraction: number;
      foodPortions: Array<{
        foodId: number;
        portionFraction: number;
        absoluteQuantity?: number;
      }>;
    };
  }): Promise<PlannedMeal> {
    const response = await authFetch(`${API_BASE_URL}/planned-meals/${plannedMealId}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to update planned meal');
    }

    return response.json();
  }

  static async deletePlannedMeal(plannedMealId: number, payload: {
    requesterId: string;
  }): Promise<{ deleted: boolean; plannedMealId: number }> {
    const response = await authFetch(`${API_BASE_URL}/planned-meals/${plannedMealId}`, {
      method: 'DELETE',
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to delete planned meal');
    }

    return response.json();
  }

  static async resolvePlannedMeal(plannedMealId: number, payload: {
    requesterId: string;
    wasConsumed: boolean;
    action?: 'rescheduled' | 'cancelled';
    note?: string;
    newPlannedFor?: string;
  }): Promise<unknown> {
    const response = await authFetch(`${API_BASE_URL}/planned-meals/${plannedMealId}/resolve`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to resolve planned meal');
    }

    return response.json();
  }

  static async getShoppingList(params: {
    profileId?: string;
    groupId?: number;
    includePurchased?: boolean;
    startDate?: string;
    endDate?: string;
  }): Promise<ShoppingListItem[]> {
    const query = new URLSearchParams();

    if (params.profileId) query.set('profileId', params.profileId);
    if (params.groupId) query.set('groupId', String(params.groupId));
    query.set('includePurchased', params.includePurchased === false ? 'false' : 'true');
    if (params.startDate) query.set('startDate', params.startDate);
    if (params.endDate) query.set('endDate', params.endDate);

    const response = await authFetch(`${API_BASE_URL}/planned-meals/shopping/list?${query.toString()}`, {
      cache: 'no-store'
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to fetch shopping list');
    }

    return response.json();
  }

  static async updateShoppingStatus(payload: {
    profileId?: string;
    groupId?: number;
    foodId: number;
    isPurchased: boolean;
    startDate?: string;
    endDate?: string;
  }): Promise<unknown> {
    const response = await authFetch(`${API_BASE_URL}/planned-meals/shopping/status`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to update shopping status');
    }

    return response.json();
  }
}
