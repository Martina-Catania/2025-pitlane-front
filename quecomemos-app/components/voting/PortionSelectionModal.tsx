'use client';

import { useState } from 'react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VotingService } from './VotingService';
import { GameHistoryService } from '@/components/games/clicker-game/GameHistoryService';
import { useGlobalNotification } from '@/lib/contexts/NotificationContext';

interface MealFood {
  foodId: number;
  foodName: string;
  quantity: number;
  svgLink?: string;
  kCal: number;
}

interface WinnerMeal {
  mealId: number;
  name: string;
  description?: string;
  mealFoods: MealFood[];
  totalCalories: number;
}

interface PortionSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: number;
  // For backwards compatibility with voting
  winnerMeal?: WinnerMeal;
  userId?: string;
  // For game sessions
  mealId?: number;
  mealName?: string;
  isGameSession?: boolean;
  onSuccess?: () => void;
}

export function PortionSelectionModal({
  isOpen,
  onClose,
  sessionId,
  winnerMeal,
  userId,
  mealId,
  mealName,
  isGameSession = false,
  onSuccess,
}: PortionSelectionModalProps) {
  const { showSuccess, showError } = useGlobalNotification();
  const [loading, setLoading] = useState(false);

  const handleConfirmFullConsumption = async () => {
    setLoading(true);
    try {
      const targetMeal = winnerMeal;
      if (!targetMeal) {
        throw new Error('Meal details are required to confirm consumption');
      }

      const fullMealFoodPortions = targetMeal.mealFoods.map((food) => ({
        foodId: food.foodId,
        portionFraction: 1
      }));

      if (isGameSession && mealId) {
        await GameHistoryService.registerGameMealPortion(
          sessionId,
          userId!,
          mealId,
          1,
          fullMealFoodPortions
        );
      } else if (winnerMeal && userId) {
        await VotingService.selectMealPortion(
          sessionId,
          userId,
          1,
          fullMealFoodPortions
        );
      } else {
        throw new Error('Invalid configuration for meal confirmation');
      }

      const mealDisplayName = isGameSession ? mealName : winnerMeal?.name;
      const totalCalories = targetMeal.totalCalories;

      showSuccess(
        'Meal Registered',
        `You've confirmed full consumption of ${mealDisplayName} (${totalCalories} kcal)`
      );

      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error confirming meal consumption:', error);
      showError(
        'Confirmation Failed',
        error instanceof Error ? error.message : 'Failed to confirm meal consumption'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const meal = winnerMeal;
  const displayMealName = isGameSession ? mealName : winnerMeal?.name;

  // Validate required data based on session type
  // For voting sessions, winnerMeal is always required
  if (!isGameSession && !meal) return null;
  
  // For game sessions we also need a winner meal object to compute food portions.
  if (isGameSession && !meal) {
    console.error('[PortionSelectionModal] Game session requires winnerMeal object for full consumption confirmation');
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="relative w-full max-w-2xl bg-neutral-900 rounded-2xl shadow-2xl border border-amber-800/30 overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <CardHeader className={`p-6 border-b ${
          isGameSession 
            ? 'bg-gradient-to-r from-amber-900/20 to-amber-800/20 border-amber-800/30'
            : 'bg-gradient-to-r from-amber-900/20 to-amber-800/20 border-amber-800/30'
        }`}>
          <div className="flex items-center justify-between">
            <CardTitle className={`text-2xl font-bold ${
              isGameSession ? 'text-amber-400' : 'text-amber-200'
            }`}>
              Confirm Meal Consumption
            </CardTitle>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-white transition-colors p-2"
              disabled={loading}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-neutral-300 mt-2">
            Confirm full consumption of <span className={`font-semibold ${
              isGameSession ? 'text-amber-400' : 'text-amber-200'
            }`}>{displayMealName}</span>
          </p>
        </CardHeader>

        {/* Content */}
        <CardContent className="p-6 space-y-4">
          <p className="text-sm text-neutral-300">
            Partial portions are no longer supported. This action will register the full meal for this session.
          </p>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmFullConsumption}
              disabled={loading}
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
            >
              {loading ? 'Confirming...' : 'Confirm Full Meal'}
            </Button>
          </div>
        </CardContent>
      </div>
    </div>
  );
}
