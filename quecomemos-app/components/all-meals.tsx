'use client';

import { useEffect, useState } from 'react';
import { ChefHat } from 'lucide-react';
import { MealModal } from './ui/meal-modal';
import { EditMealForm } from './ui/EditMealForm';
import { useUser } from '@/lib/contexts/UserContext';
import { useMeals, Meal } from '@/lib/contexts/MealsContext';
import { MealCard } from './meal';
import { RegisterMealModal } from './ui/registerMealModal';
import { useGlobalNotification } from '@/lib/contexts/NotificationContext';

export function AllMeals() {
    const { userData } = useUser();
    const { showSuccess, showError } = useGlobalNotification();
    const {
        meals,
        recommendedMeals,
        loadingMeals,
        loadingRecommended,
        error,
        recommendedError,
        fetchAllMeals,
        fetchRecommendedMeals,
        refetchMeals,
        getMealById
    } = useMeals();
    
    const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
    const [isMealModalOpen, setIsMealModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isRegisterMealModalOpen, setIsRegisterMealModalOpen] = useState(false);

    const profile = userData?.profile;
    const userPreferences = userData?.preferences;

    useEffect(() => {
        if (profile) {
            fetchAllMeals(profile.id);
            if (userPreferences && userPreferences.hasPreferences) {
                fetchRecommendedMeals(profile.id);
            }
        }
    }, [profile, userPreferences, fetchAllMeals, fetchRecommendedMeals]);

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
        if (profile) {
            await refetchMeals(profile.id);
        }
        closeEditModal();
    };

    const openRegisterMealModal = () => {
        setIsRegisterMealModalOpen(true);
    };

    const closeRegisterMealModal = () => {
        setIsRegisterMealModalOpen(false);
    };

    const handleRegisterMeal = async (mealData: { mealId: number; date: string }) => {
        try {
            if (!profile) {
                showError('Authentication Required', 'Please make sure you are logged in to register a meal.');
                return;
            }

            // Get the meal information from context
            const meal = getMealById(mealData.mealId);
            const mealName = meal?.name || `Meal #${mealData.mealId}`;

            const consumptionData = {
                name: mealName,
                description: `Registered meal consumed on ${mealData.date}`,
                meals: [{
                    mealId: mealData.mealId,
                    quantity: 1
                }],
                profileId: profile.id,
                consumedAt: mealData.date
            };

            const response = await fetch('http://localhost:3005/consumptions/individual', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(consumptionData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to register meal consumption');
            }

            const consumption = await response.json();
            console.log('Meal consumption registered successfully:', consumption);
            
            showSuccess(
                'Meal Registered Successfully!', 
                `"${mealName}" has been recorded for ${mealData.date}.`
            );
            
            closeRegisterMealModal();
        } catch (error) {
            console.error('Error registering meal consumption:', error);
            showError(
                'Registration Failed',
                error instanceof Error ? error.message : 'An unexpected error occurred while registering your meal. Please try again.'
            );
        }
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
        <div >
            {/* Recommended Meals Section */}
            {userPreferences && userPreferences.hasPreferences && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-amber-200">Recommended for You</h2>
                        <span className="text-sm text-gray-400">
                            Based on your preferences
                        </span>
                    </div>

                    <div className="mb-4">
                        <button
                            onClick={openRegisterMealModal}
                            className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-200"
                        >
                            Do you want to register a meal you ate?
                        </button>
                    </div>

                    {loadingRecommended ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="h-32 bg-amber-700/30 rounded-lg animate-pulse"></div>
                            ))}
                        </div>
                    ) : recommendedError ? (
                        <div className="text-center py-8 bg-red-900/20 rounded-lg border border-red-700/50">
                            <div className="text-red-400">
                                <p className="text-sm">{recommendedError}</p>
                            </div>
                        </div>
                    ) : recommendedMeals.length === 0 ? (
                        <div className="text-center py-8 bg-amber-900/20 rounded-lg border border-amber-700/50">
                            <ChefHat className="mx-auto h-8 w-8 text-amber-600 mb-2" />
                            <p className="text-amber-200 text-sm">No recommended meals found</p>
                            <p className="text-gray-400 text-xs mt-1">
                                Try creating meals with your preferred foods!
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {recommendedMeals.slice(0, 6).map((meal) => (
                                <MealCard
                                    key={meal.MealID}
                                    meal={meal}
                                    onClick={handleMealClick}
                                    showExtendedInfo={true}
                                    maxFoodsToShow={3}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Community Meals Section */}
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
                        <MealCard
                            key={meal.MealID}
                            meal={meal}
                            onClick={handleMealClick}
                            showExtendedInfo={false}
                            maxFoodsToShow={3}
                        />
                    ))}
                </div>
            )}
            </div>

            {/* Meal Details Modal */}
            <MealModal 
                meal={selectedMeal}
                isOpen={isMealModalOpen}
                onClose={closeMealModal}
                onEdit={handleEditMeal}
            />
            
            {/* Register Meal Modal */}
            <RegisterMealModal
                isOpen={isRegisterMealModalOpen}
                onClose={closeRegisterMealModal}
                onSubmit={handleRegisterMeal}
            />

            {/* Edit Meal Modal */}
            {isEditModalOpen && selectedMeal && (
                <div className="fixed inset-0 z-[85] flex items-center justify-center p-4" role="dialog" aria-modal="true">
                    {/* Overlay */}
                    <div
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm z-[85]"
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