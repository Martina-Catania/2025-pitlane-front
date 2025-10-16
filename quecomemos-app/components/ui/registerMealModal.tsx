'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { X, Plus } from 'lucide-react';
import AddMealForm from '@/components/meal/AddMealForm';
import { useMeals, Meal } from '@/lib/contexts/MealsContext';
import { useUser } from '@/lib/contexts/UserContext';

interface RegisterMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (mealData: { mealId: number; date: string }) => void;
}

export function RegisterMealModal({ isOpen, onClose, onSubmit }: RegisterMealModalProps) {
  const { userData } = useUser();
  const { allMeals, refetchMeals } = useMeals();
  console.log('All meals from context:', allMeals);
  
  // Form state
  const [selectedMealId, setSelectedMealId] = useState<string>('');
  const [mealDate, setMealDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Create new meal state
  const [showCreateMeal, setShowCreateMeal] = useState(false);

  const profile = userData?.profile;

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!selectedMealId || !mealDate) {
      setError('Please select a meal and a date.');
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({ mealId: parseInt(selectedMealId, 10), date: mealDate });
      handleClose();
    } catch {
      setError('Failed to register meal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle modal close and reset form
  const handleClose = useCallback(() => {
    setSelectedMealId('');
    setMealDate('');
    setError(null);
    setShowCreateMeal(false);
    onClose();
  }, [onClose]);

  // Handle closing the AddMealForm
  const handleCloseAddMealForm = () => {
    setShowCreateMeal(false);
    setError(null);
  };

  // Handle when a new meal is successfully created
  const handleMealAdded = async (newMeal: any) => {
    // Refresh meals from context to get the newly created meal
    if (profile?.id) {
      await refetchMeals(profile.id);
    }
    
    // Seleccionar automáticamente la nueva comida si tiene ID
    if (newMeal && (newMeal.MealID || newMeal.id)) {
      const mealId = newMeal.MealID || newMeal.id;
      setSelectedMealId(mealId.toString());
    }
    
    // Volver al formulario principal
    setShowCreateMeal(false);
    setError(null);
  };

  // Close modal with ESC key and prevent body scroll
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showCreateMeal) {
          setShowCreateMeal(false);
        } else {
          handleClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, showCreateMeal, handleClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      {/* Modal Container */}
      <div className="relative w-full max-w-4xl bg-neutral-900 rounded-2xl shadow-2xl border border-amber-800/30 overflow-hidden max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-amber-800/30">
          <div>
            <h2 className="text-xl font-bold text-amber-100">
              {showCreateMeal ? 'Create New Meal' : 'Register a Meal'}
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              {showCreateMeal 
                ? 'Add a new meal to the community and register it' 
                : `Record a meal you've eaten from our community recipes`
              }
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 text-amber-200 hover:text-amber-100 hover:bg-amber-800/20 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6">
          {!showCreateMeal ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Error Message */}
              {error && (
                <div className="p-3 text-red-400 bg-red-900/20 border border-red-800/50 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Meal Selection */}
              <div className="space-y-3">
                <label htmlFor="mealId" className="block text-sm font-medium text-amber-200">
                  Choose a Meal <span className="text-red-400">*</span>
                </label>
                <select
                  id="mealId"
                  name="mealId"
                  value={selectedMealId}
                  onChange={(e) => setSelectedMealId(e.target.value)}
                  className="w-full px-4 py-3 bg-neutral-800 text-gray-100 border border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors"
                  required
                  disabled={isSubmitting}
                >
                  <option value="" disabled>
                    Select a meal from the community
                  </option>
                  {allMeals.map((meal) => (
                    <option key={meal.MealID} value={meal.MealID}>
                      {meal.name}
                      {meal.description && ` - ${meal.description.substring(0, 50)}${meal.description.length > 50 ? '...' : ''}`}
                    </option>
                  ))}
                </select>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    Choose from {allMeals.length} available community meals
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowCreateMeal(true)}
                    className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    Can&apos;t find your meal? Create it
                  </button>
                </div>
              </div>

              {/* Date Selection */}
              <div className="space-y-3">
                <label htmlFor="mealDate" className="block text-sm font-medium text-amber-200">
                  Date Consumed <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  id="mealDate"
                  name="mealDate"
                  value={mealDate}
                  onChange={(e) => setMealDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]} // Prevent future dates
                  className="w-full px-4 py-3 bg-neutral-800 text-gray-100 border border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors"
                  required
                  disabled={isSubmitting}
                />
                <p className="text-xs text-gray-500">
                  When did you eat this meal?
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-3 text-gray-300 bg-neutral-700 hover:bg-neutral-600 rounded-lg transition-colors font-medium"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting || !selectedMealId || !mealDate}
                >
                  {isSubmitting ? 'Registering...' : 'Register Meal'}
                </button>
              </div>
            </form>
          ) : (
            /* AddMealForm Component */
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={handleCloseAddMealForm}
                  className="text-sm text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
                >
                  ← Back to meal selection
                </button>
              </div>
              
              <AddMealForm 
                onFoodAdded={(m: any) => handleMealAdded(m)}
                onClose={handleCloseAddMealForm}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}