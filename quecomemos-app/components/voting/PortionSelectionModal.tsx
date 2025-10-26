'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Minus, AlertCircle, Utensils, Check, PieChart } from 'lucide-react';
import { VotingService } from './VotingService';
import { useGlobalNotification } from '@/lib/contexts/NotificationContext';
import Image from 'next/image';

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

// Helper to convert fraction to display string
const fractionToString = (fraction: number): string => {
  if (fraction === 1) return '1 (Whole meal)';
  if (fraction === 0) return '0 (None)';
  
  // Check if it's a simple eighth
  const eighths = Math.round(fraction * 8);
  if (Math.abs(fraction - eighths / 8) < 0.001) {
    return `${eighths}/8`;
  }
  
  // Otherwise show decimal
  return fraction.toFixed(3);
};

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
  
  // Selection mode: 'percentage' or 'absolute'
  const [selectionMode, setSelectionMode] = useState<'percentage' | 'absolute'>('percentage');
  
  // Main portion fraction (0 to 1) - for percentage mode
  const [portion, setPortion] = useState<number>(1);
  
  // Manual decimal input
  const [manualInput, setManualInput] = useState<string>('1');
  const [inputError, setInputError] = useState<string>('');
  
  // Per-food portions (initially null, populated when user customizes)
  const [foodPortions, setFoodPortions] = useState<Record<number, number>>({});
  const [showFoodCustomization, setShowFoodCustomization] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectionMode('percentage');
      setPortion(1);
      setManualInput('1');
      setInputError('');
      setFoodPortions({});
      setShowFoodCustomization(false);
    }
  }, [isOpen]);

  // Sync manual input with portion when using buttons
  useEffect(() => {
    setManualInput(portion.toString());
  }, [portion]);

  const handleIncrementPortion = () => {
    setPortion(prev => {
      const newValue = Math.min(1, prev + 0.125); // 1/8 increment
      return Math.round(newValue * 8) / 8; // Round to nearest eighth
    });
  };

  const handleDecrementPortion = () => {
    setPortion(prev => {
      const newValue = Math.max(0, prev - 0.125); // 1/8 decrement
      return Math.round(newValue * 8) / 8; // Round to nearest eighth
    });
  };

  const handleManualInputChange = (value: string) => {
    setManualInput(value);
    setInputError('');
    
    // Allow empty input
    if (value === '') return;
    
    // Replace comma with dot for decimal parsing
    const normalizedValue = value.replace(',', '.');
    const parsed = parseFloat(normalizedValue);
    
    if (isNaN(parsed)) {
      setInputError('Please enter a valid number');
      return;
    }
    
    if (parsed < 0) {
      setInputError('Portion cannot be negative');
      return;
    }
    
    if (parsed > 1) {
      setInputError('Portion cannot exceed 1 (whole meal)');
      return;
    }
    
    setPortion(parsed);
  };

  const handleFoodPortionChange = (foodId: number, newValue: number) => {
    const food = winnerMeal.mealFoods.find(f => f.foodId === foodId);
    if (!food) return;
    
    // In absolute mode, allow any positive value
    // In percentage mode, validate against max quantity
    const maxAllowed = selectionMode === 'percentage' ? food.quantity : Infinity;
    const clamped = Math.max(0, selectionMode === 'percentage' ? Math.min(maxAllowed, newValue) : newValue);
    
    setFoodPortions(prev => ({
      ...prev,
      [foodId]: clamped,
    }));
  };

  const handleFoodIncrement = (foodId: number) => {
    const food = winnerMeal.mealFoods.find(f => f.foodId === foodId);
    if (!food) return;
    
    const current = foodPortions[foodId] ?? (selectionMode === 'percentage' ? food.quantity * portion : food.quantity);
    const increment = selectionMode === 'percentage' ? food.quantity / 8 : 1; // 1/8 in percentage mode, 1 unit in absolute mode
    const maxAllowed = selectionMode === 'percentage' ? food.quantity : Infinity;
    const newValue = selectionMode === 'percentage' ? Math.min(maxAllowed, current + increment) : current + increment;
    
    setFoodPortions(prev => ({
      ...prev,
      [foodId]: Math.round(newValue * 1000) / 1000, // Round to 3 decimals
    }));
  };

  const handleFoodDecrement = (foodId: number) => {
    const food = winnerMeal.mealFoods.find(f => f.foodId === foodId);
    if (!food) return;
    
    const current = foodPortions[foodId] ?? (selectionMode === 'percentage' ? food.quantity * portion : food.quantity);
    const decrement = selectionMode === 'percentage' ? food.quantity / 8 : 1; // 1/8 in percentage mode, 1 unit in absolute mode
    const newValue = Math.max(0, current - decrement);
    
    setFoodPortions(prev => ({
      ...prev,
      [foodId]: Math.round(newValue * 1000) / 1000, // Round to 3 decimals
    }));
  };

  const calculateCalories = () => {
    if (showFoodCustomization) {
      // Calculate from individual food portions
      return winnerMeal.mealFoods.reduce((total, food) => {
        const foodQuantity = foodPortions[food.foodId] ?? (selectionMode === 'percentage' ? food.quantity * portion : food.quantity);
        return total + (food.kCal * foodQuantity);
      }, 0);
    } else {
      // Simple calculation based on overall portion (only valid in percentage mode)
      if (selectionMode === 'percentage') {
        return winnerMeal.totalCalories * portion;
      } else {
        // In absolute mode without customization, use full meal
        return winnerMeal.totalCalories;
      }
    }
  };

  const handleConfirm = async () => {
    if (inputError) {
      showError('Invalid Input', inputError);
      return;
    }
    
    if (selectionMode === 'percentage' && (portion < 0 || portion > 1)) {
      showError('Invalid Portion', 'Portion must be between 0 and 1');
      return;
    }

    setLoading(true);
    try {
      // Prepare food portions payload based on mode
      let foodPortionsPayload;
      let calculatedPortion;
      
      if (selectionMode === 'absolute') {
        // In absolute mode, send actual quantities
        foodPortionsPayload = winnerMeal.mealFoods.map(food => {
          const quantity = foodPortions[food.foodId] ?? food.quantity;
          return {
            foodId: food.foodId,
            portionFraction: quantity / food.quantity, // Still send as fraction for backend compatibility
            absoluteQuantity: quantity // Also send absolute quantity
          };
        });
        
        // Calculate overall portion as average of all food portions
        const totalFraction = foodPortionsPayload.reduce((sum, fp) => sum + fp.portionFraction, 0);
        calculatedPortion = totalFraction / foodPortionsPayload.length;
      } else {
        // In percentage mode
        foodPortionsPayload = showFoodCustomization
          ? winnerMeal.mealFoods.map(food => ({
              foodId: food.foodId,
              portionFraction: (foodPortions[food.foodId] ?? (food.quantity * portion)) / food.quantity,
            }))
          : winnerMeal.mealFoods.map(food => ({
              foodId: food.foodId,
              portionFraction: portion,
            }));
        calculatedPortion = portion;
      }

      await VotingService.selectMealPortion(
        sessionId,
        userId,
        calculatedPortion,
        foodPortionsPayload
      );

      showSuccess(
        'Portion Selected!',
        `You selected ${selectionMode === 'percentage' ? fractionToString(calculatedPortion) + ' of' : ''} "${winnerMeal.name}" (${Math.round(calculateCalories())} kCal)`
      );
      
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error selecting portion:', error);
      showError(
        'Selection Failed',
        error instanceof Error ? error.message : 'Failed to save your portion selection'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-3xl bg-neutral-900 border-amber-700/50 max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between border-b border-amber-700/30">
          <CardTitle className="flex items-center gap-2 text-amber-200">
            <Utensils className="h-5 w-5" />
            Select Your Portion
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={loading}
            className="text-neutral-400 hover:text-amber-200"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {/* Winner Meal Info */}
          <div className="bg-amber-900/20 border border-amber-700/50 rounded-lg p-4">
            <h3 className="font-semibold text-lg text-amber-200 mb-1">{winnerMeal.name}</h3>
            {winnerMeal.description && (
              <p className="text-sm text-neutral-400 mb-2">{winnerMeal.description}</p>
            )}
            <div className="flex items-center gap-2 text-sm text-neutral-400">
              <Badge variant="outline" className="border-amber-600 text-amber-300">
                {winnerMeal.totalCalories} kCal (whole meal)
              </Badge>
              <Badge variant="outline" className="border-amber-600 text-amber-300">
                {winnerMeal.mealFoods.length} food{winnerMeal.mealFoods.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          </div>

          {/* Selection Mode Toggle */}
          <div className="space-y-2">
            <h4 className="font-semibold text-neutral-200">Selection Mode</h4>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={selectionMode === 'percentage' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setSelectionMode('percentage');
                  setShowFoodCustomization(false);
                }}
                disabled={loading}
                className={`${
                  selectionMode === 'percentage'
                    ? 'bg-amber-700 text-white'
                    : 'border-amber-700 text-amber-200 hover:bg-amber-900/30'
                }`}
              >
                <PieChart className="h-4 w-4 mr-2" />
                Percentage of Total
              </Button>
              <Button
                variant={selectionMode === 'absolute' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setSelectionMode('absolute');
                  setShowFoodCustomization(true); // Auto-open food customization in absolute mode
                }}
                disabled={loading}
                className={`${
                  selectionMode === 'absolute'
                    ? 'bg-amber-700 text-white'
                    : 'border-amber-700 text-amber-200 hover:bg-amber-900/30'
                }`}
              >
                <Utensils className="h-4 w-4 mr-2" />
                Specific Quantities
              </Button>
            </div>
            <p className="text-xs text-neutral-400">
              {selectionMode === 'percentage'
                ? 'Select a percentage (0-100%) of the entire meal'
                : 'Specify exact quantities for each food item'}
            </p>
          </div>

          {/* Overall Portion Selection (only in percentage mode) */}
          {selectionMode === 'percentage' && (
            <div className="space-y-3">
              <h4 className="font-semibold text-neutral-200">Overall Portion</h4>
              
              <div className="flex items-center gap-3">
                {/* Decrement */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDecrementPortion}
                  disabled={portion <= 0 || loading}
                  className="border-amber-700 text-amber-200 hover:bg-amber-900/30"
                >
                  <Minus className="h-4 w-4" />
                </Button>

                {/* Display current portion */}
                <div className="flex-1 text-center">
                  <div className="text-2xl font-bold text-amber-200">
                    {fractionToString(portion)}
                  </div>
                  <div className="text-sm text-neutral-400">
                    {Math.round(calculateCalories())} kCal
                  </div>
                </div>

                {/* Increment */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleIncrementPortion}
                  disabled={portion >= 1 || loading}
                  className="border-amber-700 text-amber-200 hover:bg-amber-900/30"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Manual input */}
              <div className="space-y-2">
                <label className="text-sm text-neutral-400">
                  Or enter manually (use comma or dot for decimals):
                </label>
                <input
                  type="text"
                  value={manualInput}
                  onChange={(e) => handleManualInputChange(e.target.value)}
                  disabled={loading}
                  placeholder="0.5 or 4/8"
                  className="w-full p-3 rounded-lg border border-amber-700 bg-amber-800/20 text-amber-100 placeholder-amber-400/50 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                {inputError && (
                  <div className="flex items-center gap-2 text-sm text-red-400">
                    <AlertCircle className="h-4 w-4" />
                    <span>{inputError}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Toggle Food Customization (only in percentage mode) */}
          {selectionMode === 'percentage' && (
            <div className="border-t border-neutral-700 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFoodCustomization(!showFoodCustomization)}
                disabled={loading}
                className="w-full border-amber-700 text-amber-200 hover:bg-amber-900/30"
              >
                {showFoodCustomization ? 'Hide' : 'Show'} Individual Food Portions
              </Button>
            </div>
          )}

          {/* Individual Food Portions */}
          {showFoodCustomization && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-neutral-400">
                <AlertCircle className="h-4 w-4" />
                <span>
                  {selectionMode === 'percentage'
                    ? 'Customize the quantity of each food item (cannot exceed meal quantities)'
                    : 'Specify exact quantities for each food item'}
                </span>
              </div>

              {winnerMeal.mealFoods.map((food) => {
                const currentPortion = foodPortions[food.foodId] ?? (selectionMode === 'percentage' ? food.quantity * portion : food.quantity);
                const percentage = (currentPortion / food.quantity) * 100;
                
                return (
                  <div
                    key={food.foodId}
                    className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-4"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 flex items-center justify-center bg-amber-800/30 rounded-full border border-amber-700/50 flex-shrink-0">
                        {food.svgLink ? (
                          <Image
                            src={food.svgLink}
                            alt={food.foodName}
                            width={20}
                            height={20}
                            className="w-5 h-5 object-contain"
                          />
                        ) : (
                          <Utensils className="w-5 h-5 text-amber-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h5 className="font-medium text-neutral-100">{food.foodName}</h5>
                        <p className="text-xs text-neutral-400">
                          {selectionMode === 'percentage' 
                            ? `Max: ${food.quantity} units • ${food.kCal} kCal/unit`
                            : `Meal contains: ${food.quantity} units • ${food.kCal} kCal/unit`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleFoodDecrement(food.foodId)}
                        disabled={currentPortion <= 0 || loading}
                        className="border-amber-700 text-amber-200 hover:bg-amber-900/30"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>

                      <div className="flex-1">
                        <input
                          type="number"
                          value={currentPortion.toFixed(3)}
                          onChange={(e) =>
                            handleFoodPortionChange(food.foodId, parseFloat(e.target.value) || 0)
                          }
                          disabled={loading}
                          step={selectionMode === 'percentage' ? '0.125' : '1'}
                          min="0"
                          max={selectionMode === 'percentage' ? food.quantity : undefined}
                          className="w-full p-2 text-center rounded-lg border border-amber-700 bg-amber-800/20 text-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                        <div className="text-xs text-center text-neutral-400 mt-1">
                          {selectionMode === 'percentage' && `${Math.round(percentage)}% • `}
                          {Math.round(food.kCal * currentPortion)} kCal
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleFoodIncrement(food.foodId)}
                        disabled={currentPortion >= food.quantity || loading}
                        className="border-amber-700 text-amber-200 hover:bg-amber-900/30"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-neutral-700">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1 border-neutral-700 text-neutral-300 hover:bg-neutral-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={loading || !!inputError}
              className="flex-1 bg-amber-700 hover:bg-amber-600 text-white"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Confirm Selection
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
