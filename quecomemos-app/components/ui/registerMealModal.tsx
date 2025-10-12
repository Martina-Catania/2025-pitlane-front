'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

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
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const mealId = formData.get('mealId') as string;
    const date = formData.get('mealDate') as string;

    if (!mealId || !date) {
      setError('Please select a meal and a date.');
      return;
    }

    onSubmit({ mealId: parseInt(mealId, 10), date });
    setError(null);
    onClose();
  };

  // Close modal with ESC key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden'; // Prevent body scroll
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset'; // Restore body scroll
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-neutral-900 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-amber-800/30">
        {/* Header */}
        <div className="sticky top-0 bg-neutral-900 rounded-t-2xl border-b border-amber-800/30 p-6 pb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-amber-100">Register a Meal</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-amber-800/20 rounded-full transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 text-amber-200" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 pt-4">

          <form onSubmit={handleSubmit} className="space-y-6">
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
                className="mt-1 block w-full px-3 py-2 bg-gray-800 text-gray-200 rounded-md border border-gray-600 focus:outline-none focus:ring focus:ring-blue-500"
                required
              >
                <option value="" disabled selected>
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
                className="mt-1 block w-full px-3 py-2 bg-gray-800 text-gray-200 rounded-md border border-gray-600 focus:outline-none focus:ring focus:ring-blue-500"
                required
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Register Meal
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}