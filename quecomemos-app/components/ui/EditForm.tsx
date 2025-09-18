"use client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CustomCheckbox } from "@/components/custom-components/custom-checkbox";
import { DropdownWrapper } from "@/components/custom-components/dropdown-wrapper";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IconSelect } from "@/components/custom-components/icon-select";
import { useState, useEffect } from "react";
import { useFoods, Food } from "@/lib/contexts/FoodsContext";

interface EditFoodFormProps {
  food: Food;
  onSuccess: () => void;
}

export function EditFoodForm({ food, onSuccess }: EditFoodFormProps) {
  const { updateFood, removeFood } = useFoods();
  const [foodName, setFoodName] = useState(food.name || "");
  const [preferences, setPreferences] = useState<number[]>(
    food.preferences?.map((p: any) => p.PreferenceID || p) || []
  );
  const [restrictions, setRestrictions] = useState<number[]>(
    food.dietaryRestrictions?.map((r: any) => r.DietaryRestrictionID || r) || []
  );
  const [icon, setIcon] = useState<string | null>(food.svgLink || "");
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEditFood = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:3005/foods/${food.FoodID}`, {
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
      
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFood = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:3005/foods/${food.FoodID}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete food");
      }

      // Eliminar la comida del contexto
      removeFood(food.FoodID);
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
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

        {error && <p className="text-red-300 bg-red-900/20 border border-red-800/30 rounded-lg px-3 py-2 text-sm">{error}</p>}

        <div className="flex justify-center gap-4 mt-6">
          <Button 
            type="submit" 
            disabled={isLoading || isDeleting}
            className="bg-amber-700 hover:bg-amber-600 text-white font-medium py-2 px-6 rounded-lg transition-colors shadow-lg"
          >
            {isLoading ? "Updating..." : "Update Food"}
          </Button>
          
          <Button 
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isLoading || isDeleting}
            className="bg-red-700 hover:bg-red-600 text-white font-medium py-2 px-6 rounded-lg transition-colors shadow-lg"
          >
            Delete Food
          </Button>
        </div>
      </form>

      {/* Modal de confirmación para borrar */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50 p-4">
          <div className="bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-red-800/30">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-amber-100 mb-2">
                Delete Food
              </h3>
              <p className="text-gray-400 text-sm mb-6">
                Are you sure you want to delete "{food.name}"? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="bg-neutral-600 hover:bg-neutral-500 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleDeleteFood}
                  disabled={isDeleting}
                  className="bg-red-700 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
