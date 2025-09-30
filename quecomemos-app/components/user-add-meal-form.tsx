'use client';
import React, { useState, useRef, useEffect } from "react";
import { Plus, Trash, Calculator } from "lucide-react";
import { API_BASE_URL } from "@/lib/config/api";

type AddFoodFormProps = {
  onFoodAdded?: () => void;
};

type FoodItem = {
  id?: number;
  name: string;
  quantity: number;
  kCal: number;
  svgLink?: string;
  preferences?: number[];
  dietaryRestrictions?: number[];
  hasNoRestrictions?: boolean;
};

export function AddFoodForm({ onFoodAdded }: AddFoodFormProps) {
  const [mealName, setMealName] = useState("");
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [newFoodName, setNewFoodName] = useState("");
  const [newFoodQuantity, setNewFoodQuantity] = useState<number | "">("");
  const [newFoodKcal, setNewFoodKcal] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);

  const totalKcal = foods.reduce((acc, f) => acc + f.kCal, 0);

  // Cerrar el desplegable al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setShowSearch(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Traer alimentos
  const fetchFoods = async (query?: string) => {
    try {
      let url = `${API_BASE_URL}/foods`;
      if (query && query.length >= 2) {
        url += `?search=${query}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      setSearchResults(data || []);
      setShowSearch(data.length > 0);
    } catch (err) {
      console.error("Error trayendo alimentos:", err);
      setSearchResults([]);
      setShowSearch(false);
    }
  };

  const handleFoodSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewFoodName(value);
    if (value.length >= 2) {
      fetchFoods(value);
    } else if (value === "") {
      fetchFoods();
    } else {
      setSearchResults([]);
      setShowSearch(false);
    }
  };

  const handleFoodFocus = () => {
    if (!newFoodName) fetchFoods();
  };

  const selectFood = (food: FoodItem) => {
    setNewFoodName(food.name);
    setNewFoodKcal(food.kCal);
    setShowSearch(false);
    setSearchResults([]);
  };

  const addFoodToMeal = () => {
    if (!newFoodName || !newFoodQuantity || !newFoodKcal) {
      alert("Completa todos los campos del alimento");
      return;
    }

    const calculatedKcal = (Number(newFoodKcal) * Number(newFoodQuantity)) / 100;

    setFoods([
      ...foods,
      {
        name: newFoodName,
        quantity: Number(newFoodQuantity),
        kCal: Math.round(calculatedKcal),
        svgLink: "",
        preferences: [],
        dietaryRestrictions: [],
        hasNoRestrictions: true
      }
    ]);

    setNewFoodName("");
    setNewFoodQuantity("");
    setNewFoodKcal("");
  };

  const removeFood = (index: number) => {
    setFoods(foods.filter((_, i) => i !== index));
  };

  const calculateKcalForQuantity = () => {
    if (newFoodKcal && newFoodQuantity) {
      return Math.round((Number(newFoodKcal) * Number(newFoodQuantity)) / 100);
    }
    return 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!mealName || foods.length === 0) {
      alert("Agrega un nombre y al menos un alimento");
      return;
    }
    setLoading(true);

    try {
      const foodsPayload = foods.map(f => ({
        id: f.id,
        name: f.name,
        kCal: f.kCal,
        svgLink: f.svgLink || "",
        preferences: f.preferences || [],
        dietaryRestrictions: f.dietaryRestrictions || [],
        hasNoRestrictions: f.hasNoRestrictions !== undefined ? f.hasNoRestrictions : true,
        quantity: f.quantity
      }));

      const response = await fetch(`${API_BASE_URL}/meals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: mealName, foods: foodsPayload }),
      });

      if (!response.ok) throw new Error("Error al guardar la comida");

      setMealName("");
      setFoods([]);
      if (onFoodAdded) onFoodAdded();
      alert("¡Comida creada exitosamente!");
    } catch (err) {
      console.error(err);
      alert("Error al crear la comida");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (foods.length > 0) {
      setMealName(foods.map(f => f.name).join(" + "));
    } else {
      setMealName("");
    }
  }, [foods]);

  return (
    <form onSubmit={handleSubmit} className="bg-amber-800/30 p-6 rounded-xl flex flex-col gap-6">
      <input
        type="text"
        placeholder="Nombre de la comida"
        value={mealName}
        onChange={(e) => setMealName(e.target.value)}
        className="w-full p-3 rounded-lg border border-amber-700 bg-amber-900/30 text-amber-200"
      />

      <div className="space-y-4">
        {foods.map((food, i) => (
          <div key={i} className="flex justify-between items-center bg-amber-800/20 p-3 rounded-lg">
            <div>
              <span className="text-amber-200 font-medium">{food.name}</span>
              <span className="text-amber-300 text-sm">{food.quantity}g • {food.kCal} kcal</span>
            </div>
            <button type="button" onClick={() => removeFood(i)} className="text-red-400"><Trash className="w-4 h-4" /></button>
          </div>
        ))}

        <div className="relative" ref={panelRef}>
          <input
            type="text"
            placeholder="Buscar alimento..."
            value={newFoodName}
            onChange={handleFoodSearch}
            onFocus={handleFoodFocus}
            className="w-full p-3 rounded-lg border border-amber-700 bg-amber-900/30 text-amber-200"
          />

          {showSearch && searchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-amber-800 border border-amber-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {searchResults.map((food, i) => (
                <button key={i} type="button" onClick={() => selectFood(food)} className="w-full px-4 py-3 text-left hover:bg-amber-700 text-amber-200">
                  {food.name} - {food.kCal} kcal
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mt-4">
            <input type="number" placeholder="Cantidad (g)" value={newFoodQuantity} onChange={(e) => setNewFoodQuantity(Number(e.target.value))} className="w-full p-3 rounded-lg border border-amber-700 bg-amber-900/30 text-amber-200"/>
            <input type="number" placeholder="Kcal por 100g" value={newFoodKcal} onChange={(e) => setNewFoodKcal(Number(e.target.value))} className="w-full p-3 rounded-lg border border-amber-700 bg-amber-900/30 text-amber-200"/>
          </div>

          {newFoodKcal && newFoodQuantity && (
            <div className="mt-2 text-amber-200 flex items-center gap-2">
              <Calculator className="w-4 h-4"/> Kcal: {calculateKcalForQuantity()}
            </div>
          )}

          <button type="button" onClick={addFoodToMeal} className="mt-2 w-full bg-amber-600 text-white py-2 rounded-lg flex items-center justify-center gap-2">
            <Plus className="w-4 h-4"/> Agregar
          </button>
        </div>
      </div>

      <div className="bg-amber-700 p-4 rounded-lg flex justify-between text-amber-50 font-semibold">
        <span>Total kcal</span>
        <span>{totalKcal}</span>
      </div>

      <button type="submit" disabled={loading || foods.length === 0 || !mealName} className="w-full bg-amber-500 text-white py-3 rounded-lg">{loading ? "Saving..." : "Create food"}</button>
    </form>
  );
}