'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { X, Plus, Search } from 'lucide-react';
import AddMealForm from '@/components/meal/AddMealForm';
import { useMeals } from '@/lib/contexts/MealsContext';
import { useUser } from '@/lib/contexts/UserContext';
import { useMealSearch } from '@/components/ui/hooks/useMealSearch';
import { API_BASE_URL } from '@/lib/config/api';

interface RegisterMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (mealData: { mealId: number; date: string }) => void;
}

export function RegisterMealModal({ isOpen, onClose, onSubmit }: RegisterMealModalProps) {
  const { userData } = useUser();
  const { allMeals, refetchMeals } = useMeals();
  
  // Meal search functionality
  const {
    query: mealQuery,
    setQuery: setMealQuery,
    results: searchResults,
    showDropdown: showMealDropdown,
    selected: selectedMeal,
    selectMeal,
    activeIndex: mealActiveIndex,
    resetSearch,
    handleKeyDown: handleMealKeyDown,
    canCreateNew: canCreateNewMeal,
    isLoadingMeals,
    searchRef
  } = useMealSearch({
    apiBase: API_BASE_URL,
    open: isOpen,
    initialMeals: allMeals
  });
  
  // Form state
  const [selectedMealId, setSelectedMealId] = useState<string>('');
  const [mealDate, setMealDate] = useState('');
  const [mealTime, setMealTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Create new meal state
  const [showCreateMeal, setShowCreateMeal] = useState(false);
  
  // Date/time selection mode
  const [useCurrentTime, setUseCurrentTime] = useState(true);
  const [showDateTimeSelection, setShowDateTimeSelection] = useState(false);

  const profile = userData?.profile;

  // Update selectedMealId when a meal is selected from search
  useEffect(() => {
    if (selectedMeal) {
      setSelectedMealId(selectedMeal.MealID.toString());
    } else {
      setSelectedMealId('');
    }
  }, [selectedMeal]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!selectedMealId) {
      setError('Please select a meal.');
      return;
    }

    // Validate date/time based on mode
    if (!useCurrentTime && (!mealDate || !mealTime)) {
      setError('Please select a date and time.');
      return;
    }

    setIsSubmitting(true);

    try {
      let finalDateTime: string;
      
      if (useCurrentTime) {
        // Use current date and time
        finalDateTime = new Date().toISOString();
      } else {
        // Combine selected date and time
        finalDateTime = new Date(`${mealDate}T${mealTime}`).toISOString();
      }

      await onSubmit({ mealId: parseInt(selectedMealId, 10), date: finalDateTime });
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
    setMealTime('');
    setError(null);
    setShowCreateMeal(false);
    setUseCurrentTime(true);
    setShowDateTimeSelection(false);
    resetSearch();
    onClose();
  }, [onClose, resetSearch]);

  // Handle closing the AddMealForm
  const handleCloseAddMealForm = () => {
    setShowCreateMeal(false);
    setError(null);
  };

  // Handle register now button
  const handleRegisterNow = () => {
    setUseCurrentTime(true);
    setShowDateTimeSelection(true);
  };

  // Handle choose date/time button
  const handleChooseDateTime = () => {
    setUseCurrentTime(false);
    setShowDateTimeSelection(true);
    // Set default values for date and time if empty
    if (!mealDate) {
      setMealDate(new Date().toISOString().split('T')[0]);
    }
    if (!mealTime) {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setMealTime(`${hours}:${minutes}`);
    }
  };

  // Handle back to selection
  const handleBackToSelection = () => {
    setShowDateTimeSelection(false);
    setError(null);
  };

  // Handle when a new meal is successfully created
  const handleMealAdded = async (newMeal: { MealID?: number; id?: number; name?: string; [key: string]: unknown }) => {
    // Refresh meals from context to get the newly created meal
    if (profile?.id) {
      await refetchMeals(profile.id);
    }
    
    // Automatically select the newly created meal if it has ID
    if (newMeal && (newMeal.MealID || newMeal.id)) {
      const mealId = newMeal.MealID || newMeal.id;
      if (mealId) {
        setSelectedMealId(mealId.toString());
        // Also update the search to show the new meal as selected
        const mealToSelect = { 
          MealID: mealId,
          name: newMeal.name || '',
          createdAt: '',
          updatedAt: '',
          profileId: profile?.id || '',
          profile: {
            id: profile?.id || '',
            role: profile?.role || '',
            username: profile?.username
          },
          mealFoods: []
        };
        selectMeal(mealToSelect);
      }
    }
    
    // Return to the main form
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

              {/* Meal Search */}
              <div className="space-y-3">
                <label htmlFor="mealSearch" className="block text-sm font-medium text-amber-200">
                  Search for a Meal <span className="text-red-400">*</span>
                </label>
                
                <div className="relative" ref={searchRef}>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      id="mealSearch"
                      placeholder="Type to search for meals..."
                      value={mealQuery}
                      onChange={(e) => setMealQuery(e.target.value)}
                      onKeyDown={handleMealKeyDown}
                      className="w-full pl-10 pr-4 py-3 bg-neutral-800 text-gray-100 border border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors"
                      disabled={isSubmitting || isLoadingMeals}
                    />
                    {selectedMeal && (
                      <button
                        type="button"
                        onClick={resetSearch}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Search Results Dropdown */}
                  {showMealDropdown && searchResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-neutral-800 border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {searchResults.map((meal, index) => (
                        <button
                          key={meal.MealID}
                          type="button"
                          onClick={() => selectMeal(meal)}
                          className={`w-full text-left px-4 py-3 hover:bg-neutral-700 transition-colors ${
                            index === mealActiveIndex ? 'bg-neutral-700' : ''
                          }`}
                        >
                          <div className="font-medium text-gray-100">{meal.name}</div>
                          {meal.description && (
                            <div className="text-sm text-gray-400 truncate">
                              {meal.description}
                            </div>
                          )}
                          <div className="text-xs text-amber-400 mt-1">
                            by {meal.profile?.username || 'Unknown'} • {meal.mealFoods?.length || 0} ingredients
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selected Meal Display */}
                {selectedMeal && (
                  <div className="p-3 bg-neutral-800 border border-amber-600/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-amber-200">{selectedMeal.name}</div>
                        {selectedMeal.description && (
                          <div className="text-sm text-gray-400">{selectedMeal.description}</div>
                        )}
                        <div className="text-xs text-amber-400 mt-1">
                          by {selectedMeal.profile?.username || 'Unknown'} • {selectedMeal.mealFoods?.length || 0} ingredients
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={resetSearch}
                        className="text-gray-400 hover:text-gray-200 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    {isLoadingMeals ? (
                      'Loading meals...'
                    ) : (
                      <>
                        {mealQuery && searchResults.length > 0 && (
                          `Found ${searchResults.length} meal${searchResults.length !== 1 ? 's' : ''}`
                        )}
                        {mealQuery && searchResults.length === 0 && !selectedMeal && (
                          'No meals found'
                        )}
                        {!mealQuery && (
                          `Search from ${allMeals.length} available community meals`
                        )}
                      </>
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowCreateMeal(true)}
                    className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    {canCreateNewMeal ? 'Create this meal' : "Can't find your meal? Create it"}
                  </button>
                </div>
              </div>

              {/* Date/Time Selection Mode */}
              {!showDateTimeSelection ? (
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-amber-200">
                    When did you eat this meal? <span className="text-red-400">*</span>
                  </label>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Register Now Button */}
                    <button
                      type="button"
                      onClick={handleRegisterNow}
                      disabled={!selectedMealId || isSubmitting}
                      className="p-4 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium border-2 border-transparent hover:border-amber-500 disabled:border-gray-500"
                    >
                      <div className="text-center">
                        <div className="font-semibold">Register Now</div>
                        <div className="text-sm opacity-90 mt-1">
                          Current time: {new Date().toLocaleString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </button>

                    {/* Choose Date & Time Button */}
                    <button
                      type="button"
                      onClick={handleChooseDateTime}
                      disabled={!selectedMealId || isSubmitting}
                      className="p-4 bg-neutral-700 hover:bg-neutral-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-gray-100 rounded-lg transition-colors font-medium border-2 border-gray-600 hover:border-amber-500 disabled:border-gray-500"
                    >
                      <div className="text-center">
                        <div className="font-semibold">Choose Date & Time</div>
                        <div className="text-sm opacity-75 mt-1">
                          Select a specific date and time
                        </div>
                      </div>
                    </button>
                  </div>

                  {!selectedMealId && (
                    <p className="text-xs text-gray-500 text-center">
                      Select a meal first to choose when you ate it
                    </p>
                  )}
                </div>
              ) : (
                /* Date/Time Input Form */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-amber-200">
                      {useCurrentTime ? 'Confirm Registration Time' : 'Select Date & Time'} <span className="text-red-400">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleBackToSelection}
                      className="text-sm text-amber-400 hover:text-amber-300 transition-colors"
                    >
                      ← Change selection
                    </button>
                  </div>

                  {useCurrentTime ? (
                    /* Current Time Display */
                    <div className="p-4 bg-amber-900/20 border border-amber-800/50 rounded-lg">
                      <div className="text-center">
                        <div className="text-amber-200 font-medium">Using current time:</div>
                        <div className="text-lg text-amber-100 font-semibold mt-1">
                          {new Date().toLocaleString('es-ES', {
                            weekday: 'long',
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Custom Date/Time Inputs */
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="mealDate" className="block text-sm font-medium text-gray-300">
                          Date <span className="text-red-400">*</span>
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
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="mealTime" className="block text-sm font-medium text-gray-300">
                          Time <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="time"
                          id="mealTime"
                          name="mealTime"
                          value={mealTime}
                          onChange={(e) => setMealTime(e.target.value)}
                          className="w-full px-4 py-3 bg-neutral-800 text-gray-100 border border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors"
                          required
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                  )}

                  {/* Selected Date/Time Preview for custom selection */}
                  {!useCurrentTime && mealDate && mealTime && (
                    <div className="p-3 bg-neutral-800/50 border border-gray-600 rounded-lg">
                      <div className="text-sm text-gray-300">
                        <span className="font-medium">Selected time:</span>{' '}
                        {new Date(`${mealDate}T${mealTime}`).toLocaleString('es-ES', {
                          weekday: 'long',
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              {showDateTimeSelection && (
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
                    disabled={isSubmitting || !selectedMealId || (!useCurrentTime && (!mealDate || !mealTime))}
                  >
                    {isSubmitting ? 'Registering...' : 'Register Meal'}
                  </button>
                </div>
              )}
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
                onFoodAdded={(m: { MealID?: number; id?: number; name?: string; [key: string]: unknown }) => handleMealAdded(m)}
                onClose={handleCloseAddMealForm}
                initialMealName={mealQuery.trim() || undefined}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}