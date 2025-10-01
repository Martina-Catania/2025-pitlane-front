'use client';
import { Button } from "@/components/ui/button";
import { Trash, Utensils } from "lucide-react";
import Image from "next/image";
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
        You haven&apos;t added any food yet. Use the <b>Add Food</b> button.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {foods.map((food, i) => (
        <div
          key={`${food.name}-${i}`}
          className="bg-amber-900/30 border border-amber-700/50 rounded-lg p-4 flex items-center gap-4"
        >
          <div className="w-10 h-10 flex items-center justify-center bg-amber-800/30 rounded-full border border-amber-700/50 flex-shrink-0">
            {food.svgLink ? (
              <Image 
                src={food.svgLink} 
                alt={food.name} 
                width={24}
                height={24}
                className="w-6 h-6 object-contain" 
              />
            ) : (
              <Utensils className="w-5 h-5 text-amber-400" />
            )}
          </div>
          
          <div className="flex-grow">
            <div className="flex items-center justify-between mb-1">
              <h5 className="font-semibold text-amber-200">{food.name}</h5>
              <div className="text-sm text-amber-300">
                {food.kCal} kCal
              </div>
            </div>
            <div className="text-sm text-gray-400">
              Quantity: {food.quantity} units • {Math.round(food.kCal / food.quantity)} kCal per unit
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              type="button"
              onClick={() => onEdit(i)}
              className="bg-amber-700 hover:bg-amber-600 text-white text-sm px-3 py-1"
            >
              Edit
            </Button>
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="text-red-400 hover:text-red-300 p-2 hover:bg-red-900/20 rounded"
              title="Remove"
            >
              <Trash className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}