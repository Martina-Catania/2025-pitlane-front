'use client';

import { useState, useRef, useEffect } from 'react';
import { Utensils, Heart, Eye, SquarePen } from 'lucide-react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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

interface FoodCardProps {
  food: Food;
  variant?: 'simple' | 'enhanced' | 'editable';
  onCardClick?: (food: Food) => void;
  onEditClick?: (food: Food) => void;
  isOwner?: boolean;
  showPreferenceBadge?: boolean;
  preferenceNames?: { [key: number]: string };
  restrictionNames?: { [key: number]: string };
  className?: string;
}

export function FoodCard({ 
  food, 
  variant = 'simple',
  onCardClick, 
  onEditClick,
  isOwner = false,
  showPreferenceBadge = false,
  preferenceNames = {},
  restrictionNames = {},
  className
}: FoodCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isHovered && cardRef.current && variant === 'simple') {
      const rect = cardRef.current.getBoundingClientRect();
      setTooltipPosition({
        top: rect.bottom + 8,
        left: rect.left + rect.width / 2
      });
    }
  }, [isHovered, variant]);

  // Get preference and restriction names for display
  const getPreferenceNames = () => {
    if (!food.preferences) return [];
    return food.preferences.map(p => {
      const id = typeof p === 'number' ? p : p.PreferenceID;
      return preferenceNames[id!] || (typeof p === 'object' && p.name ? p.name : `Preference ${id}`);
    }).filter(Boolean);
  };

  const getRestrictionNames = () => {
    if (!food.dietaryRestrictions) return [];
    return food.dietaryRestrictions.map(r => {
      const id = typeof r === 'number' ? r : r.DietaryRestrictionID;
      return restrictionNames[id!] || (typeof r === 'object' && r.name ? r.name : `Restriction ${id}`);
    }).filter(Boolean);
  };

  if (variant === 'simple') {
    return (
      <>
        <div 
          ref={cardRef}
          className={`relative group bg-amber-700 border border-amber-800 rounded-lg shadow-md px-3 py-2 md:px-4 md:py-3 cursor-pointer transition-all duration-200 hover:bg-amber-600 hover:shadow-lg hover:scale-105 flex flex-col items-center min-w-[110px] md:min-w-[140px] flex-shrink-0 touch-manipulation ${className || ''}`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={() => onCardClick?.(food)}
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
          <p className="text-xs md:text-sm font-medium text-amber-100 text-center leading-tight line-clamp-2">
            {food.name}
          </p>
          <p className="text-xs text-amber-300 mt-1">
            {food.kCal} kcal
          </p>
        </div>

        {/* Tooltip for simple variant */}
        {isHovered && (
          <div 
            className="fixed z-50 bg-black/90 text-white p-3 rounded-lg shadow-lg max-w-xs"
            style={{
              top: `${tooltipPosition.top}px`,
              left: `${tooltipPosition.left}px`,
              transform: 'translateX(-50%)',
            }}
          >
            <h4 className="font-semibold text-sm mb-1">{food.name}</h4>
            <p className="text-xs text-gray-300 mb-2">{food.kCal} kcal</p>
            
            {food.dietaryRestrictions && food.dietaryRestrictions.length > 0 && (
              <div className="mb-2">
                <p className="text-xs font-medium text-yellow-400 mb-1">Dietary Restrictions:</p>
                <div className="flex flex-wrap gap-1">
                  {food.dietaryRestrictions.map((restriction, index) => (
                    <span 
                      key={index} 
                      className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full"
                    >
                      {typeof restriction === 'object' && restriction.name ? restriction.name : `Restriction ${restriction}`}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {food.preferences && food.preferences.length > 0 && (
              <div>
                <p className="text-xs font-medium text-green-400 mb-1">Preferences:</p>
                <div className="flex flex-wrap gap-1">
                  {food.preferences.map((preference, index) => (
                    <span 
                      key={index} 
                      className="bg-green-600 text-white text-xs px-2 py-0.5 rounded-full"
                    >
                      {typeof preference === 'object' && preference.name ? preference.name : `Preference ${preference}`}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </>
    );
  }

  // Enhanced and Editable variants use Card component
  return (
    <Card 
      ref={cardRef}
      className={`group relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 w-full max-w-sm bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 ${className || ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onCardClick?.(food)}
    >
      <CardContent className="p-0">
        {/* Edit button for editable variant */}
        {variant === 'editable' && isOwner && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditClick?.(food);
            }}
            className="absolute top-2 right-2 z-10 bg-amber-600 hover:bg-amber-700 text-white rounded-full p-2 transition-colors duration-200"
            title="Edit food"
          >
            <SquarePen className="w-4 h-4 text-amber-200" />
          </button>
        )}

        {/* Image Section */}
        <div className="relative h-28 flex items-center justify-center bg-gradient-to-b from-amber-700 to-amber-800 overflow-hidden">
          {food.svgLink ? (
            <Image 
              src={food.svgLink} 
              alt={food.name} 
              width={70}
              height={70}
              className="object-contain transition-transform duration-300 group-hover:scale-110" 
            />
          ) : (
            <Utensils className="w-14 h-14 text-amber-200 transition-transform duration-300 group-hover:scale-110" />
          )}
          
          {/* Hover overlay */}
          <div className={`absolute inset-0 bg-black/20 flex items-center justify-center transition-opacity duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}>
            <Eye className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Content Section */}
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-amber-900 leading-tight line-clamp-2">
                {food.name}
              </h3>
              <p className="text-sm text-amber-700 font-medium">
                {food.kCal} kcal
              </p>
            </div>
            
            {showPreferenceBadge && getPreferenceNames().length > 0 && (
              <div className="ml-2 flex-shrink-0">
                <Heart className="w-5 h-5 text-rose-500 fill-current" />
              </div>
            )}
          </div>

          {/* Preferences */}
          {getPreferenceNames().length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-amber-800">Preferences:</p>
              <div className="flex flex-wrap gap-1">
                {getPreferenceNames().map((name, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary" 
                    className="text-xs bg-green-100 text-green-800 hover:bg-green-200"
                  >
                    {name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Dietary Restrictions */}
          {getRestrictionNames().length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-amber-800">Restrictions:</p>
              <div className="flex flex-wrap gap-1">
                {getRestrictionNames().map((name, index) => (
                  <Badge 
                    key={index} 
                    variant="destructive" 
                    className="text-xs bg-red-100 text-red-800 hover:bg-red-200"
                  >
                    {name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default FoodCard;