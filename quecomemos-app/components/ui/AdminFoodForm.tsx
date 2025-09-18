"use client";

interface AdminFoodFormProps {
  onAddClick: () => void;
}

export function AdminFoodForm({ onAddClick }: AdminFoodFormProps) {
  return (
    <div className="w-full flex gap-4 justify-end mb-4">
      <button
        onClick={onAddClick}
        className="bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700 transition"
      >
        Agregar comida
      </button>
    </div>
  );
}
