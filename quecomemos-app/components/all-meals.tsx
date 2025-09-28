'use client';

import { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/lib/config/api';
import { Card } from './ui/card';
import { Clock, ChefHat, User } from 'lucide-react';

interface Meal {
    MealID: number;
    name: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
    profileId: string;
    profile: {
        username?: string;
        id: string;
        role: string;
    };
    foods: {
        FoodID: number;
        name: string;
        svgLink?: string;
    }[];
}

export function AllMeals() {
    const [meals, setMeals] = useState<Meal[]>([]);
    const [loadingMeals, setLoadingMeals] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAllMeals = async () => {
            try {
                setLoadingMeals(true);
                setError(null);

                // Fetch all meals from all users
                const response = await fetch(`${API_BASE_URL}/meals/all`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (response.ok) {
                    const mealsData = await response.json();
                    setMeals(mealsData);
                } else if (response.status === 404) {
                    // No meals found
                    setMeals([]);
                } else {
                    throw new Error(`Error fetching meals: ${response.status}`);
                }
            } catch (error) {
                console.error('Error fetching all meals:', error);
                setError(error instanceof Error ? error.message : 'An unknown error occurred');
            } finally {
                setLoadingMeals(false);
            }
        };

        fetchAllMeals();
    }, []);

    if (loadingMeals) {
        return (
            <div className="space-y-4">
                <h2 className="text-xl font-semibold text-amber-200">Community Meals</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-amber-800/30 border border-amber-700/50 rounded-lg p-4">
                            <div className="w-3/4 h-4 bg-gray-300 rounded animate-pulse mb-2"></div>
                            <div className="w-full h-3 bg-gray-200 rounded animate-pulse mb-2"></div>
                            <div className="w-1/2 h-3 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-4">
                <h2 className="text-xl font-semibold text-amber-200">Community Meals</h2>
                <div className="text-red-400 bg-red-900/20 p-4 rounded-lg">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-amber-200">Community Meals</h2>
                <span className="text-sm text-gray-400">
                    {meals.length} meal{meals.length !== 1 ? 's' : ''}
                </span>
            </div>

            {meals.length === 0 ? (
                <div className="text-center py-12 bg-amber-900/20 rounded-lg border-2 border-dashed border-amber-700/50">
                    <ChefHat className="mx-auto h-12 w-12 text-amber-600 mb-4" />
                    <h3 className="text-lg font-medium text-amber-200 mb-2">No meals created yet</h3>
                    <p className="text-gray-400 mb-4">
                        Be the first to create and share a delicious meal!
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {meals.map((meal) => (
                        <Card
                            key={meal.MealID}
                            className="bg-amber-800/30 border-amber-700/50 hover:bg-amber-700/40 transition-colors"
                        >
                            <div className="p-4">
                                <div className="flex items-start justify-between mb-2">
                                    <h3 className="font-semibold text-amber-200 mb-1 line-clamp-1 flex-1">
                                        {meal.name}
                                    </h3>
                                    <div className="flex items-center text-xs text-gray-400 ml-2">
                                        <User className="h-3 w-3 mr-1" />
                                        <span className="capitalize">{meal.profile.role}</span>
                                    </div>
                                </div>
                                
                                {meal.description && (
                                    <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                                        {meal.description}
                                    </p>
                                )}
                                
                                <div className="flex items-center gap-4 text-xs text-gray-400 mb-3">
                                    <div className="flex items-center">
                                        <Clock className="h-3 w-3 mr-1" />
                                        <span>{new Date(meal.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <ChefHat className="h-3 w-3 mr-1" />
                                        <span>{meal.foods.length} ingredient{meal.foods.length !== 1 ? 's' : ''}</span>
                                    </div>
                                </div>

                                {/* Created by */}
                                <div className="text-xs text-gray-400 mb-3">
                                    Created by: {meal.profile.username || 'Anonymous'}
                                </div>

                                {/* Foods in meal */}
                                {meal.foods.length > 0 && (
                                    <div className="border-t border-amber-700/30 pt-3">
                                        <div className="text-xs text-gray-400 mb-2">Ingredients:</div>
                                        <div className="flex flex-wrap gap-1">
                                            {meal.foods.slice(0, 3).map((food) => (
                                                <span
                                                    key={food.FoodID}
                                                    className="bg-amber-700/30 text-amber-200 px-2 py-1 rounded text-xs"
                                                >
                                                    {food.name}
                                                </span>
                                            ))}
                                            {meal.foods.length > 3 && (
                                                <span className="bg-amber-700/20 text-amber-300 px-2 py-1 rounded text-xs">
                                                    +{meal.foods.length - 3} more
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}