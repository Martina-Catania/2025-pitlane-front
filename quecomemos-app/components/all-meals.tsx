'use client';

import { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/lib/config/api';
import { Card } from './ui/card';
import { Clock, ChefHat, User } from 'lucide-react';
import { MealModal } from './ui/meal-modal';
import { EditMealForm } from './ui/EditMealForm';
import { useUser } from '@/lib/contexts/UserContext';

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
    mealFoods: {
        food: {
            FoodID: number;
            name: string;
            svgLink?: string;
            kCal: number;
            dietaryRestrictions?: { name?: string; DietaryRestrictionID?: number }[] | number[];
            preferences?: { name?: string; PreferenceID?: number }[] | number[];
        };
        quantity: number;
    }[];
}

export function AllMeals() {
    const { userData } = useUser();
    const [meals, setMeals] = useState<Meal[]>([]);
    const [loadingMeals, setLoadingMeals] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
    const [isMealModalOpen, setIsMealModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const profile = userData?.profile;

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
                    // Filter out current user's meals to show only community meals
                    const communityMeals = profile ? 
                        mealsData.filter((meal: Meal) => meal.profileId !== profile.id) : 
                        mealsData;
                    setMeals(communityMeals);
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

        if (profile) {
            fetchAllMeals();
        }
    }, [profile]);

    const handleMealClick = (meal: Meal) => {
        setSelectedMeal(meal);
        setIsMealModalOpen(true);
    };

    const closeMealModal = () => {
        setIsMealModalOpen(false);
        setSelectedMeal(null);
    };

    const handleEditMeal = (meal: Meal) => {
        closeMealModal();
        setSelectedMeal(meal);
        setIsEditModalOpen(true);
    };

    const closeEditModal = () => {
        setIsEditModalOpen(false);
        setSelectedMeal(null);
    };

    const handleEditSuccess = async () => {
        // Refetch meals after successful edit
        try {
            setLoadingMeals(true);
            setError(null);

            const response = await fetch(`${API_BASE_URL}/meals/all`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const mealsData = await response.json();
                setMeals(mealsData);
            }
        } catch (error) {
            console.error('Error refetching meals:', error);
        } finally {
            setLoadingMeals(false);
        }
        closeEditModal();
    };

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
                    <h3 className="text-lg font-medium text-amber-200 mb-2">No meals shared by other users</h3>
                    <p className="text-gray-400 mb-4">
                        Check back later to discover meals from the community!
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {meals.map((meal) => (
                        <Card
                            key={meal.MealID}
                            className="bg-amber-800/30 border-amber-700/50 hover:bg-amber-700/40 transition-colors cursor-pointer"
                            onClick={() => handleMealClick(meal)}
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
                                        <span>{meal.mealFoods?.length || 0} ingredient{(meal.mealFoods?.length || 0) !== 1 ? 's' : ''}</span>
                                    </div>
                                </div>

                                {/* Created by */}
                                <div className="text-xs text-gray-400 mb-3">
                                    Created by: {meal.profile.username || 'Anonymous'}
                                </div>

                                {/* Foods in meal */}
                                {meal.mealFoods && meal.mealFoods.length > 0 && (
                                    <div className="border-t border-amber-700/30 pt-3">
                                        <div className="text-xs text-gray-400 mb-2">Ingredients:</div>
                                        <div className="flex flex-wrap gap-1">
                                            {meal.mealFoods.slice(0, 3).map((mealFood) => (
                                                <span
                                                    key={mealFood.food.FoodID}
                                                    className="bg-amber-700/30 text-amber-200 px-2 py-1 rounded text-xs"
                                                >
                                                    {mealFood.food.name}
                                                </span>
                                            ))}
                                            {meal.mealFoods.length > 3 && (
                                                <span className="bg-amber-700/20 text-amber-300 px-2 py-1 rounded text-xs">
                                                    +{meal.mealFoods.length - 3} more
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

            {/* Meal Details Modal */}
            <MealModal 
                meal={selectedMeal}
                isOpen={isMealModalOpen}
                onClose={closeMealModal}
                onEdit={handleEditMeal}
            />

            {/* Edit Meal Modal */}
            {isEditModalOpen && selectedMeal && (
                <div className="fixed inset-0 z-[85] flex items-center justify-center p-4" role="dialog" aria-modal="true">
                    {/* Overlay */}
                    <div
                        className="absolute inset-0 bg-black/70 z-[85]"
                        onClick={closeEditModal}
                    />
                    {/* Content */}
                    <div
                        className="relative z-[86] w-full max-w-2xl bg-neutral-900 border border-amber-800/30 rounded-2xl shadow-2xl overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-amber-800/40">
                            <h3 className="text-amber-100 font-semibold">Edit Meal</h3>
                            <button
                                onClick={closeEditModal}
                                className="px-2 py-1 text-amber-200 hover:text-amber-50"
                                aria-label="Close modal"
                            >
                                ✖
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-4 max-h-[80vh] overflow-y-auto">
                            <EditMealForm
                                meal={selectedMeal}
                                onSuccess={handleEditSuccess}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}