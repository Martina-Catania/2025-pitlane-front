'use client';
import React, { useState, useRef, useEffect } from "react";
import { Plus, Trash, Calculator, ChevronDown, ChevronUp } from "lucide-react";
import { API_BASE_URL } from "@/lib/config/api";

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

type Preference = {
  id: number;
  name: string;
};

type DietaryRestriction = {
  id: number;
  name: string;
};

type AddFoodFormProps = {
  initialMealName?: string;
  initialFoods?: FoodItem[];
  onFoodChanged?: () => void;
  onFoodAdded: () => void; 
};

// Componente para el dropdown wrapper
const DropdownWrapper = ({ label, children }: { label: string; children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full p-3 bg-neutral-700 border border-amber-800/30 rounded-lg text-amber-200 hover:border-amber-700/50 transition-colors"
      >
        <span>{label}</span>
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {isOpen && (
        <div className="p-3 bg-neutral-800 border border-amber-800/30 rounded-lg">
          {children}
        </div>
      )}
    </div>
  );
};

// Componente para checkboxes personalizados
const CustomCheckbox = ({ 
  initialOptions = [], 
  endpoint, 
  onSelectionChange 
}: { 
  initialOptions: number[]; 
  endpoint: string; 
  onSelectionChange: (options: number[]) => void; 
}) => {
  const [selected, setSelected] = useState<number[]>(initialOptions);
  const [options, setOptions] = useState<{id: number, name: string}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/${endpoint}`);
        const data = await res.json();
        setOptions(data || []);
      } catch (err) {
        console.error(`Error fetching ${endpoint}:`, err);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, [endpoint]);

  const toggleOption = (id: number) => {
    const newSelected = selected.includes(id)
      ? selected.filter(opt => opt !== id)
      : [...selected, id];
    
    setSelected(newSelected);
    onSelectionChange(newSelected);
  };

  if (loading) {
    return <div className="text-amber-200">Loading...</div>;
  }

  return (
    <div className="space-y-2">
      {options.map(option => (
        <label key={option.id} className="flex items-center space-x-2 text-amber-200 cursor-pointer">
          <input
            type="checkbox"
            checked={selected.includes(option.id)}
            onChange={() => toggleOption(option.id)}
            className="rounded border-amber-600 bg-neutral-700 text-amber-600 focus:ring-amber-600"
          />
          <span>{option.name}</span>
        </label>
      ))}
    </div>
  );
};

// Componente para selección de íconos
const IconSelect = ({ onSelectionChange }: { onSelectionChange: (icon: string) => void }) => {
  const [icons, setIcons] = useState<string[]>([]);
  const [selected, setSelected] = useState("");

  const selectIcon = (icon: string) => {
    setSelected(icon);
    onSelectionChange(icon);
  };

  return (
    <div>
      <label className="text-amber-200 mb-2 block">Food Icon</label>
      <div className="grid grid-cols-4 gap-2">
        {icons.map(icon => (
          <button
            key={icon}
            type="button"
            onClick={() => selectIcon(icon)}
            className={`p-3 text-2xl rounded-lg border transition-colors ${
              selected === icon
                ? 'bg-amber-700 border-amber-600'
                : 'bg-neutral-700 border-amber-800/30 hover:border-amber-700/50'
            }`}
          >
            {icon}
          </button>
        ))}
      </div>
    </div>
  );
};

// Componente para agregar alimento individual
const AddFoodCard = ({ 
  onFoodAdded 
}: { 
  onFoodAdded: (food: Omit<FoodItem, 'quantity'>) => void 
}) => {
  const [foodName, setFoodName] = useState("");
  const [kCal, setKCal] = useState<number | "">("");
  const [preferences, setPreferences] = useState<number[]>([]);
  const [restrictions, setRestrictions] = useState<number[]>([]);
  const [hasRestrictions, setHasRestrictions] = useState<boolean | null>(null);
  const [icon, setIcon] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAddFood = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!foodName || kCal === "") {
      alert("Please fill in food name and calories");
      return;
    }

    setIsLoading(true);

    try {
      const foodData = {
        name: foodName,
        kCal: Number(kCal),
        svgLink: icon,
        preferences: preferences,
        dietaryRestrictions: hasRestrictions ? restrictions : [],
        hasNoRestrictions: hasRestrictions === false
      };

      const response = await fetch(`${API_BASE_URL}/foods`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(foodData),
      });

      if (!response.ok) throw new Error("Error creating food");

      const savedFood = await response.json();
      
      // Pasar el alimento creado al componente padre
      onFoodAdded(savedFood);
      
      // Reset form
      setFoodName("");
      setKCal("");
      setPreferences([]);
      setRestrictions([]);
      setHasRestrictions(null);
      setIcon("");
      
      alert("Food added successfully!");
    } catch (error) {
      console.error("Error adding food:", error);
      alert("Error adding food. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-neutral-800 border border-amber-800/30 rounded-lg p-6 mb-6">
      <h3 className="text-amber-100 text-lg font-semibold mb-2">Add Food</h3>
      <p className="text-gray-400 mb-4">Add a new food item to the list</p>
      
      <form onSubmit={handleAddFood}>
        <div className="grid gap-4">
          <div>
            <label className="text-amber-200 block mb-2">Food Name</label>
            <input
              type="text"
              value={foodName}
              onChange={(e) => setFoodName(e.target.value)}
              required
              className="w-full p-3 bg-neutral-700 border border-amber-800/30 rounded-lg text-amber-100 placeholder:text-gray-400 focus:border-amber-600 focus:ring-amber-600/20"
              placeholder="Enter food name"
            />
          </div>

          <div>
            <label className="text-amber-200 block mb-2">Calories (kCal)</label>
            <input
              type="number"
              min="0"
              value={kCal}
              onChange={(e) => setKCal(Math.max(0, parseInt(e.target.value) || 0))}
              required
              className="w-full p-3 bg-neutral-700 border border-amber-800/30 rounded-lg text-amber-100 placeholder:text-gray-400 focus:border-amber-600 focus:ring-amber-600/20"
              placeholder="Enter calories"
            />
          </div>

          <DropdownWrapper label="Preferences">
            <CustomCheckbox
              initialOptions={preferences}
              endpoint="preferences"
              onSelectionChange={setPreferences}
            />
          </DropdownWrapper>

          <div>
            <label className="text-amber-200 mb-3 block">Does this food have dietary restrictions?</label>
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
                No restrictions (For Everyone)
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
            
            {hasRestrictions === true && (
              <DropdownWrapper label="Select Dietary Restrictions">
                <CustomCheckbox
                  initialOptions={restrictions}
                  endpoint="dietary-restrictions"
                  onSelectionChange={setRestrictions}
                />
              </DropdownWrapper>
            )}
          </div>

          <IconSelect onSelectionChange={setIcon} />
        </div>

        <div className="flex justify-center mt-4">
          <button 
            type="submit" 
            disabled={isLoading} 
            className="mt-2 bg-amber-700 hover:bg-amber-600 text-white font-medium py-2 px-6 rounded-lg transition-colors shadow-lg disabled:opacity-50"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                Adding Food...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Food
              </div>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default function AddFoodForm({ initialMealName = "", initialFoods = [], onFoodChanged, onFoodAdded }: AddFoodFormProps) {
  const [mealName, setMealName] = useState(initialMealName);
  const [foods, setFoods] = useState<FoodItem[]>(initialFoods);
  const [newFoodName, setNewFoodName] = useState("");
  const [newFoodQuantity, setNewFoodQuantity] = useState<number | "">("");
  const [newFoodKcal, setNewFoodKcal] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);

  const totalKcal = foods.reduce((acc, f) => acc + f.kCal, 0);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setShowSearch(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch foods with optional search query
  const fetchFoods = async (query?: string) => {
    try {
      let url = `${API_BASE_URL}/foods`;
      if (query && query.length >= 2) {
        url += `?search=${encodeURIComponent(query)}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      setSearchResults(data || []);
      setShowSearch(data.length > 0);
    } catch (err) {
      console.error("Error fetching foods:", err);
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

  // Handler para cuando se agrega un nuevo alimento desde AddFoodCard
  const handleNewFoodAdded = (food: Omit<FoodItem, 'quantity'>) => {
    // Agregar el nuevo alimento directamente a la lista con cantidad por defecto
    const foodWithQuantity: FoodItem = {
      ...food,
      quantity: 100 // Cantidad por defecto
    };
    setFoods([...foods, foodWithQuantity]);
    if (onFoodChanged) onFoodChanged();
  };

  // Add food to meal's food list
  const addFoodToMeal = async () => {
    if (!newFoodName || !newFoodQuantity || !newFoodKcal) {
      alert("Please fill in all food fields.");
      return;
    }

    const calculatedKcal = (Number(newFoodKcal) * Number(newFoodQuantity)) / 100;

    // Buscar si el alimento existe en los resultados
    const foundFood = searchResults.find(f => f.name.toLowerCase() === newFoodName.toLowerCase());

    let foodToAdd: FoodItem = {
      name: newFoodName,
      quantity: Number(newFoodQuantity),
      kCal: Math.round(calculatedKcal),
      svgLink: foundFood?.svgLink || "",
      preferences: foundFood?.preferences || [],
      dietaryRestrictions: foundFood?.dietaryRestrictions || [],
      hasNoRestrictions: foundFood?.hasNoRestrictions !== undefined ? foundFood.hasNoRestrictions : true
    };

    if (foundFood) {
      foodToAdd = { ...foodToAdd, id: foundFood.id };
    }

    setFoods([...foods, foodToAdd]);
    setNewFoodName("");
    setNewFoodQuantity("");
    setNewFoodKcal("");
    setShowSearch(false);
    setSearchResults([]);

    if (onFoodChanged) onFoodChanged();
  };

  const removeFood = (index: number) => {
    setFoods(foods.filter((_, i) => i !== index));
    if (onFoodChanged) onFoodChanged();
  };

  const updateFoodField = (index: number, field: keyof FoodItem, value: any) => {
    const updatedFoods = [...foods];
    updatedFoods[index] = { ...updatedFoods[index], [field]: value };

    // Recalculate kcal if quantity or kCal changes
    if (field === "quantity" || field === "kCal") {
      const q = updatedFoods[index].quantity;
      const k = updatedFoods[index].kCal;
      if (q && k) {
        updatedFoods[index].kCal = Math.round((k * q) / 100);
      }
    }

    setFoods(updatedFoods);
    if (onFoodChanged) onFoodChanged();
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
      alert("Please provide a meal name and add at least one food.");
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

      if (!response.ok) throw new Error("Error saving the meal");

      alert("Meal saved successfully!");
      setMealName("");
      setFoods([]);
      if (onFoodChanged) onFoodChanged();
      onFoodAdded();
    } catch (err) {
      console.error(err);
      alert("Error saving the meal.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Card para agregar nuevo alimento */}
      <AddFoodCard onFoodAdded={handleNewFoodAdded} />

      {/* Formulario principal para crear comida */}
      <form onSubmit={handleSubmit} className="bg-amber-800/30 p-6 rounded-xl flex flex-col gap-6">
        <input
          type="text"
          placeholder="Meal name"
          value={mealName}
          onChange={(e) => setMealName(e.target.value)}
          className="w-full p-3 rounded-lg border border-amber-700 bg-amber-900/30 text-amber-200 placeholder:text-amber-300"
          required
        />

        <div className="space-y-4">
          {/* Lista de alimentos agregados */}
          {foods.map((food, i) => (
            <div key={i} className="flex justify-between items-center bg-amber-800/20 p-3 rounded-lg gap-4">
              <input
                type="text"
                value={food.name}
                onChange={(e) => updateFoodField(i, "name", e.target.value)}
                className="flex-1 p-2 rounded-lg border bg-amber-900/30 border-amber-700 text-amber-200"
              />
              <input
                type="number"
                min={1}
                value={food.quantity}
                onChange={(e) => updateFoodField(i, "quantity", Number(e.target.value))}
                className="w-20 p-2 rounded-lg border bg-amber-900/30 border-amber-700 text-amber-200"
              />
              <input
                type="number"
                min={0}
                value={food.kCal}
                onChange={(e) => updateFoodField(i, "kCal", Number(e.target.value))}
                className="w-20 p-2 rounded-lg border bg-amber-900/30 border-amber-700 text-amber-200"
              />
              <button type="button" onClick={() => removeFood(i)} className="text-red-400 hover:text-red-300" title="Remove food">
                <Trash className="w-5 h-5" />
              </button>
            </div>
          ))}

          {/* Búsqueda y agregado de alimentos existentes */}
          <div className="relative" ref={panelRef}>
            <input
              type="text"
              placeholder="Search or add food..."
              value={newFoodName}
              onChange={handleFoodSearch}
              onFocus={handleFoodFocus}
              className="w-full p-3 rounded-lg border border-amber-700 bg-amber-900/30 text-amber-200 placeholder:text-amber-300"
            />

            {showSearch && searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-amber-800 border border-amber-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {searchResults.map((food, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => selectFood(food)}
                    className="w-full px-4 py-3 text-left hover:bg-amber-700 text-amber-200 border-b border-amber-700 last:border-b-0"
                  >
                    {food.name} - {food.kCal} kcal
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mt-4">
              <input
                type="number"
                placeholder="Quantity (g)"
                min={1}
                value={newFoodQuantity}
                onChange={(e) => setNewFoodQuantity(Number(e.target.value))}
                className="w-full p-3 rounded-lg border border-amber-700 bg-amber-900/30 text-amber-200 placeholder:text-amber-300"
              />
              <input
                type="number"
                placeholder="Kcal per 100g"
                min={0}
                value={newFoodKcal}
                onChange={(e) => setNewFoodKcal(Number(e.target.value))}
                className="w-full p-3 rounded-lg border border-amber-700 bg-amber-900/30 text-amber-200 placeholder:text-amber-300"
              />
            </div>

            {newFoodKcal && newFoodQuantity && (
              <div className="mt-2 text-amber-200 flex items-center gap-2">
                <Calculator className="w-4 h-4" /> kcal: {calculateKcalForQuantity()}
              </div>
            )}

            <button 
              type="button" 
              onClick={addFoodToMeal} 
              className="mt-2 w-full bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Food to Meal
            </button>
          </div>
        </div>

        <div className="bg-amber-700 p-4 rounded-lg flex justify-between text-amber-50 font-semibold">
          <span>Total kcal</span>
          <span>{totalKcal}</span>
        </div>

        <button 
          type="submit" 
          disabled={loading || foods.length === 0 || !mealName} 
          className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-amber-800 disabled:cursor-not-allowed text-white py-3 rounded-lg transition-colors"
        >
          {loading ? "Saving..." : "Save Meal"}
        </button>
      </form>
    </div>
  );
}