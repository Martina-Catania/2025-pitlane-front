import { Utensils } from "lucide-react";

interface Food {
  FoodID: number;
  name: string;
  svgLink?: string;
  dietaryRestrictions?: any[];
  preferences?: any[];
}

interface UserFoodsProps {
  foods: Food[];
}

export function UserFoods({ foods }: UserFoodsProps) {
  return (
    <div>
      <h2 className="font-bold text-xl mb-2">Listado de comidas</h2>
      <div className="flex flex-wrap gap-4">
        {foods.map((food) => (
          <div
            key={food.FoodID}
            className="relative group bg-amber-700 border border-amber-800 rounded shadow px-4 py-3 cursor-pointer transition hover:bg-blue-200 flex flex-col items-center"
          >
            {food.svgLink ? (
              <img src={food.svgLink} alt={food.name} className="w-8 h-8 mb-2" />
            ) : (
              <Utensils className="w-8 h-8 mb-2 text-blue-500" />
            )}
            <span>{food.name}</span>
            <span className="absolute left-1/2 -translate-x-1/2 top-full mt-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 z-10 whitespace-nowrap">
              Comida: {food.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}