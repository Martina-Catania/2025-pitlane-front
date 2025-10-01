'use client';
import { useState } from "react";
import { API_BASE_URL } from "@/lib/config/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IconSelect } from "@/components/custom-components/icon-select";
import { useMealNameSuggestion } from "./hooks/useMealNameSuggestion";
import { AddMealFormProps, FoodItem } from "./types";
import FoodsList from "./FoodsList";
import MealExtras from "./MealExtras";
import FoodModal from "./FoodModal";

type Props = AddMealFormProps & { onClose?: () => void };
export default function AddMealForm({ onFoodAdded, onClose }: Props) {
  // meal
  const [mealName, setMealName] = useState("");
  const [description, setDescription] = useState("");
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [showMealExtras, setShowMealExtras] = useState(false);
  const [mealPreferences, setMealPreferences] = useState<number[]>([]);
  const [mealRestrictions, setMealRestrictions] = useState<number[]>([]);
  const [mealHasRestrictions, setMealHasRestrictions] = useState(false);
  const [mealIcon, setMealIcon] = useState<string>("");

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
    setLoading(true);
    try {
      await fetch(`${API_BASE_URL}/meals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: mealName,
          description,
          foods,
          preferences: mealPreferences,
          dietaryRestrictions: mealHasRestrictions ? mealRestrictions : [],
          svgLink: mealIcon ?? "",
          hasNoRestrictions: !mealHasRestrictions,
        }),
      });
      alert("Meal guardada con éxito");
if (onFoodAdded) onFoodAdded();
if (onClose) onClose();

      setMealName(""); setDescription(""); setFoods([]);
      if (onFoodAdded) onFoodAdded();
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
      Cancelar
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
              <span className="opacity-80">Sugerencia:</span>
              <span className="px-2 py-0.5 rounded bg-neutral-800 border border-amber-800/40 text-amber-100">
                {suggestedMealName}
              </span>
              <button
                type="button"
                onClick={() => setMealName(suggestedMealName)}
                className="text-xs px-2 py-0.5 rounded bg-amber-600 hover:bg-amber-700 text-white"
              >
                Usar
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
            MealIconSlot={
              <div>
                <label className="text-amber-200 mb-2 block">Icon (SVG link) – meal</label>
                <IconSelect onSelectionChange={setMealIcon} />
              </div>
            }
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