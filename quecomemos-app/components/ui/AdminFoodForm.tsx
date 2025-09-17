"use client";
import { useRouter } from "next/navigation";

export function AdminFoodForm() {
  const router = useRouter();

  return (
    <div className="w-full flex justify-end mb-4">
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700 transition"
        onClick={() => router.push("/admin/foods/new")}
      >
        Agregar nueva comida
      </button>
    </div>
  );
}