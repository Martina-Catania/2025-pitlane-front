"use client";
import { useState } from "react";
import { AdminFoodForm } from "@/components/ui/AdminFoodForm";
import { AddFoodForm } from "@/components/custom-components/add-food-form";
import { EditFoodForm } from "@/components/ui/EditForm";
import { FoodItem } from "@/components/ui/FoodItem";
import { useFoods, Food } from "@/lib/contexts/FoodsContext";

export function AdminSection() {
  const { foods } = useFoods();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);

  const handleEditClick = (food: Food) => {
    setSelectedFood(food);
    setShowEditModal(true);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedFood(null);
  };

  return (
    <div className="mt-6">
      <AdminFoodForm onAddClick={() => setShowAddModal(true)} />

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
        {foods.map((food) => (
          <FoodItem
            key={food.FoodID}
            food={food}
            onEditClick={handleEditClick}
          />
        ))}
      </div>

      {/* MODAL: Agregar comida */}
      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto relative p-6">
            <button
              className="absolute top-2 right-2 text-gray-500 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
              onClick={handleCloseAddModal}
            >
              ✖
            </button>
            <AddFoodForm onSuccess={handleCloseAddModal} />
          </div>
        </div>
      )}

      {/* MODAL: Editar comida */}
      {showEditModal && selectedFood && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto relative p-6">
            <button
              className="absolute top-2 right-2 text-gray-500 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
              onClick={handleCloseEditModal}
            >
              ✖
            </button>

            <EditFoodForm
              food={selectedFood}
              onSuccess={handleCloseEditModal}
            />
          </div>
        </div>
      )}
    </div>
  );
}
