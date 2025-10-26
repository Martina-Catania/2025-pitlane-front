'use client';

import { useState } from 'react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X } from 'lucide-react';
import { VotingService } from './VotingService';
import { useGlobalNotification } from '@/lib/contexts/NotificationContext';
import { MealPortionSelector, type PortionData } from '@/components/meal';

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
  winnerMeal: WinnerMeal;
  userId: string;
  onSuccess?: () => void;
}

export function PortionSelectionModal({
  isOpen,
  onClose,
  sessionId,
  winnerMeal,
  userId,
  onSuccess,
}: PortionSelectionModalProps) {
  const { showSuccess, showError } = useGlobalNotification();
  const [loading, setLoading] = useState(false);

  const handlePortionConfirm = async (portionData: PortionData) => {
    setLoading(true);
    try {
      await VotingService.selectMealPortion(
        sessionId,
        userId,
        portionData.portionFraction,
        portionData.foodPortions
      );

      const percentLabel = portionData.mode === 'percentage' 
        ? `${(portionData.portionFraction * 100).toFixed(1)}%`
        : 'Custom';

      showSuccess(
        'Portion Selected',
        `You've selected ${percentLabel} portion of ${winnerMeal.name} (${portionData.totalCalories} kcal)`
      );

      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error selecting portion:', error);
      showError(
        'Selection Failed',
        error instanceof Error ? error.message : 'Failed to select portion'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="relative w-full max-w-2xl bg-neutral-900 rounded-2xl shadow-2xl border border-amber-800/30 overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <CardHeader className="p-6 bg-gradient-to-r from-amber-900/20 to-amber-800/20 border-b border-amber-800/30">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold text-amber-200">
              Select Your Portion
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
            Choose how much of <span className="font-semibold text-amber-200">{winnerMeal.name}</span> you consumed
          </p>
        </CardHeader>

        {/* Content */}
        <CardContent className="p-6">
          <MealPortionSelector
            meal={winnerMeal}
            onConfirm={handlePortionConfirm}
            onCancel={onClose}
            loading={loading}
          />
        </CardContent>
      </div>
    </div>
  );
}
