"use client";
import { FoodModal } from "./food-modal";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { useUser } from "@/lib/contexts/UserContext";
import { Utensils } from "lucide-react";
import Image from "next/image";

interface Food {
  FoodID: number;
  name: string;
  svgLink?: string;
  dietaryRestrictions?: { name?: string; DietaryRestrictionID?: number }[] | number[];
  preferences?: { name?: string; PreferenceID?: number }[] | number[];
  [key: string]: unknown;
}

interface UserFoodsProps {
  foods: Food[];
  mockUserData?: {
    profile: { role: string };
    preferences: {
      preferences: number[];
      dietaryRestrictions: number[];
      hasPreferences: boolean;
    };
  };
}

// Componente de carta uniforme
const UniformFoodCard = ({ food, onCardClick }: { food: Food; onCardClick: (food: Food) => void }) => {
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

  // Función para truncar texto con puntos suspensivos
  const truncateText = (text: string, maxLength: number = 20) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  };

  return (
    <>
      <div 
        ref={cardRef}
        className="relative group bg-amber-700 border border-amber-800 rounded-lg shadow-md px-3 py-2 md:px-4 md:py-3 cursor-pointer transition-all duration-200 hover:bg-amber-600 hover:shadow-lg hover:scale-105 flex flex-col items-center w-[110px] h-[90px] md:w-[140px] md:h-[110px] flex-shrink-0 touch-manipulation"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => onCardClick(food)}
      >
        <div className="w-8 h-8 md:w-12 md:h-12 mb-1 md:mb-2 flex items-center justify-center flex-shrink-0">
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
        <div className="flex-grow flex items-center justify-center">
          <span className="text-white text-xs md:text-sm font-medium text-center leading-tight">
            {truncateText(food.name)}
          </span>
        </div>
      </div>

      {/* Fixed position tooltip */}
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
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[6px] border-l-transparent border-r-transparent border-b-gray-900"></div>
          </div>
        </div>
      )}
    </>
  );
};

interface UserFoodsProps {
  foods: Food[];
}

