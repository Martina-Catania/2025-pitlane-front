'use client';

import { API_BASE_URL } from '@/lib/config/api';
import { authFetch } from '@/lib/utils/authFetch';

export interface Preference {
  PreferenceID: number;
  name: string;
}

export interface DietaryRestriction {
  DietaryRestrictionID: number;
  name: string;
}

export async function fetchAllPreferences(): Promise<Preference[]> {
  try {
    const response = await authFetch(`${API_BASE_URL}/preferences`, {
      headers: {
        'Content-Type': 'application/json'
      }
    }, {
      tokenErrorMessage: 'No authentication token'
    });

    if (!response.ok) {
      throw new Error('Failed to fetch preferences');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching preferences:', error);
    return [];
  }
}

export async function fetchAllDietaryRestrictions(): Promise<DietaryRestriction[]> {
  try {
    const response = await authFetch(`${API_BASE_URL}/dietary-restrictions`, {
      headers: {
        'Content-Type': 'application/json'
      }
    }, {
      tokenErrorMessage: 'No authentication token'
    });

    if (!response.ok) {
      throw new Error('Failed to fetch dietary restrictions');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching dietary restrictions:', error);
    return [];
  }
}