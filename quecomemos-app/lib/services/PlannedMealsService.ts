'use client';

import { createClient } from '@/lib/supabase/client';
import { API_BASE_URL } from '@/lib/config/api';

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
  status: 'scheduled' | 'awaiting_confirmation' | 'consumed' | 'rescheduled' | 'cancelled';
  estimatedKcal: number;
  meal: {
    MealID: number;
    name: string;
    description?: string;
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

async function getAuthHeaders() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('Authentication required');
  }

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.access_token}`
  };
}

export class PlannedMealsService {
  static async createPlannedMeal(payload: {
    profileId: string;
    mealId: number;
    groupId?: number;
    plannedFor: string;
    resolutionNote?: string;
  }): Promise<PlannedMeal> {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_BASE_URL}/planned-meals`, {
      method: 'POST',
      headers,
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
  }): Promise<PlannedMeal[]> {
    const headers = await getAuthHeaders();
    const query = new URLSearchParams();

    if (params.profileId) query.set('profileId', params.profileId);
    if (params.groupId) query.set('groupId', String(params.groupId));
    if (params.onlyFuture) query.set('onlyFuture', 'true');
    if (params.onlyOverdue) query.set('onlyOverdue', 'true');

    const response = await fetch(`${API_BASE_URL}/planned-meals?${query.toString()}`, {
      headers
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to fetch planned meals');
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
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_BASE_URL}/planned-meals/${plannedMealId}/resolve`, {
      method: 'PUT',
      headers,
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
    const headers = await getAuthHeaders();
    const query = new URLSearchParams();

    if (params.profileId) query.set('profileId', params.profileId);
    if (params.groupId) query.set('groupId', String(params.groupId));
    query.set('includePurchased', params.includePurchased === false ? 'false' : 'true');
    if (params.startDate) query.set('startDate', params.startDate);
    if (params.endDate) query.set('endDate', params.endDate);

    const response = await fetch(`${API_BASE_URL}/planned-meals/shopping/list?${query.toString()}`, {
      headers
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
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_BASE_URL}/planned-meals/shopping/status`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to update shopping status');
    }

    return response.json();
  }
}
