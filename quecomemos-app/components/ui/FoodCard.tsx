import { Utensils } from "lucide-react";

interface Food {
  FoodID: number;
  name: string;
  svgLink?: string;
  dietaryRestrictions?: any[];
  preferences?: any[];
}

interface FoodCardProps {
  food: Food;
}

export function FoodCard({ food }: FoodCardProps) {
  return (
    <div className="relative group bg-amber-700 border border-amber-800 rounded-lg shadow-md px-3 py-2 md:px-4 md:py-3 cursor-pointer transition-all duration-200 hover:bg-amber-600 hover:shadow-lg flex flex-col items-center min-w-[100px] md:min-w-[120px] flex-shrink-0 touch-manipulation">
      <div className="w-8 h-8 md:w-12 md:h-12 mb-1 md:mb-2 flex items-center justify-center">
        {food.svgLink ? (
          <img 
            src={food.svgLink} 
            alt={food.name} 
            className="w-full h-full object-contain" 
          />
        ) : (
          <Utensils className="w-6 h-6 md:w-8 md:h-8 text-amber-200" />
        )}
      </div>
      <span className="text-white text-xs md:text-sm font-medium text-center leading-tight">{food.name}</span>
      <span className="absolute left-1/2 -translate-x-1/2 top-full mt-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 z-10 whitespace-nowrap shadow-lg">
        {food.name}
      </span>
    </div>
  );
}