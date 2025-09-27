'use client';

import { useUser } from '@/lib/contexts/UserContext';
import { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/lib/config/api';
import { Card } from './ui/card';
import { Clock, Users, ChefHat } from 'lucide-react';

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

    useEffect(() => {
        const fetchUserMeals = async () => {
            if (profile && profile.id) {
                try {
                    setLoadingMeals(true);
                    setError(null);

                    // Assuming there's an endpoint to get meals by user
                    const response = await fetch(`${API_BASE_URL}/meals?profileId=${profile.id}`);

                    if (response.ok) {
                        const mealsData = await response.json();
                        setMeals(mealsData);
                    } else if (response.status === 404) {
                        // No meals found for user
                        setMeals([]);
                    } else {
                        throw new Error(`Error fetching meals: ${response.status}`);
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

        if (profile) {
            fetchUserMeals();
        }
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
                <div className="text-red-400 bg-red-900/20 p-4 rounded-lg">
                    {error}
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