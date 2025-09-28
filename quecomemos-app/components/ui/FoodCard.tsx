import { Utensils } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";

interface Food {
  FoodID: number;
  name: string;
  kCal: number;
  svgLink?: string;
  dietaryRestrictions?: { name?: string; DietaryRestrictionID?: number }[];
  preferences?: { name?: string; PreferenceID?: number }[];
}

interface FoodCardProps {
  food: Food;
}

export function FoodCard({ food }: FoodCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isHovered && cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      setTooltipPosition({
        top: rect.bottom + 8,
        left: rect.left + rect.width / 2
      });
    }
  }, [isHovered]);

  return (
    <>
      <div 
        ref={cardRef}
        className="relative group bg-amber-700 border border-amber-800 rounded-lg shadow-md px-3 py-2 md:px-4 md:py-3 cursor-pointer transition-all duration-200 hover:bg-amber-600 hover:shadow-lg hover:scale-105 flex flex-col items-center min-w-[110px] md:min-w-[140px] flex-shrink-0 touch-manipulation"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="w-8 h-8 md:w-12 md:h-12 mb-1 md:mb-2 flex items-center justify-center">
          {food.svgLink ? (
            <Image 
              src={food.svgLink} 
              alt={food.name} 
              width={48}
              height={48}
              className="w-full h-full object-contain" 
            />
          ) : (
            <Utensils className="w-6 h-6 md:w-8 md:h-8 text-amber-200" />
          )}
        </div>
        <span className="text-white text-xs md:text-sm font-medium text-center leading-tight overflow-hidden text-ellipsis"
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                maxHeight: '2.4em'
              }}>
          {food.name}
        </span>
      </div>

      {/* Fixed position tooltip that can't be clipped */}
      {isHovered && (
        <div 
          className="fixed pointer-events-none z-[9999] transition-opacity duration-200"
          style={{
            top: tooltipPosition.top,
            left: tooltipPosition.left,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="bg-gray-900 text-white text-sm rounded-lg px-4 py-3 shadow-2xl border border-gray-700 min-w-max max-w-64 text-center relative">
            <div className="whitespace-normal break-words leading-relaxed font-medium">
              {food.name}
            </div>
            <div className="text-xs text-gray-300 mt-1">
              {food.kCal} kCal
            </div>
            {/* Tooltip arrow */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[6px] border-l-transparent border-r-transparent border-b-gray-900"></div>
          </div>
        </div>
      )}
    </>
  );
}