export function UserFoods({ foods, mockUserData }: UserFoodsProps) {
  const { userData } = useUser();
  
  // Use mock data if provided (for admin preview), otherwise use real user data
  const userPreferences = mockUserData?.preferences || userData.preferences;
  const userProfile = mockUserData?.profile || userData.profile;
  
  // Estados para el modal
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const scrollContainerRef1 = useRef<HTMLDivElement>(null);
  const scrollContainerRef2 = useRef<HTMLDivElement>(null);
  const [canScrollLeft1, setCanScrollLeft1] = useState(false);
  const [canScrollRight1, setCanScrollRight1] = useState(false);
  const [canScrollLeft2, setCanScrollLeft2] = useState(false);
  const [canScrollRight2, setCanScrollRight2] = useState(false);

  // Función para abrir el modal
  const openModal = (food: Food) => {
    setSelectedFood(food);
    setIsModalOpen(true);
  };

  // Función para cerrar el modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedFood(null);
  };

  // Filter foods based on user preferences and dietary restrictions
  const filterFoods = () => {
    // Admin users see all foods without any filtering
    if (userProfile?.role === "admin") {
      return { preferredFoods: [], otherFoods: foods };
    }

    // If user has no preferences set, show all foods
    if (!userPreferences || !userPreferences.hasPreferences) {
      return { preferredFoods: [], otherFoods: foods };
    }
    
    // If user has no dietary restrictions, they can see all foods (no restriction filtering)
    const userRestrictionsIds = userPreferences.dietaryRestrictions || [];
    if (userRestrictionsIds.length === 0) {
      // No restrictions = can eat anything, just organize by preferences
      const userPrefIds = userPreferences.preferences || [];
      const preferredFoods: Food[] = [];
      const otherFoods: Food[] = [];
      
      foods.forEach(food => {
        const foodPrefIds = food.preferences?.map(p => typeof p === 'number' ? p : p.PreferenceID ?? -1) || [];
        const hasMatchingPreference = foodPrefIds.some(prefId => userPrefIds.includes(prefId));
        
        if (hasMatchingPreference) {
          preferredFoods.push(food);
        } else {
          otherFoods.push(food);
        }
      });
      
      return { preferredFoods, otherFoods };
    }

    // User has dietary restrictions - can only eat foods that match their restrictions OR "For Everyone" foods
    const userPrefIds = userPreferences.preferences || [];
    const preferredFoods: Food[] = [];
    const otherFoods: Food[] = [];

    foods.forEach(food => {
      const foodPrefIds = food.preferences?.map(p => typeof p === 'number' ? p : p.PreferenceID ?? -1) || [];
      const foodRestrictionsIds = food.dietaryRestrictions?.map(r => typeof r === 'number' ? r : r.DietaryRestrictionID ?? -1) || [];

      // Check if food matches user preferences
      const hasMatchingPreference = foodPrefIds.some(prefId => userPrefIds.includes(prefId));
      
      // Check if food is compatible with user's dietary restrictions:
      // 1. Food has "For Everyone" restriction (id = 0)
      // 2. Food has at least one restriction that matches user's restrictions
      const isForEveryone = foodRestrictionsIds.includes(0);
      const hasMatchingRestriction = foodRestrictionsIds.some(restrictionId => 
        userRestrictionsIds.includes(restrictionId)
      );
      const isCompatible = isForEveryone || hasMatchingRestriction;

      // Only show foods that are compatible with user's dietary restrictions
      if (isCompatible) {
        if (hasMatchingPreference) {
          preferredFoods.push(food);
        } else {
          otherFoods.push(food);
        }
      }
      // Foods that don't match user's dietary restrictions are filtered out
    });

    return { preferredFoods, otherFoods };
  };

  const { preferredFoods, otherFoods } = filterFoods();

  const checkScrollability = (containerRef: React.RefObject<HTMLDivElement | null>, setLeft: (val: boolean) => void, setRight: (val: boolean) => void) => {
    if (containerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
      setLeft(scrollLeft > 0);
      setRight(scrollLeft < scrollWidth - clientWidth);
    }
  };

  useEffect(() => {
    if (scrollContainerRef1.current) {
      checkScrollability(scrollContainerRef1, setCanScrollLeft1, setCanScrollRight1);
    }
    if (scrollContainerRef2.current) {
      checkScrollability(scrollContainerRef2, setCanScrollLeft2, setCanScrollRight2);
    }
    const handleResize = () => {
      if (scrollContainerRef1.current) {
        checkScrollability(scrollContainerRef1, setCanScrollLeft1, setCanScrollRight1);
      }
      if (scrollContainerRef2.current) {
        checkScrollability(scrollContainerRef2, setCanScrollLeft2, setCanScrollRight2);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [foods, preferredFoods, otherFoods]);

  useEffect(() => {
    const scrollContainer1 = scrollContainerRef1.current;
    const scrollContainer2 = scrollContainerRef2.current;
    
    const handleScroll1 = () => {
      if (scrollContainerRef1.current) {
        checkScrollability(scrollContainerRef1, setCanScrollLeft1, setCanScrollRight1);
      }
    };
    const handleScroll2 = () => {
      if (scrollContainerRef2.current) {
        checkScrollability(scrollContainerRef2, setCanScrollLeft2, setCanScrollRight2);
      }
    };
    
    if (scrollContainer1) {
      scrollContainer1.addEventListener('scroll', handleScroll1);
    }
    if (scrollContainer2) {
      scrollContainer2.addEventListener('scroll', handleScroll2);
    }
    
    return () => {
      if (scrollContainer1) scrollContainer1.removeEventListener('scroll', handleScroll1);
      if (scrollContainer2) scrollContainer2.removeEventListener('scroll', handleScroll2);
    };
  }, []);

  const scrollLeft = (containerRef: React.RefObject<HTMLDivElement | null>) => {
    if (containerRef.current) {
      const scrollAmount = window.innerWidth < 768 ? 150 : 200;
      containerRef.current.scrollBy({
        left: -scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const scrollRight = (containerRef: React.RefObject<HTMLDivElement | null>) => {
    if (containerRef.current) {
      const scrollAmount = window.innerWidth < 768 ? 150 : 200;
      containerRef.current.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const FoodSection = ({ 
    title, 
    foods, 
    containerRef, 
    canScrollLeft, 
    canScrollRight, 
    onScrollLeft, 
    onScrollRight 
  }: {
    title: string;
    foods: Food[];
    containerRef: React.RefObject<HTMLDivElement | null>;
    canScrollLeft: boolean;
    canScrollRight: boolean;
    onScrollLeft: () => void;
    onScrollRight: () => void;
  }) => {
    if (foods.length === 0) return null;

    return (
      <div className="w-full mb-12">
        <h2 className="font-bold text-xl mb-6">{title}</h2>
        <div className="relative">
          {/* Left scroll button */}
          {canScrollLeft && (
            <button
              onClick={onScrollLeft}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white rounded-full p-1.5 md:p-2 shadow-md transition-all duration-200 hover:shadow-lg touch-manipulation"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
            </button>
          )}

          {/* Carousel container */}
          <div
            ref={containerRef}
            className="flex gap-2 md:gap-4 overflow-x-scroll scrollbar-hide scroll-smooth px-6 md:px-8 py-2 pb-8 touch-pan-x overscroll-x-contain"
            style={{ 
              scrollbarWidth: 'none', 
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
              scrollSnapType: 'x proximity'
            }}
          >
            {foods.map((food) => (
              <div key={food.FoodID} style={{ scrollSnapAlign: 'start' }}>
                <UniformFoodCard food={food} onCardClick={openModal} />
              </div>
            ))}
          </div>

          {/* Right scroll button */}
          {canScrollRight && (
            <button
              onClick={onScrollRight}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white rounded-full p-1.5 md:p-2 shadow-md transition-all duration-200 hover:shadow-lg touch-manipulation"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      {/* Preferred Foods Section */}
      <FoodSection
        title="Recommended foods for you"
        foods={preferredFoods}
        containerRef={scrollContainerRef1}
        canScrollLeft={canScrollLeft1}
        canScrollRight={canScrollRight1}
        onScrollLeft={() => scrollLeft(scrollContainerRef1)}
        onScrollRight={() => scrollRight(scrollContainerRef1)}
      />

      {/* Other Foods Section */}
      <FoodSection
        title="Other foods for you"
        foods={otherFoods}
        containerRef={scrollContainerRef2}
        canScrollLeft={canScrollLeft2}
        canScrollRight={canScrollRight2}
        onScrollLeft={() => scrollLeft(scrollContainerRef2)}
        onScrollRight={() => scrollRight(scrollContainerRef2)}
      />

      {/* Modal */}
      <FoodModal 
        food={selectedFood}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </div>
  );
}