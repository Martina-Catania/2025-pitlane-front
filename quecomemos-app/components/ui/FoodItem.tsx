"use client";
import React from 'react';
import { Food } from '@/lib/contexts/FoodsContext';

interface FoodItemProps {
  food: Food;
  onEditClick: (food: Food) => void;
}

// Componente memoizado para evitar re-renders innecesarios
export const FoodItem = React.memo<FoodItemProps>(({ food, onEditClick }) => {
  return (
    <div className="bg-neutral-700 p-4 rounded-lg shadow-lg relative flex flex-col items-center border border-amber-800/30 hover:border-amber-700/50 transition-all">
      {/* Imagen */}
      {food.svgLink && (
        <img
          src={food.svgLink}
          alt={food.name}
          className="w-full h-24 object-contain mb-2"
        />
      )}

      <span className="text-amber-100 font-semibold text-center">
        {food.name}
      </span>

      {/* Ícono lápiz para editar */}
      <button
        className="absolute top-2 right-2 text-amber-300 hover:text-amber-100 bg-amber-800/20 hover:bg-amber-700/30 p-1.5 rounded-full transition-all"
        onClick={() => onEditClick(food)}
        aria-label="Editar comida"
      >
        ✏️
      </button>
    </div>
  );
});

FoodItem.displayName = 'FoodItem';