'use client';
import React, { useState } from "react";
import { AddFoodForm } from "./user-add-meal-form";
import { Plus } from "lucide-react";

export function AddFoodModal({ onFoodAdded }: { onFoodAdded?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded font-semibold"
      >
        <Plus className="w-4 h-4" />
        Agregar comida
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-amber-800 text-white rounded-xl shadow-lg w-full max-w-lg relative overflow-auto max-h-[90vh] p-6">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-3 right-3 text-amber-200 hover:text-white text-xl font-bold"
            >
              ✕
            </button>

            <h2 className="text-2xl font-bold text-amber-200 mb-4 text-center">
              Crear nueva comida
            </h2>

            <AddFoodForm
              onFoodAdded={() => {
                if (onFoodAdded) onFoodAdded();
                setIsOpen(false);
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}