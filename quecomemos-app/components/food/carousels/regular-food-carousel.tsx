"use client";
import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Utensils, Eye, Heart } from 'lucide-react';
import Image from "next/image";

interface Food {
  FoodID: number;
  name: string;
  kCal: number;
  svgLink?: string;
  dietaryRestrictions?: { name?: string; DietaryRestrictionID?: number }[] | number[];
  preferences?: { name?: string; PreferenceID?: number }[] | number[];
  [key: string]: unknown;
}

interface RegularFoodCarouselProps {
  title: string;
  foods: Food[];
  onCardClick: (food: Food) => void;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  showHeader?: boolean;
}

// Enhanced carousel food card (same as in UserFoods)
const CarouselFoodCard = ({ food, onCardClick }: { food: Food; onCardClick: (food: Food) => void }) => {
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Get preference and restriction names for display
  const getPreferenceNames = () => {
    if (!food.preferences) return [];
    return food.preferences.map(p => {
      const name = typeof p === 'object' && p.name ? p.name : `Preference ${typeof p === 'number' ? p : p.PreferenceID}`;
      return name;
    }).filter(Boolean);
  };

  const getRestrictionNames = () => {
    if (!food.dietaryRestrictions) return [];
    return food.dietaryRestrictions.map(r => {
      const name = typeof r === 'object' && r.name ? r.name : `Restriction ${typeof r === 'number' ? r : r.DietaryRestrictionID}`;
      return name;
    }).filter(Boolean);
  };

  const preferenceNames = getPreferenceNames();
  const restrictionNames = getRestrictionNames();

  return (
    <div
      ref={cardRef}
      className="group bg-gradient-to-br from-amber-800 to-amber-900 border border-amber-700 hover:from-amber-700 hover:to-amber-800 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl overflow-hidden rounded-lg w-[180px] md:w-[200px] h-[280px] flex-shrink-0 touch-manipulation flex flex-col"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onCardClick(food)}
    >
      {/* Image Section */}
      <div className="relative h-24 md:h-28 flex items-center justify-center bg-gradient-to-b from-amber-700 to-amber-800 overflow-hidden">
        {food.svgLink ? (
          <Image 
            src={food.svgLink} 
            alt={food.name} 
            width={60}
            height={60}
            className="object-contain transition-transform duration-300 group-hover:scale-110" 
          />
        ) : (
          <Utensils className="w-12 h-12 text-amber-200 transition-transform duration-300 group-hover:scale-110" />
        )}
        
        {/* Hover overlay */}
        <div className={`absolute inset-0 bg-black/20 flex items-center justify-center transition-opacity duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}>
          <Eye className="w-6 h-6 text-white" />
        </div>

        {/* Match badge */}
        {preferenceNames.length > 0 && (
          <div className="absolute top-1 right-1">
            <div className="bg-green-600 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1">
              <Heart className="w-2.5 h-2.5" />
              <span className="text-xs">Match</span>
            </div>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-3 space-y-2 flex-1 flex flex-col">
        {/* Title */}
        <h3 className="text-sm font-bold text-white group-hover:text-amber-100 transition-colors line-clamp-2 leading-tight">
          {food.name}
        </h3>

        {/* Calories */}
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium text-amber-200">Calories:</span>
          <div className="bg-amber-900/50 border border-amber-400 text-amber-100 font-bold text-xs px-1.5 py-0.5 rounded">
            {food.kCal} kCal
          </div>
        </div>

        {/* Preferences */}
        {preferenceNames.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-amber-200">Preferences:</p>
            <div className="flex flex-wrap gap-1">
              {preferenceNames.slice(0, 1).map((name, index) => (
                <div key={index} className="bg-amber-900/50 border border-amber-400 text-amber-100 text-xs px-1.5 py-0.5 rounded">
                  {name}
                </div>
              ))}
              {preferenceNames.length > 1 && (
                <div className="bg-amber-900/50 border border-amber-400 text-amber-100 text-xs px-1.5 py-0.5 rounded">
                  +{preferenceNames.length - 1}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Dietary Restrictions */}
        {restrictionNames.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-amber-200">Dietary Info:</p>
            <div className="flex flex-wrap gap-1">
              {restrictionNames.slice(0, 2).map((name, index) => (
                <div key={index} className="bg-green-600 text-white text-xs px-1.5 py-0.5 rounded">
                  {name}
                </div>
              ))}
              {restrictionNames.length > 2 && (
                <div className="bg-green-600 text-white text-xs px-1.5 py-0.5 rounded">
                  +{restrictionNames.length - 2}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Click indicator */}
        <div className="flex items-center justify-between pt-1 border-t border-amber-600/30 mt-auto">
          <span className="text-xs text-amber-200 group-hover:text-amber-100 transition-colors">
            Click for details
          </span>
          <Eye className="w-3 h-3 text-amber-200 group-hover:text-amber-100 transition-colors" />
        </div>
      </div>
    </div>
  );
};

export function RegularFoodCarousel({
  title,
  foods,
  onCardClick,
  showHeader = true
}: RegularFoodCarouselProps) {
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
    if (scrollContainerRef.current) {
      const scrollAmount = window.innerWidth < 768 ? 150 : 200;
      scrollContainerRef.current.scrollBy({
        left: -scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      const scrollAmount = window.innerWidth < 768 ? 150 : 200;
      scrollContainerRef.current.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
      });
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

  // Don't render if no foods and we don't want to show empty state
  if (foods.length === 0) {
    return null;
  }

  return (
    <div className="w-full mb-12">
      {/* Header */}
      {showHeader && (
        <h2 className="font-bold text-xl mb-6">{title}</h2>
      )}
      
      <div className="relative">
        {/* Left scroll button */}
        {canScrollLeft && (
          <button
            onClick={scrollLeft}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white hover:bg-gray-100 rounded-full p-1.5 md:p-2 shadow-md transition-all duration-200 hover:shadow-lg touch-manipulation"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 text-black" />
          </button>
        )}

        {/* Carousel container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-3 md:gap-4 overflow-x-scroll scrollbar-hide scroll-smooth px-6 md:px-8 py-2 pb-8 touch-pan-x overscroll-x-contain"
          style={{ 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
            scrollSnapType: 'x proximity'
          }}
        >
          {foods.map((food) => (
            <div key={food.FoodID} style={{ scrollSnapAlign: 'start' }}>
              <CarouselFoodCard food={food} onCardClick={onCardClick} />
            </div>
          ))}
        </div>

        {/* Right scroll button */}
        {canScrollRight && (
          <button
            onClick={scrollRight}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white hover:bg-gray-100 rounded-full p-1.5 md:p-2 shadow-md transition-all duration-200 hover:shadow-lg touch-manipulation"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-black" />
          </button>
        )}
      </div>
    </div>
  );
}