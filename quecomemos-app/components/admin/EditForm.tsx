"use client";
import { Button } from "@/components/ui/button";
import { CustomCheckbox } from "@/components/forms";
import { DropdownWrapper } from "@/components/forms";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IconSelect } from "@/components/forms";
import { useState, useEffect } from "react";
import { useFoods, Food } from "@/lib/contexts/FoodsContext";
import { useMeals } from "@/lib/contexts/MealsContext";
import { useGlobalNotification } from "@/lib/contexts/NotificationContext";
import { ConfirmationModal } from "@/components/modals";
import { useConfirmation } from "@/lib/hooks/useConfirmation";
import { SquarePen, Trash2, Hexagon, Loader2, AlertCircle } from "lucide-react";
import { API_BASE_URL } from "@/lib/config/api";

interface KorvenProduct {
  name: string;
}

interface EditFoodFormProps {
  food: Food;
  onSuccess: () => void;
}

export function EditFoodForm({ food, onSuccess }: EditFoodFormProps) {
  const { updateFood, removeFood } = useFoods();
  const { handleFoodDeletion } = useMeals();
  const { showSuccess, showError } = useGlobalNotification();
  const { confirmation, showConfirmation, handleConfirm, closeConfirmation } = useConfirmation();
  
  const [foodName, setFoodName] = useState(food.name || "");
  const [kCal, setKCal] = useState<number>(food.kCal || 0);
  const [preferences, setPreferences] = useState<number[]>(
    food.preferences?.map((p: { PreferenceID?: number } | number) => typeof p === 'number' ? p : p.PreferenceID || 0) || []
  );
  const [restrictions, setRestrictions] = useState<number[]>(
    food.dietaryRestrictions?.map((r: { DietaryRestrictionID?: number } | number) => typeof r === 'number' ? r : r.DietaryRestrictionID || 0) || []
  );
  const [icon, setIcon] = useState<string | null>(food.svgLink || "");
  const [isLoading, setIsLoading] = useState(false);
  
  // Validation states
  const [isCheckingName, setIsCheckingName] = useState(false);
  const [isDuplicateName, setIsDuplicateName] = useState(false);
  
  // Korven integration states
  const [korvenProducts, setKorvenProducts] = useState<KorvenProduct[]>([]);
  const [isLoadingKorven, setIsLoadingKorven] = useState(false);
  const [showKorvenOptions, setShowKorvenOptions] = useState(false);
  const [selectedKorvenProduct, setSelectedKorvenProduct] = useState<string | null>(null);
  const [isKorvenInspired, setIsKorvenInspired] = useState(false);

  // Function to check if a name contains connectors (for meal names)
  const hasConnectors = (name: string): boolean => {
    const connectors = ['con', 'y', 'de', 'al', 'en', 'para', 'sin', 'a', 'el', 'la', 'los', 'las'];
    const words = name.toLowerCase().split(/\s+/);
    return words.some(word => connectors.includes(word));
  };

  // Fetch Korven products on mount
  useEffect(() => {
    const fetchKorvenProducts = async () => {
      setIsLoadingKorven(true);
      try {
        const response = await fetch('/api/korven-products', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });
        if (response.ok) {
          const products = await response.json() as KorvenProduct[];
          // Filter products WITHOUT connectors (for individual foods)
          const filtered = products.filter(product => !hasConnectors(product.name));
          setKorvenProducts(filtered);
        }
      } catch (error) {
        console.error('Error fetching Korven products:', error);
      } finally {
        setIsLoadingKorven(false);
      }
    };

    fetchKorvenProducts();
  }, []);

  // Check if current food name is Korven-inspired
  useEffect(() => {
    const normalizedFoodName = foodName.toLowerCase().trim();
    const isInspired = korvenProducts.some(
      product => product.name.toLowerCase().trim() === normalizedFoodName
    );
    setIsKorvenInspired(isInspired);
    if (isInspired) {
      setSelectedKorvenProduct(foodName);
    }
  }, [foodName, korvenProducts]);

  // Check if food name already exists in database (debounced)
  useEffect(() => {
    const trimmedName = foodName.trim();
    
    // Don't check if name hasn't changed or is empty
    if (!trimmedName || trimmedName.toLowerCase() === food.name.toLowerCase()) {
      setIsDuplicateName(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsCheckingName(true);
      try {
        const response = await fetch(`${API_BASE_URL}/foods`);
        if (response.ok) {
          const allFoods: Food[] = await response.json();
          const exists = allFoods.some(f => 
            f.FoodID !== food.FoodID && 
            f.name?.toLowerCase() === trimmedName.toLowerCase()
          );
          setIsDuplicateName(exists);
        }
      } catch (error) {
        console.error('Error checking food name:', error);
      } finally {
        setIsCheckingName(false);
      }
    }, 500); // Debounce 500ms

    return () => clearTimeout(timeoutId);
  }, [foodName, food.FoodID, food.name]);

  const isNameChanged = foodName.trim().toLowerCase() !== food.name.toLowerCase();

  const handleEditFood = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate food name doesn't exist
    if (isDuplicateName) {
      showError(
        "Duplicate Food Name",
        `A food named "${foodName.trim()}" already exists. Please choose a different name.`
      );
      return;
    }
    
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/foods/${food.FoodID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: foodName,
          kCal: kCal,
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
      
      updateFood(food.FoodID, {
        name: foodName,
        kCal: kCal,
        svgLink: icon,
        preferences: preferences,
        dietaryRestrictions: restrictions,
        ...updatedFood
      });
      
      showSuccess(
        "Food Updated Successfully!",
        `"${foodName}" has been updated with your latest changes.`,
        <SquarePen className="w-8 h-8" />
      );
      
      setTimeout(() => {
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

    removeFood(food.FoodID);
    handleFoodDeletion(food.FoodID);
    
    showSuccess(
      "Food Deleted Successfully!",
      `"${food.name}" has been permanently removed from your food list.`,
      <Trash2 className="w-8 h-8" />
    );
    
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

  const inputClass = "w-full p-3 rounded-lg border border-amber-700 bg-amber-800 text-amber-100 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500";

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleEditFood} className="space-y-4">
        {/* Korven Inspiration Section */}
        <div className="bg-gradient-to-r from-amber-900/30 to-yellow-900/30 border border-amber-600/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Hexagon className="w-5 h-5 text-amber-400 fill-amber-400/20" />
              <Label className="text-amber-100 text-sm font-semibold">
                Get Korven Inspired
              </Label>
            </div>
            <button
              type="button"
              onClick={() => setShowKorvenOptions(!showKorvenOptions)}
              className="text-xs text-amber-300 hover:text-amber-100 underline"
            >
              {showKorvenOptions ? 'Hide' : 'Show'} options
            </button>
          </div>
          
          {showKorvenOptions && (
            <div className="space-y-2">
              {isLoadingKorven ? (
                <div className="flex items-center justify-center gap-2 text-amber-300 py-4">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Loading Korven products...</span>
                </div>
              ) : korvenProducts.length > 0 ? (
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {korvenProducts.map((product, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        setFoodName(product.name);
                        setSelectedKorvenProduct(product.name);
                        setIsKorvenInspired(true);
                      }}
                      className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                        selectedKorvenProduct === product.name
                          ? 'bg-amber-600 text-white border border-amber-500'
                          : 'bg-amber-900/20 text-amber-200 hover:bg-amber-800/40 border border-amber-700/30'
                      }`}
                    >
                      {product.name}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-amber-300 text-center py-3">
                  No Korven products available for individual foods.
                </p>
              )}
              {selectedKorvenProduct && (
                <div className="text-xs text-amber-300 bg-amber-900/30 border border-amber-700 rounded p-2 flex items-center gap-2">
                  <Hexagon className="w-3 h-3 fill-amber-400/20" />
                  <span>Using Korven inspired name: <strong>{selectedKorvenProduct}</strong></span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Basic Info - Two columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-amber-200 text-sm mb-2 block flex items-center gap-2">
              Food Name
              {isKorvenInspired && (
                <span className="text-xs bg-amber-600/50 text-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Hexagon className="w-3 h-3 fill-amber-400/30" />
                  Korven
                </span>
              )}
            </Label>
            <Input
              value={foodName}
              onChange={(e) => {
                setFoodName(e.target.value);
                if (selectedKorvenProduct && e.target.value !== selectedKorvenProduct) {
                  setIsKorvenInspired(false);
                  setSelectedKorvenProduct(null);
                }
              }}
              placeholder="Enter food name"
              disabled={isLoading}
              className={`${inputClass} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''} ${
                isDuplicateName ? 'border-red-500 focus:ring-red-500' : ''
              }`}
            />
            {/* Show validation messages */}
            {isCheckingName ? (
              <p className="mt-1 text-xs text-gray-400 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Checking availability...
              </p>
            ) : isDuplicateName ? (
              <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                A food with this name already exists. Please choose a different name.
              </p>
            ) : isNameChanged && foodName.trim().length > 0 ? (
              <p className="mt-1 text-xs text-green-400 flex items-center gap-1">
                ✓ Food name is available
              </p>
            ) : null}
          </div>
          <div>
            <Label className="text-amber-200 text-sm mb-2 block">Calories (kCal)</Label>
            <Input
              type="number"
              min="0"
              value={kCal}
              onChange={(e) => setKCal(Math.max(0, parseInt(e.target.value) || 0))}
              placeholder="Enter calories per unit"
              disabled={isLoading}
              className={`${inputClass} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
          </div>
        </div>

        {/* Icon */}
        <div>
          <Label className="text-amber-200 text-sm mb-2 block">Icon</Label>
          <IconSelect onSelectionChange={setIcon} />
        </div>

        {/* Dietary Information */}
        <div className="border-t border-amber-800/30 pt-4">
          <Label className="text-amber-200 text-sm mb-3 block">Dietary Information (Optional)</Label>
          <div className="space-y-3">
            <DropdownWrapper label="Preferences">
              <CustomCheckbox
                initialOptions={preferences}
                endpoint="preferences"
                onSelectionChange={setPreferences}
              />
            </DropdownWrapper>

            <DropdownWrapper label="Dietary Restrictions">
              <CustomCheckbox
                initialOptions={restrictions}
                endpoint="dietary-restrictions"
                onSelectionChange={setRestrictions}
              />
            </DropdownWrapper>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 pt-4">
          <Button 
            type="submit" 
            disabled={isLoading || confirmation.isLoading || isDuplicateName || isCheckingName}
            className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 text-white font-semibold py-3 px-8 rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Updating Food...</span>
              </>
            ) : (
              <>
                <SquarePen className="w-4 h-4" />
                <span>Update Food</span>
              </>
            )}
          </Button>
          
          <Button 
            type="button"
            onClick={handleDeleteClick}
            disabled={isLoading || confirmation.isLoading}
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </Button>
        </div>
      </form>

      {/* Confirmation Modal */}
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
