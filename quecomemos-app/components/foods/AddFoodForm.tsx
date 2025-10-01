'use client';
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash } from "lucide-react";
import { API_BASE_URL } from "@/lib/config/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DropdownWrapper } from "@/components/custom-components/dropdown-wrapper";
import { CustomCheckbox } from "@/components/custom-components/custom-checkbox";
import { IconSelect } from "@/components/custom-components/icon-select";
import { Label } from "@/components/ui/label";

export type FoodItem = {
  name: string;
  quantity: number;
  kCal: number;
};

interface AddMealFormProps {
  onFoodAdded?: () => void;
}

export default function AddMealForm({ onFoodAdded }: AddMealFormProps) {
  const [mealName, setMealName] = useState("");
  const [description, setDescription] = useState("");
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [newFoodName, setNewFoodName] = useState("");
  const [newFoodQuantity, setNewFoodQuantity] = useState<number | "">("");
  const [newFoodKcal, setNewFoodKcal] = useState<number | "">("");
  const [loading, setLoading] = useState(false);

  // Opciones adicionales
  const [preferences, setPreferences] = useState<number[]>([]);
  const [restrictions, setRestrictions] = useState<number[]>([]);
  const [hasRestrictions, setHasRestrictions] = useState(false);
  const [icon, setIcon] = useState<string>("");

  // Buscador
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const inputClass =
    "w-full p-3 rounded-lg border border-amber-700 bg-amber-800 text-amber-100 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500";

  const totalKcal = foods.reduce((acc, f) => acc + f.kCal, 0);

  // Fetch foods para buscador
 const handleFoodSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const query = e.target.value;
  setNewFoodName(query);

  if (!query) {
    setSearchResults([]);
    setShowSearch(false);
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/foods`);
    const allFoods: FoodItem[] = await res.json();

    // filtramos en el front
    const filtered = allFoods.filter(f =>
      f.name.toLowerCase().includes(query.toLowerCase())
    );

    setSearchResults(filtered);
    setShowSearch(filtered.length > 0);
  } catch {
    setSearchResults([]);
    setShowSearch(false);
  }
};

  const selectFood = (food: FoodItem) => {
    setNewFoodName(food.name);
    setNewFoodKcal(food.kCal);
    setShowSearch(false);
    setSearchResults([]);
  };

  const addFoodToMeal = () => {
    if (!newFoodName || !newFoodQuantity || !newFoodKcal) {
      alert("Please fill in all food fields.");
      return;
    }
    const calculatedKcal = Math.round((Number(newFoodKcal) * Number(newFoodQuantity)) / 100);
    setFoods([...foods, { name: newFoodName, quantity: Number(newFoodQuantity), kCal: calculatedKcal }]);
    setNewFoodName("");
    setNewFoodQuantity("");
    setNewFoodKcal("");
  };

  const removeFood = (index: number) => {
    setFoods(foods.filter((_, i) => i !== index));
  };

  const updateFoodField = (index: number, field: keyof FoodItem, value: any) => {
    const updated = [...foods];
    updated[index] = { ...updated[index], [field]: value };
    setFoods(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealName || foods.length === 0) {
      alert("Provide a meal name and at least one food.");
      return;
    }
    setLoading(true);
    try {
      await fetch(`${API_BASE_URL}/meals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: mealName,
          description,
          foods,
          preferences,
          dietaryRestrictions: hasRestrictions ? restrictions : [],
          svgLink: icon ?? "",
          hasNoRestrictions: !hasRestrictions
        }),
      });
      alert("Meal saved successfully!");
      setMealName("");
      setDescription("");
      setFoods([]);
      setPreferences([]);
      setRestrictions([]);
      setHasRestrictions(false);
      setIcon("");
      if (onFoodAdded) onFoodAdded();
    } catch (err) {
      console.error(err);
      alert("Error saving meal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-amber-900/40 border-amber-700/30 rounded-xl shadow-lg p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Meal Name & Description */}
        <input
          type="text"
          placeholder="Meal Name"
          value={mealName}
          onChange={(e) => setMealName(e.target.value)}
          className={inputClass}
          required
        />
        <input
          type="text"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={inputClass}
        />

        {/* Existing Foods */}
        {foods.map((food, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input type="text" value={food.name} onChange={(e) => updateFoodField(i, "name", e.target.value)} className={inputClass} />
            <input type="number" min={1} value={food.quantity} onChange={(e) => updateFoodField(i, "quantity", Number(e.target.value))} className={inputClass + " w-24"} />
            <input type="number" min={0} value={food.kCal} onChange={(e) => updateFoodField(i, "kCal", Number(e.target.value))} className={inputClass + " w-24"} />
            <button type="button" onClick={() => removeFood(i)} className="text-red-400 hover:text-red-300 p-2">
              <Trash className="w-5 h-5" />
            </button>
          </div>
        ))}

        {/* Add New Food */}
        <Card className="bg-neutral-800 border-amber-800/50 mt-4">
        <CardContent className="space-y-4">
        <div className="mt-4 space-y-2">
          <h3 className="text-amber-100 font-semibold text-lg">Add New Food</h3>
          <div className="relative">
            <input
              type="text"
              placeholder="Search food..."
              value={newFoodName}
              onChange={handleFoodSearch}
              className={inputClass}
            />
            {showSearch && searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-amber-800 border border-amber-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {searchResults.map((food, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => selectFood(food)}
                    className="w-full text-left px-4 py-2 hover:bg-amber-700 text-amber-100 border-b border-amber-700 last:border-b-0 transition-colors"
                  >
                    {food.name} - {food.kCal} kcal
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
            <input
              type="number"
              placeholder="Quantity (g)"
              min={1}
              value={newFoodQuantity}
              onChange={(e) => setNewFoodQuantity(Number(e.target.value))}
              className={inputClass}
            />
            <input
              type="number"
              placeholder="Kcal per 100g"
              min={0}
              value={newFoodKcal}
              onChange={(e) => setNewFoodKcal(Number(e.target.value))}
              className={inputClass}
            />
          </div>
        </div>

        {/* Food Options */}
          <CardContent className="space-y-4">
            <DropdownWrapper label="Preferences">
              <CustomCheckbox
                initialOptions={preferences}
                endpoint="preferences"
                onSelectionChange={setPreferences}
              />
            </DropdownWrapper>

            <div>
              <Label className="text-amber-200 mb-3 block">Dietary Restrictions</Label>
              <div className="flex gap-4 mb-4">
                <button
                  type="button"
                  onClick={() => setHasRestrictions(false)}
                  className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                    hasRestrictions === false
                      ? 'bg-amber-700 border-amber-600 text-white'
                      : 'bg-neutral-700 border-amber-800/30 text-amber-200 hover:border-amber-700/50'
                  }`}
                >
                  No restrictions
                </button>
                <button
                  type="button"
                  onClick={() => setHasRestrictions(true)}
                  className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                    hasRestrictions === true
                      ? 'bg-amber-700 border-amber-600 text-white'
                      : 'bg-neutral-700 border-amber-800/30 text-amber-200 hover:border-amber-700/50'
                  }`}
                >
                  Has restrictions
                </button>
              </div>

              {hasRestrictions && (
                <DropdownWrapper label="Select Dietary Restrictions">
                  <CustomCheckbox
                    initialOptions={restrictions}
                    endpoint="dietary-restrictions/excluding-for-everyone"
                    onSelectionChange={setRestrictions}
                  />
                </DropdownWrapper>
              )}
            </div>

            <div>
              <Label className="text-amber-200 mb-2 block">Icon (SVG link)</Label>
              <IconSelect onSelectionChange={setIcon} />
            </div>

            <div className="flex justify-between items-center bg-amber-700 p-3 rounded-lg text-amber-50 font-semibold">
              <span>Total kcal</span>
              <span>{totalKcal}</span>
            </div>
            <button
            type="button"
            onClick={addFoodToMeal}
            className="mt-2 w-full bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-lg flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Food
          </button>
            </CardContent>
          </CardContent>
        </Card>
            <button
              type="submit"
              disabled={loading || foods.length === 0 || !mealName}
              className="w-full bg-amber-900/40 border-amber-700/30 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold"
            >
              {loading ? "Saving..." : "Save Meal"}
            </button>
      </form>
    </Card>
  );
}