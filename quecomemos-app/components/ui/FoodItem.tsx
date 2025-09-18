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
    <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded shadow relative flex flex-col items-center">
      {/* Imagen */}
      {food.svgLink && (
        <img
          src={food.svgLink}
          alt={food.name}
          className="w-full h-24 object-contain mb-2"
        />
      )}

      <span className="text-gray-900 dark:text-gray-100 font-semibold">
        {food.name}
      </span>

      {/* Ícono lápiz para editar */}
      <button
        className="absolute top-2 right-2 text-gray-500 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
        onClick={() => onEditClick(food)}
      >
        ✏️
      </button>
    </div>
  );
});

FoodItem.displayName = 'FoodItem';