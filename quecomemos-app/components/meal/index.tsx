'use client';
import { useState } from "react";
import { API_BASE_URL } from "@/lib/config/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUser } from "@/lib/contexts/UserContext";
import { useMealNameSuggestion } from "./hooks/useMealNameSuggestion";
import { AddMealFormProps, FoodItem } from "./types";
import FoodsList from "./FoodsList";
import MealExtras from "./MealExtras";
import FoodModal from "./FoodModal";

type Props = AddMealFormProps & { onClose?: () => void };
export default function AddMealForm({ onFoodAdded, onClose }: Props) {
  const { userData } = useUser();
  
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
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const [modalName, setModalName] = useState("");
  const [modalQuantity, setModalQuantity] = useState<number | "">("");
  const [modalKcal100, setModalKcal100] = useState<number | "">("");
  const [createPreferences, setCreatePreferences] = useState<number[]>([]);
  const [createRestrictions, setCreateRestrictions] = useState<number[]>([]);
  const [createHasRestrictions, setCreateHasRestrictions] = useState(false);
  const [createIcon, setCreateIcon] = useState<string>("");

  const inputClass =
    "w-full p-3 rounded-lg border border-amber-700 bg-amber-800 text-amber-100 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500";

  const totalKcal = foods.reduce((acc, f) => acc + f.kCal, 0);
  const suggestedMealName = useMealNameSuggestion(foods);

  const openAddFoodModal = (index: number | null = null) => {
    setEditingIndex(index);
    if (index !== null) {
      const item = foods[index];
      setModalName(item.name);
      setModalQuantity(item.quantity);
      setModalKcal100("");
    } else {
      setModalName(""); setModalQuantity(""); setModalKcal100("");
    }
    setOpenModal(true);
  };
  const closeModal = () => setOpenModal(false);

  const handleConfirmFood = (payload: FoodItem) => {
    setFoods(prev => {
      if (editingIndex !== null) {
        const clone = [...prev]; clone[editingIndex] = payload; return clone;
      }
      return [...prev, payload];
    });
  };

  const removeFood = (index: number) => setFoods(foods.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealName || foods.length === 0) {
      alert("Poné un nombre y al menos un alimento.");
      return;
    }

    if (!userData?.profile?.id) {
      alert("You must be logged in to create meals");
      return;
    }

    setLoading(true);
    try {
      // First, create all foods that don't exist yet and collect their IDs
      const foodIds: number[] = [];
      
      for (const food of foods) {
        // If the food has an id, it's an existing food
        if (food.id) {
          foodIds.push(Number(food.id));
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
                foodIds.push(existingFood.FoodID);
                continue;
              }
            }
          } catch (error) {
            console.warn('Error checking existing foods:', error);
          }
          
          // Create new food only if it doesn't exist
          const foodResponse = await fetch(`${API_BASE_URL}/foods`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: food.name,
              kCal: food.kCal,
              svgLink: food.svgLink || "",
              preferences: [],
              dietaryRestrictions: [],
              hasNoRestrictions: true,
              profileId: userData.profile.id,
            }),
          });
          
          if (!foodResponse.ok) {
            const errorData = await foodResponse.json().catch(() => ({}));
            if (foodResponse.status === 409) {
              // Food already exists, try to get it by name
              try {
                const allFoodsResponse = await fetch(`${API_BASE_URL}/foods`);
                if (allFoodsResponse.ok) {
                  const allFoods = await allFoodsResponse.json();
                  const existingFood = allFoods.find((f: { name: string; FoodID: number }) => f.name.toLowerCase() === food.name.toLowerCase());
                  if (existingFood) {
                    foodIds.push(existingFood.FoodID);
                    continue;
                  }
                }
              } catch (retryError) {
                console.error('Error retrieving existing food:', retryError);
              }
            }
            throw new Error(`Failed to create food: ${food.name} - ${errorData.error || 'Unknown error'}`);
          }
          
          const createdFood = await foodResponse.json();
          foodIds.push(createdFood.FoodID);
        }
      }

      // Now create the meal with the food IDs
      const mealResponse = await fetch(`${API_BASE_URL}/meals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: mealName,
          description,
          profileId: userData.profile.id,
          foodIds: foodIds,
        }),
      });

      if (!mealResponse.ok) {
        throw new Error("Failed to create meal");
      }

      alert("Meal guardada con éxito");
      if (onFoodAdded) onFoodAdded();
      if (onClose) onClose();

      setMealName(""); 
      setDescription(""); 
      setFoods([]);
    } catch (err) {
      console.error(err);
      alert("Error guardando la meal");
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

        {/* lista + agregar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-amber-100 font-semibold">Foods</h3>
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

      {/* Modal */}
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
        kcalPer100={modalKcal100}
        setKcalPer100={setModalKcal100}
        name={modalName}
        setName={setModalName}
      />
    </Card>
  );
}