'use client';

import { useUser } from '@/lib/contexts/UserContext';
import { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/lib/config/api';
import { Card } from './ui/card';
import { Clock, Users, ChefHat } from 'lucide-react';
import { AddFoodForm } from './user-add-meal-form';
import { AddFoodModal } from './add-food-user-modal';

interface Meal {
    MealID: number;
    name: string;
    description?: string;
    preparationTime?: number;
    servings?: number;
    createdAt?: string;
    // Add other meal properties as needed
    [key: string]: unknown;
}

export function UserMeals() {
    const { userData } = useUser();
    const [meals, setMeals] = useState<Meal[]>([]);
    const [loadingMeals, setLoadingMeals] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const profile = userData.profile;

        const fetchUserMeals = async () => {
            if (profile && profile.id) {
                try {
                    setLoadingMeals(true);
                    setError(null);

                    // Use the user endpoint with profileId as query parameter
                    const response = await fetch(`${API_BASE_URL}/meals/user?profileId=${profile.id}`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });

                    if (response.ok) {
                        const mealsData = await response.json();
                        setMeals(Array.isArray(mealsData) ? mealsData : []);
                    } else {
                        const errorData = await response.json().catch(() => ({}));
                        const errorMessage = errorData.error || `Server error (${response.status})`;
                        setError(`Failed to load meals: ${errorMessage}`);
                        return;
                    }
                } catch (error) {
                    console.error('Error fetching user meals:', error);
                    setError('Failed to load meals');
                    setMeals([]);
                } finally {
                    setLoadingMeals(false);
                }
            } else {
                setLoadingMeals(false);
            }
        };
        useEffect(() => {
        fetchUserMeals();
    }, [profile]);

    if (loadingMeals) {
        return (
            <div className="space-y-4">
                <h2 className="text-xl font-semibold text-amber-200">Your Meals</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-32 bg-amber-700/30 rounded-lg animate-pulse"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-4">
                <h2 className="text-xl font-semibold text-amber-200">Your Meals</h2>
                <div className="text-center py-12 bg-red-900/20 rounded-lg border border-red-700/50">
                    <div className="text-red-400 mb-4">
                        <svg className="mx-auto h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <p className="text-lg font-medium">Unable to load meals</p>
                        <p className="text-sm text-red-300 mt-1">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-amber-200">Your Meals</h2>
                <span className="text-sm text-gray-400">
                    {meals.length} meal{meals.length !== 1 ? 's' : ''}
                </span>
            </div>

            <div className="flex justify-end mb-4">
                <AddFoodModal onFoodAdded={fetchUserMeals} />
            </div>

            
            {meals.length === 0 ? (
                <div className="text-center py-12 bg-amber-900/20 rounded-lg border-2 border-dashed border-amber-700/50">
                    <ChefHat className="mx-auto h-12 w-12 text-amber-600 mb-4" />
                    <h3 className="text-lg font-medium text-amber-200 mb-2">No meals created yet</h3>
                    <p className="text-gray-400 mb-4">
                        Start creating delicious meals with your favorite foods!
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {meals.map((meal) => (
                        <Card
                            key={meal.MealID}
                            className="bg-amber-800/30 border-amber-700/50 hover:bg-amber-700/40 transition-colors cursor-pointer"
                        >
                            <div className="p-4">
                                <h3 className="font-semibold text-amber-200 mb-2 line-clamp-1">
                                    {meal.name}
                                </h3>
                                {meal.description && (
                                    <p className="text-sm text-gray-300 mb-3 line-clamp-2">
                                        {meal.description}
                                    </p>
                                )}
                                <div className="flex items-center gap-4 text-xs text-gray-400">
                                    {meal.preparationTime && (
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            <span>{meal.preparationTime} min</span>
                                        </div>
                                    )}
                                    {meal.servings && (
                                        <div className="flex items-center gap-1">
                                            <Users className="w-3 h-3" />
                                            <span>{meal.servings} serving{meal.servings !== 1 ? 's' : ''}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}