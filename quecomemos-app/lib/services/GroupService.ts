'use client';

import { API_BASE_URL } from '@/lib/config/api';
import { authFetch } from '@/lib/utils/authFetch';
import { Meal } from '@/lib/contexts/MealsContext';

export interface GroupDietaryInfo {
  groupId: number;
  groupName: string;
  memberCount: number;
  preferences: Array<{
    PreferenceID: number;
    name: string;
  }>;
  dietaryRestrictions: Array<{
    DietaryRestrictionID: number;
    name: string;
  }>;
}

export interface GroupFilteredMeals {
  groupId: number;
  groupName: string;
  memberCount: number;
  appliedRestrictions: Array<{
    DietaryRestrictionID: number;
    name: string;
  }>;
  availableMeals: Meal[];
}

export async function fetchGroupDietaryInfo(groupId: string): Promise<GroupDietaryInfo | null> {
  try {
    const response = await authFetch(`${API_BASE_URL}/groups/${groupId}/dietary-info`, {
      headers: {
        'Content-Type': 'application/json'
      }
    }, {
      tokenErrorMessage: 'No authentication token'
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Failed to fetch group dietary info');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching group dietary info:', error);
    return null;
  }
}

export async function fetchGroupFilteredMeals(groupId: string): Promise<GroupFilteredMeals | null> {
  try {
    const response = await authFetch(`${API_BASE_URL}/meal-consumptions/groups/${groupId}/filtered-meals`, {
      headers: {
        'Content-Type': 'application/json'
      }
    }, {
      tokenErrorMessage: 'No authentication token'
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Failed to fetch group filtered meals');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching group filtered meals:', error);
    return null;
  }
}