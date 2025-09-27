"use client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CustomCheckbox } from "@/components/custom-components/custom-checkbox";
import { DropdownWrapper } from "@/components/custom-components/dropdown-wrapper";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IconSelect } from "@/components/custom-components/icon-select";
import { useState } from "react";
import { useFoods, Food } from "@/lib/contexts/FoodsContext";
import { useGlobalNotification } from "@/lib/contexts/NotificationContext";
import { ConfirmationModal } from "./confirmation-modal";
import { useConfirmation } from "@/lib/hooks/useConfirmation";
import { Edit3, Trash2 } from "lucide-react";
import { API_BASE_URL } from "@/lib/config/api";

interface EditFoodFormProps {
  food: Food;
  onSuccess: () => void;
}

export function EditFoodForm({ food, onSuccess }: EditFoodFormProps) {
  const { updateFood, removeFood } = useFoods();
  const { showSuccess, showError } = useGlobalNotification();
  const { confirmation, showConfirmation, handleConfirm, closeConfirmation } = useConfirmation();
  const [foodName, setFoodName] = useState(food.name || "");
  const [preferences, setPreferences] = useState<number[]>(
    food.preferences?.map((p: { PreferenceID?: number } | number) => typeof p === 'number' ? p : p.PreferenceID || 0) || []
  );
  const [restrictions, setRestrictions] = useState<number[]>(
    food.dietaryRestrictions?.map((r: { DietaryRestrictionID?: number } | number) => typeof r === 'number' ? r : r.DietaryRestrictionID || 0) || []
  );
  const [icon, setIcon] = useState<string | null>(food.svgLink || "");
  const [isLoading, setIsLoading] = useState(false);

  const handleEditFood = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/foods/${food.FoodID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: foodName,
          svgLink: icon,
          preferences: preferences,
          dietaryRestrictions: restrictions
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update food");
      }

      const updatedFood = await response.json();
      
      // Actualizar la comida en el contexto inmediatamente
      updateFood(food.FoodID, {
        name: foodName,
        svgLink: icon,
        preferences: preferences,
        dietaryRestrictions: restrictions,
        ...updatedFood
      });
      
      console.log('About to show update success notification for:', foodName);
      showSuccess(
        "Food Updated Successfully!",
        `"${foodName}" has been updated with your latest changes.`,
        <Edit3 className="w-8 h-8" />
      );
      console.log('Update success notification called');
      
      // Delay onSuccess to allow notification to show
      setTimeout(() => {
        console.log('Calling onSuccess after delay');
        onSuccess();
      }, 1000);
    } catch (err: unknown) {
      showError(
        "Failed to Update Food",
        err instanceof Error ? err.message : "An unexpected error occurred while updating the food item."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFood = async () => {
    const response = await fetch(`${API_BASE_URL}/foods/${food.FoodID}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Failed to delete food");
    }

    // Eliminar la comida del contexto
    removeFood(food.FoodID);
    
    showSuccess(
      "Food Deleted Successfully!",
      `"${food.name}" has been permanently removed from your food list.`,
      <Trash2 className="w-8 h-8" />
    );
    
    // Delay onSuccess to allow notification to show
    setTimeout(() => {
      onSuccess();
    }, 1000);
  };

  const handleDeleteClick = () => {
    showConfirmation(
      {
        type: 'danger',
        title: 'Delete Food',
        message: `Are you sure you want to delete "${food.name}"? This action cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        customIcon: <Trash2 className="w-6 h-6" />
      },
      handleDeleteFood
    );
  };

  return (
    <div className={cn("max-w-md mx-auto")}>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-amber-100 mb-2">Editar Comida</h2>
        <p className="text-gray-400 text-sm">Modifica la información de la comida</p>
      </div>
      
      <form onSubmit={handleEditFood}>
        <div className="grid gap-4">
          <div>
            <Label htmlFor="food-name" className="text-amber-200">Food Name</Label>
            <Input
              id="food-name"
              value={foodName}
              onChange={(e) => setFoodName(e.target.value)}
              required
              className="bg-neutral-800 border-amber-800/30 text-amber-100 placeholder:text-gray-400 focus:border-amber-600 focus:ring-amber-600/20"
            />
          </div>

          <DropdownWrapper label="Preferences">
            <CustomCheckbox
              initialOptions={preferences.length > 0 ? preferences : []}
              endpoint="preferences"
              onSelectionChange={setPreferences}
            />
          </DropdownWrapper>

          <DropdownWrapper label="Dietary Restrictions">
            <CustomCheckbox
              initialOptions={restrictions.length > 0 ? restrictions : []}
              endpoint="dietary-restrictions"
              onSelectionChange={setRestrictions}
            />
          </DropdownWrapper>

          <IconSelect onSelectionChange={setIcon} />
        </div>

        <div className="flex justify-center gap-4 mt-6">
          <Button 
            type="submit" 
            disabled={isLoading || confirmation.isLoading}
            className="bg-amber-700 hover:bg-amber-600 text-white font-medium py-2 px-6 rounded-lg transition-colors shadow-lg"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                Updating Food...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4" />
                Update Food
              </div>
            )}
          </Button>
          
          <Button 
            type="button"
            onClick={handleDeleteClick}
            disabled={isLoading || confirmation.isLoading}
            className="bg-red-700 hover:bg-red-600 text-white font-medium py-2 px-6 rounded-lg transition-colors shadow-lg"
          >
            <div className="flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              Delete Food
            </div>
          </Button>
        </div>
      </form>

      {/* Modal de confirmación para borrar */}
      <ConfirmationModal
        isOpen={confirmation.isOpen}
        onClose={closeConfirmation}
        onConfirm={handleConfirm}
        type={confirmation.type}
        title={confirmation.title}
        message={confirmation.message}
        confirmText={confirmation.confirmText}
        cancelText={confirmation.cancelText}
        isLoading={confirmation.isLoading}
        customIcon={confirmation.customIcon}
      />
    </div>
  );
}
