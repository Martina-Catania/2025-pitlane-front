"use client";
import { useState } from "react";
import { AdminFoodForm } from "@/components/ui/AdminFoodForm";
import { AddFoodForm } from "@/components/custom-components/add-food-form";
import { EditFoodForm } from "@/components/ui/EditForm";

export function AdminSection({ foods }: { foods: any[] }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedFood, setSelectedFood] = useState<any>(null);

  const handleEditClick = (food: any) => {
    setSelectedFood(food);
    setShowEditModal(true);
  };

  return (
    <div className="mt-6">
      <AdminFoodForm onAddClick={() => setShowAddModal(true)} />

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
        {foods.map((food) => (
          <div
            key={food.FoodID}
            className="bg-gray-100 dark:bg-gray-800 p-4 rounded shadow relative flex flex-col items-center"
          >
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
              onClick={() => handleEditClick(food)}
            >
              ✏️
            </button>
          </div>
        ))}
      </div>

      {/* MODAL: Agregar comida */}
      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto relative p-6">
            <button
              className="absolute top-2 right-2 text-gray-500 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
              onClick={() => setShowAddModal(false)}
            >
              ✖
            </button>
            <AddFoodForm onSuccess={() => setShowAddModal(false)} />
          </div>
        </div>
      )}

      {/* MODAL: Editar comida */}
      {showEditModal && selectedFood && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto relative p-6">
            <button
              className="absolute top-2 right-2 text-gray-500 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
              onClick={() => setShowEditModal(false)}
            >
              ✖
            </button>

            <EditFoodForm
              food={selectedFood}
              onSuccess={() => setShowEditModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
