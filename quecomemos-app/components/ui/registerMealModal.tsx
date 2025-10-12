'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { COMMON_STYLES } from '@/components/meal/constants';

interface Meal {
  MealID: number;
  name: string;
}

interface RegisterMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (mealData: { mealId: number; date: string }) => void;
  meals: Meal[]; // Lista de comidas disponibles
}

export function RegisterMealModal({ isOpen, onClose, onSubmit, meals }: RegisterMealModalProps) {
  const [selectedMealId, setSelectedMealId] = useState<string | null>(null);
  const [mealDate, setMealDate] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedMealId || !mealDate) {
      setError('Please select a meal and a date.');
      return;
    }

    onSubmit({ mealId: parseInt(selectedMealId, 10), date: mealDate });
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Card className={`${COMMON_STYLES.CARD_BASE} p-6`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className={`${COMMON_STYLES.TEXT_AMBER_PRIMARY} text-lg font-semibold`}>
          Register a Meal
        </h2>
        <button
          type="button"
          onClick={onClose}
          className={`${COMMON_STYLES.TEXT_AMBER_MUTED} hover:text-amber-100 text-sm underline transition-colors`}
        >
          Cancel
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Error Message */}
        {error && (
          <div className="text-red-500 text-sm bg-red-900/20 p-2 rounded">
            {error}
          </div>
        )}

        {/* Select Meal */}
        <div>
          <label htmlFor="mealId" className="block text-sm font-medium text-gray-300">
            Select a Meal
          </label>
          <select
            id="mealId"
            name="mealId"
            value={selectedMealId || ''}
            onChange={(e) => setSelectedMealId(e.target.value)}
            className={COMMON_STYLES.INPUT_CLASS}
            required
          >
            <option value="" disabled>
              Choose a meal
            </option>
            {meals.map((meal) => (
              <option key={meal.MealID} value={meal.MealID}>
                {meal.name}
              </option>
            ))}
          </select>
        </div>

        {/* Meal Date */}
        <div>
          <label htmlFor="mealDate" className="block text-sm font-medium text-gray-300">
            Date
          </label>
          <input
            type="date"
            id="mealDate"
            name="mealDate"
            value={mealDate}
            onChange={(e) => setMealDate(e.target.value)}
            className={COMMON_STYLES.INPUT_CLASS}
            required
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            className={`${COMMON_STYLES.BUTTON_PRIMARY} w-full`}
            disabled={!selectedMealId || !mealDate}
          >
            Register Meal
          </Button>
        </div>
      </form>
    </Card>
  );
}