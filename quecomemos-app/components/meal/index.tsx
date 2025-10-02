'use client';
import { useState } from "react";
import { API_BASE_URL } from "@/lib/config/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUser } from "@/lib/contexts/UserContext";
import { useMealNameSuggestion } from "./hooks/useMealNameSuggestion";
import { useGlobalNotification } from "@/lib/contexts/NotificationContext";
import { AddMealFormProps, FoodItem } from "./types";
import FoodsList from "./FoodsList";
import MealExtras from "./MealExtras";
import FoodModal from "./FoodModal";
import FoodChoiceModal from "./FoodChoiceModal";

// Export reusable components
export { default as MealCard } from "./MealCard";

type Props = AddMealFormProps & { onClose?: () => void };
export default function AddMealForm({ onFoodAdded, onClose }: Props) {
  const { userData } = useUser();
  const { showSuccess, showError } = useGlobalNotification();
  
  // meal
  const [mealName, setMealName] = useState("");
  const [description, setDescription] = useState("");
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [showMealExtras] = useState(false);
  const [mealPreferences, setMealPreferences] = useState<number[]>([]);
  const [mealRestrictions, setMealRestrictions] = useState<number[]>([]);
  const [mealHasRestrictions, setMealHasRestrictions] = useState(false);

  const [openModal, setOpenModal] = useState(false);
  const [openChoiceModal, setOpenChoiceModal] = useState(false);
  const [foodActionType, setFoodActionType] = useState<'create' | 'search'>('create');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const [modalName, setModalName] = useState("");
  const [modalQuantity, setModalQuantity] = useState<number | "">("");
  const [modalKcalPerUnit, setModalKcalPerUnit] = useState<number | "">("");
  const [createPreferences, setCreatePreferences] = useState<number[]>([]);
  const [createRestrictions, setCreateRestrictions] = useState<number[]>([]);
  const [createHasRestrictions, setCreateHasRestrictions] = useState<boolean | null>(null);
  const [createIcon, setCreateIcon] = useState<string>("");

  const inputClass =
    "w-full p-3 rounded-lg border border-amber-700 bg-amber-800 text-amber-100 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500";

  const totalKcal = foods.reduce((acc, f) => acc + f.kCal, 0);
  const suggestedMealName = useMealNameSuggestion(foods);

  const openAddFoodModal = (index: number | null = null) => {
    setEditingIndex(index);
    if (index !== null) {
      // When editing, go directly to the food modal
      const item = foods[index];
      setModalName(item.name);
      setModalQuantity(item.quantity);
      
      // Use stored kcalPerUnit if available, otherwise default to 1 for editing
      const kcalPerUnit = item.kcalPerUnit || 1;
      setModalKcalPerUnit(kcalPerUnit);
      
      // Preserve the icon
      setCreateIcon(item.svgLink || "");
      
      // For existing foods (those with an ID), preserve their current restrictions
      // and set hasNoRestrictions based on whether they have the "For All" restriction (ID 0)
      if (item.id) {
        // Existing food - preserve current state and check restrictions
        setCreatePreferences(item.preferences || []);
        setCreateRestrictions(item.dietaryRestrictions || []);
        
        // Check if food has "For All" restriction (ID 0) or no restrictions
        const hasForAllRestriction = item.dietaryRestrictions?.includes(0);
        const hasOtherRestrictions = item.dietaryRestrictions?.some(r => r !== 0);
        
        if (hasForAllRestriction && !hasOtherRestrictions) {
          // Food is "For All" 
          setCreateHasRestrictions(true);
        } else if (hasOtherRestrictions) {
          // Food has specific restrictions
          setCreateHasRestrictions(false);
        } else {
          // Food has no restrictions defined
          setCreateHasRestrictions(null);
        }
      } else {
        // New food (temporary) - preserve existing state
        setCreatePreferences(item.preferences || []);
        setCreateRestrictions(item.dietaryRestrictions || []);
        setCreateHasRestrictions(item.hasNoRestrictions ?? null);
      }
      
      setOpenModal(true);
    } else {
      // When adding new, show choice modal first
      setOpenChoiceModal(true);
    }
  };

  const closeChoiceModal = () => setOpenChoiceModal(false);
  
  const handleCreateNew = () => {
    setFoodActionType('create');
    setModalName(""); 
    setModalQuantity(1); 
    setModalKcalPerUnit(1);
    setCreateIcon("");
    setCreatePreferences([]);
    setCreateRestrictions([]);
    setCreateHasRestrictions(null);
    setOpenChoiceModal(false);
    setOpenModal(true);
  };

  const handleSearchExisting = () => {
    setFoodActionType('search');
    setModalName(""); 
    setModalQuantity(1); 
    setModalKcalPerUnit(1);
    setCreateIcon("");
    setCreatePreferences([]);
    setCreateRestrictions([]);
    setCreateHasRestrictions(null);
    setOpenChoiceModal(false);
    setOpenModal(true);
  };
  const closeModal = () => setOpenModal(false);

  const handleConfirmFood = (payload: FoodItem) => {
    // Add preferences and restrictions from form state to the food item
    // Properly set hasNoRestrictions based on whether restrictions are selected
    const hasRestrictions = createRestrictions && createRestrictions.length > 0;
    const enrichedPayload = {
      ...payload,
      preferences: createPreferences,
      dietaryRestrictions: createRestrictions,
      hasNoRestrictions: hasRestrictions ? false : (createHasRestrictions === true ? true : createHasRestrictions)
    };

    if (editingIndex !== null) {
      // Editing existing food
      setFoods(prev => {
        const clone = [...prev]; 
        clone[editingIndex] = enrichedPayload; 
        return clone;
      });
      showSuccess(
        "Food Updated",
        `"${payload.name}" has been updated.`
      );
      return;
    }
    
    // Adding new food - check for duplicates
    const existingFood = foods.find(food => 
      food.name.toLowerCase() === payload.name.toLowerCase()
    );
    
    if (existingFood) {
      // Food already exists, show error
      showError(
        "Food Already Added",
        `"${payload.name}" is already in this meal.`
      );
      return;
    }
    
    // New food, add to list
    setFoods(prev => [...prev, enrichedPayload]);
    showSuccess(
      "Food Added Successfully",
      `"${payload.name}" has been added to the meal.`
    );
  };

  const removeFood = (index: number) => setFoods(foods.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealName || foods.length === 0) {
      showError(
        "Incomplete Meal Information",
        "Please provide a meal name and add at least one food item."
      );
      return;
    }

    if (!userData?.profile?.id) {
      showError(
        "Authentication Required",
        "You must be logged in to create meals."
      );
      return;
    }

    setLoading(true);
    try {
      // First, create all foods that don't exist yet and collect meal foods with quantities
      const mealFoods: { foodId: number; quantity: number }[] = [];
      
      for (const food of foods) {
        let foodId: number;

        if (food.id) {
          // Food already exists, use its ID
          foodId = food.id;
        } else {
          // Check if food with this name already exists
          try {
            const existingFoodsResponse = await fetch(`${API_BASE_URL}/foods`, {
              method: "GET",
              headers: { "Content-Type": "application/json" },
            });
            
            if (existingFoodsResponse.ok) {
              const existingFoods = await existingFoodsResponse.json();
              const existingFood = existingFoods.find((f: { name: string; FoodID: number }) => f.name.toLowerCase() === food.name.toLowerCase());
              
              if (existingFood) {
                // Food already exists, use its ID
                foodId = existingFood.FoodID;
              } else {
                // Create new food
                const foodResponse = await fetch(`${API_BASE_URL}/foods`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    name: food.name,
                    kCal: food.kcalPerUnit || (food.kCal / food.quantity), // Use kcalPerUnit for API
                    svgLink: food.svgLink || "",
                    preferences: food.preferences || [],
                    dietaryRestrictions: food.hasNoRestrictions === true ? [0] : (food.dietaryRestrictions || []),
                    hasNoRestrictions: food.hasNoRestrictions === true ? true : (food.dietaryRestrictions && food.dietaryRestrictions.length > 0 ? false : true),
                    profileId: userData.profile.id,
                  }),
                });
                
                if (!foodResponse.ok) {
                  const errorData = await foodResponse.json().catch(() => ({}));
                  throw new Error(`Failed to create food: ${food.name} - ${errorData.error || 'Unknown error'}`);
                }
                
                const createdFood = await foodResponse.json();
                foodId = createdFood.FoodID;
              }
            } else {
              throw new Error('Failed to check existing foods');
            }
          } catch (error) {
            console.error('Error processing food:', error);
            throw new Error(`Failed to process food: ${food.name}`);
          }
        }

        // Add to meal foods with quantity
        mealFoods.push({
          foodId: foodId,
          quantity: food.quantity
        });
      }

      console.log('=== FRONTEND MEAL CREATION DEBUG ===');
      console.log('Sending meal with mealFoods:', mealFoods);

      // Now create the meal with the food IDs and quantities
      const mealResponse = await fetch(`${API_BASE_URL}/meals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: mealName,
          description,
          profileId: userData.profile.id,
          mealFoods: mealFoods,
        }),
      });

      if (!mealResponse.ok) {
        const errorData = await mealResponse.json().catch(() => ({}));
        throw new Error(`Failed to create meal: ${errorData.error || 'Unknown error'}`);
      }

      showSuccess(
        "Meal Created Successfully!",
        `"${mealName}" has been saved with ${foods.length} food${foods.length !== 1 ? 's' : ''}.`
      );
      if (onFoodAdded) onFoodAdded();
      if (onClose) onClose();

      setMealName(""); 
      setDescription(""); 
      setFoods([]);
    } catch (err) {
      console.error(err);
      showError(
        "Failed to Create Meal",
        err instanceof Error ? err.message : "An unexpected error occurred while creating the meal."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-amber-900/40 border-amber-700/30 rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-2">
        <div />
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-amber-300 hover:text-amber-100 text-sm underline"
          >
            Cancel
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* nombre + sugerencia */}
        <div>
          <input
            type="text"
            placeholder="Meal Name"
            value={mealName}
            onChange={(e) => setMealName(e.target.value)}
            className={inputClass}
          />
          {!mealName && suggestedMealName && (
            <div className="mt-1 text-sm text-amber-300 flex items-center gap-2">
              <span className="opacity-80">Suggestion:</span>
              <span className="px-2 py-0.5 rounded bg-neutral-800 border border-amber-800/40 text-amber-100">
                {suggestedMealName}
              </span>
              <button
                type="button"
                onClick={() => setMealName(suggestedMealName)}
                className="text-xs px-2 py-0.5 rounded bg-amber-600 hover:bg-amber-700 text-white"
              >
                Use
              </button>
            </div>
          )}
        </div>

        {showMealExtras && (
          <MealExtras
            inputClass={inputClass}
            description={description}
            setDescription={setDescription}
            mealPreferences={mealPreferences}
            setMealPreferences={setMealPreferences}
            mealHasRestrictions={mealHasRestrictions}
            setMealHasRestrictions={setMealHasRestrictions}
            mealRestrictions={mealRestrictions}
            setMealRestrictions={setMealRestrictions}
            MealIconSlot={<div></div>}
          />
        )}

        {/* Foods */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-amber-100 font-semibold">Foods ({foods.length})</h3>
            <Button
              type="button"
              onClick={() => openAddFoodModal(null)}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              + Add food
            </Button>
          </div>

          <FoodsList
            foods={foods}
            onEdit={(i) => openAddFoodModal(i)}
            onRemove={removeFood}
          />
        </div>

        {/* total + guardar */}
        <div className="flex items-center justify-between bg-amber-700 p-3 rounded-lg text-amber-50 font-semibold">
          <span>Total kcal</span><span>{totalKcal}</span>
        </div>
        <button
          type="submit"
          disabled={loading || foods.length === 0 || !mealName}
          className="w-full bg-amber-900/40 border border-amber-700/30 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold"
        >
          {loading ? "Saving..." : "Save Meal"}
        </button>
      </form>

      {/* Choice Modal */}
      <FoodChoiceModal
        open={openChoiceModal}
        onClose={closeChoiceModal}
        onCreateNew={handleCreateNew}
        onSearchExisting={handleSearchExisting}
        title="Add Food to Meal"
      />

      {/* Food Modal */}
      <FoodModal
        apiBase={API_BASE_URL}
        open={openModal}
        onClose={closeModal}
        editingItem={editingIndex !== null ? foods[editingIndex] : null}
        onConfirm={handleConfirmFood}
        createPreferences={createPreferences}
        setCreatePreferences={setCreatePreferences}
        createRestrictions={createRestrictions}
        setCreateRestrictions={setCreateRestrictions}
        createHasRestrictions={createHasRestrictions}
        setCreateHasRestrictions={setCreateHasRestrictions}
        createIcon={createIcon}
        setCreateIcon={setCreateIcon}
        quantity={modalQuantity}
        setQuantity={setModalQuantity}
        kcalPerUnit={modalKcalPerUnit}
        setKcalPerUnit={setModalKcalPerUnit}
        name={modalName}
        setName={setModalName}
        actionType={foodActionType}
      />
    </Card>
  );
}