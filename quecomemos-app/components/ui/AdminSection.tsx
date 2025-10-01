"use client";
import { useState } from "react";
import { AdminFoodForm } from "@/components/ui/AdminFoodForm";
import AddMealForm from "@/components/meal";
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
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50 p-4">
          <div className="bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto relative p-6 border border-amber-800/30">
            <button
              className="absolute top-4 right-4 text-amber-200 hover:text-amber-100 bg-amber-800/20 hover:bg-amber-700/30 p-2 rounded-full transition-all"
              onClick={handleCloseAddModal}
              aria-label="Cerrar modal"
            >
              ✖
            </button>
            <div className="mt-4">
              <AddMealForm onFoodAdded={handleCloseAddModal} />
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Editar comida */}
      {showEditModal && selectedFood && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50 p-4">
          <div className="bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto relative p-6 border border-amber-800/30">
            <button
              className="absolute top-4 right-4 text-amber-200 hover:text-amber-100 bg-amber-800/20 hover:bg-amber-700/30 p-2 rounded-full transition-all"
              onClick={handleCloseEditModal}
              aria-label="Cerrar modal"
            >
              ✖
            </button>

            <div className="mt-4">
              <EditFoodForm
                food={selectedFood}
                onSuccess={handleCloseEditModal}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
