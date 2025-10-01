'use client';
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";
import { FoodItem } from "./types";

type Props = {
  foods: FoodItem[];
  onEdit: (index: number) => void;
  onRemove: (index: number) => void;
};

export default function FoodsList({ foods, onEdit, onRemove }: Props) {
  if (foods.length === 0) {
    return (
      <div className="text-amber-300/90 text-sm bg-neutral-800/60 border border-amber-800/40 rounded-lg p-3">
        You haven't added any food yet. Use the <b>Add Food</b> button.
      </div>
    );
  }

  const pill =
    "text-xs bg-neutral-800/60 border border-amber-800/40 text-amber-300 px-2 py-0.5 rounded";

  return (
    <div className="space-y-2">
      {foods.map((food, i) => (
        <div
          key={`${food.name}-${i}`}
          className="flex items-center justify-between gap-2 bg-neutral-800/60 border border-amber-800/40 rounded-lg p-2"
        >
          <div className="flex items-center gap-3">
            <span className="text-amber-100 font-medium">{food.name}</span>
            <span className={pill}>{food.quantity} g</span>
            <span className={pill}>{food.kCal} kcal</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={() => onEdit(i)}
              className="bg-neutral-700 hover:bg-neutral-600 text-amber-50"
            >
              Editar
            </Button>
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="text-red-400 hover:text-red-300 p-2"
              title="Eliminar"
            >
              <Trash className="w-5 h-5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}