"use client";
import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Utensils, Plus } from 'lucide-react';
import { EditableFoodCard } from "../ui/EditableFoodCard";

interface Food {
  FoodID: number;
  name: string;
  kCal: number;
  svgLink?: string;
  profileId?: string;
  dietaryRestrictions?: { name?: string; DietaryRestrictionID?: number }[] | number[];
  preferences?: { name?: string; PreferenceID?: number }[] | number[];
  [key: string]: unknown;
}

interface EditableFoodCarouselProps {
  title: string;
  foods: Food[];
  onCardClick: (food: Food) => void;
  onEditClick: (food: Food) => void;
  onAddClick?: () => void;
  showAddButton?: boolean;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  emptyStateButtonText?: string;
}

export function EditableFoodCarousel({
  title,
  foods,
  onCardClick,
  onEditClick,
  onAddClick,
  showAddButton = false,
  emptyStateTitle = "No foods found",
  emptyStateDescription = "Start by adding your first food!",
  emptyStateButtonText = "Add Food"
}: EditableFoodCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Check scroll capabilities
  const checkScrollCapabilities = () => {
    const container = scrollContainerRef.current;
    if (container) {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth
      );
    }
  };

  // Scroll functions
  const scrollLeft = () => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  // Effects
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      checkScrollCapabilities();
      container.addEventListener('scroll', checkScrollCapabilities);
      
      // Check on resize
      const resizeObserver = new ResizeObserver(checkScrollCapabilities);
      resizeObserver.observe(container);
      
      return () => {
        container.removeEventListener('scroll', checkScrollCapabilities);
        resizeObserver.disconnect();
      };
    }
  }, [foods]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-2xl text-amber-200 mb-2">{title}</h2>
          <p className="text-gray-400">
            {foods.length} food{foods.length !== 1 ? 's' : ''} found
          </p>
        </div>
        {showAddButton && onAddClick && (
          <button
            onClick={onAddClick}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Food
          </button>
        )}
      </div>

      {/* Foods carousel */}
      {foods.length > 0 ? (
        <div className="relative py-4">
          {/* Scroll buttons */}
          {canScrollLeft && (
            <button
              onClick={scrollLeft}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white hover:bg-gray-100 p-2 rounded-full shadow-lg transition-all"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-5 h-5 text-black" />
            </button>
          )}
          
          {canScrollRight && (
            <button
              onClick={scrollRight}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white hover:bg-gray-100 p-2 rounded-full shadow-lg transition-all"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-5 h-5 text-black" />
            </button>
          )}

          {/* Foods container */}
          <div
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto scrollbar-hide px-12 py-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {foods.map((food) => (
              <EditableFoodCard
                key={food.FoodID}
                food={food}
                onCardClick={onCardClick}
                onEditClick={onEditClick}
                isOwner={true}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">
          <Utensils className="w-16 h-16 mx-auto mb-4 text-gray-500" />
          <h3 className="text-lg font-medium mb-2">{emptyStateTitle}</h3>
          <p className="text-sm mb-4">{emptyStateDescription}</p>
          {onAddClick && (
            <button
              onClick={onAddClick}
              className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              {emptyStateButtonText}
            </button>
          )}
        </div>
      )}
    </div>
  );
}