"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGlobalNotification } from "@/lib/contexts/NotificationContext";
import { ConfirmationModal } from "./confirmation-modal";
import { useConfirmation } from "@/lib/hooks/useConfirmation";
import { Edit3, Trash2, Plus, X } from "lucide-react";
import { API_BASE_URL } from "@/lib/config/api";
import { useFoods } from "@/lib/contexts/FoodsContext";

interface Meal {
  MealID: number;
  name: string;
  description?: string;
  preparationTime?: number;
  servings?: number;
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

interface EditMealFormProps {
  meal: Meal;
  onSuccess: () => void;
}

export function EditMealForm({ meal, onSuccess }: EditMealFormProps) {
  const { foods } = useFoods();
  const { showSuccess, showError } = useGlobalNotification();
  const { confirmation, showConfirmation, handleConfirm, closeConfirmation } = useConfirmation();
  
  const [mealName, setMealName] = useState(meal.name || "");
  const [description, setDescription] = useState(meal.description || "");
  const [selectedFoodIds, setSelectedFoodIds] = useState<number[]>(
    meal.mealFoods.map(mf => mf.food.FoodID) || []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [showFoodSelection, setShowFoodSelection] = useState(false);

  const handleEditMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (selectedFoodIds.length === 0) {
        throw new Error("A meal must have at least one food item");
      }

      const response = await fetch(`${API_BASE_URL}/meals/${meal.MealID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: mealName,
          description: description,
          foodIds: selectedFoodIds
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update meal");
      }

      showSuccess(
        "Meal Updated Successfully!",
        `"${mealName}" has been updated with your latest changes.`,
        <Edit3 className="w-8 h-8" />
      );
      
      // Delay onSuccess to allow notification to show
      setTimeout(() => {
        onSuccess();
      }, 1000);
    } catch (err: unknown) {
      showError(
        "Failed to Update Meal",
        err instanceof Error ? err.message : "An unexpected error occurred while updating the meal."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMeal = async () => {
    const response = await fetch(`${API_BASE_URL}/meals/${meal.MealID}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Failed to delete meal");
    }

    showSuccess(
      "Meal Deleted Successfully!",
      `"${meal.name}" has been permanently removed.`,
      <Trash2 className="w-8 h-8" />
    );
    
    setTimeout(() => {
      onSuccess();
    }, 1000);
  };

  const confirmDelete = () => {
    showConfirmation({
      type: 'danger',
      title: "Delete Meal",
      message: `Are you sure you want to delete "${meal.name}"? This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel"
    }, handleDeleteMeal);
  };

  const toggleFoodSelection = (foodId: number) => {
    setSelectedFoodIds(prev => {
      if (prev.includes(foodId)) {
        return prev.filter(id => id !== foodId);
      } else {
        return [...prev, foodId];
      }
    });
  };

  const selectedFoods = foods.filter(food => selectedFoodIds.includes(food.FoodID));
  const availableFoods = foods.filter(food => !selectedFoodIds.includes(food.FoodID));

  return (
    <div className="space-y-6">
      <div className="text-center border-b border-amber-800/30 pb-4">
        <h3 className="text-xl font-bold text-amber-100">Edit Meal</h3>
        <p className="text-sm text-gray-400">Update your meal details and ingredients</p>
      </div>

      <form onSubmit={handleEditMeal} className="space-y-4">
        {/* Meal Name */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-amber-200">Meal Name</Label>
          <Input
            id="name"
            type="text"
            value={mealName}
            onChange={(e) => setMealName(e.target.value)}
            className="bg-amber-900/20 border-amber-700/50 text-amber-100 placeholder:text-amber-300/50"
            placeholder="Enter meal name"
            required
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description" className="text-amber-200">Description</Label>
          <textarea
            id="description"
            value={description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
            className="flex min-h-[80px] w-full rounded-md border border-amber-700/50 bg-amber-900/20 px-3 py-2 text-sm text-amber-100 placeholder:text-amber-300/50 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Describe your meal (optional)"
            rows={3}
          />
        </div>

        {/* Selected Foods */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-amber-200">Selected Ingredients ({selectedFoodIds.length})</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowFoodSelection(!showFoodSelection)}
              className="border-amber-700/50 text-amber-200 hover:bg-amber-800/20"
            >
              {showFoodSelection ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showFoodSelection ? "Close" : "Add Foods"}
            </Button>
          </div>
          
          {selectedFoods.length > 0 ? (
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {selectedFoods.map((food) => (
                <div
                  key={food.FoodID}
                  className="flex items-center justify-between bg-amber-900/30 border border-amber-700/50 rounded-lg p-2"
                >
                  <span className="text-amber-200 text-sm font-medium">{food.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleFoodSelection(food.FoodID)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20 h-8 w-8 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-amber-300/70 text-sm italic">No ingredients selected. Please add some ingredients.</p>
          )}
        </div>

        {/* Food Selection Panel */}
        {showFoodSelection && (
          <div className="border border-amber-700/50 rounded-lg p-4 bg-amber-900/10">
            <h4 className="text-amber-200 font-medium mb-3">Available Foods</h4>
            <div className="max-h-40 overflow-y-auto space-y-2">
              {availableFoods.length > 0 ? (
                availableFoods.map((food) => (
                  <div
                    key={food.FoodID}
                    className="flex items-center justify-between bg-amber-800/20 border border-amber-700/30 rounded-lg p-2 hover:bg-amber-700/30 transition-colors"
                  >
                    <span className="text-amber-100 text-sm">{food.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleFoodSelection(food.FoodID)}
                      className="text-green-400 hover:text-green-300 hover:bg-green-900/20 h-8 w-8 p-0"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-amber-300/70 text-sm italic">All available foods have been selected.</p>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            disabled={isLoading || selectedFoodIds.length === 0}
            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
          >
            {isLoading ? "Updating..." : "Update Meal"}
          </Button>
          
          <Button
            type="button"
            variant="destructive"
            onClick={confirmDelete}
            className="px-4"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </form>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmation.isOpen}
        type={confirmation.type}
        title={confirmation.title}
        message={confirmation.message}
        confirmText={confirmation.confirmText}
        cancelText={confirmation.cancelText}
        isLoading={confirmation.isLoading}
        onConfirm={handleConfirm}
        onClose={closeConfirmation}
      />
    </div>
  );
}