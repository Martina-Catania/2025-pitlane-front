'use client';

import { useState, useRef } from 'react';
import { Utensils, Heart, Eye } from 'lucide-react';
import Image from 'next/image';
import { Card, CardContent } from './card';
import { Badge } from './badge';

interface Food {
  FoodID: number;
  name: string;
  svgLink?: string;
  dietaryRestrictions?: { name?: string; DietaryRestrictionID?: number }[] | number[];
  preferences?: { name?: string; PreferenceID?: number }[] | number[];
  [key: string]: unknown;
}

interface EnhancedFoodCardProps {
  food: Food;
  onCardClick: (food: Food) => void;
  showPreferenceBadge?: boolean;
  preferenceNames?: { [key: number]: string };
  restrictionNames?: { [key: number]: string };
}

export function EnhancedFoodCard({ 
  food, 
  onCardClick, 
  showPreferenceBadge = false,
  preferenceNames = {},
  restrictionNames = {}
}: EnhancedFoodCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Get preference and restriction names for display
  const getPreferenceNames = () => {
    if (!food.preferences) return [];
    return food.preferences.map(p => {
      const id = typeof p === 'number' ? p : p.PreferenceID;
      return preferenceNames[id!] || `Preference ${id}`;
    }).filter(Boolean);
  };

  const getRestrictionNames = () => {
    if (!food.dietaryRestrictions) return [];
    return food.dietaryRestrictions.map(r => {
      const id = typeof r === 'number' ? r : r.DietaryRestrictionID;
      return restrictionNames[id!] || `Restriction ${id}`;
    }).filter(Boolean);
  };

  const preferenceNamesList = getPreferenceNames();
  const restrictionNamesList = getRestrictionNames();

  return (
    <Card
      ref={cardRef}
      className="group bg-gradient-to-br from-amber-800 to-amber-900 border-amber-700 hover:from-amber-700 hover:to-amber-800 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl overflow-hidden w-full max-w-sm mx-auto"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onCardClick(food)}
    >
      <CardContent className="p-0">
        {/* Image Section */}
        <div className="relative h-32 flex items-center justify-center bg-gradient-to-b from-amber-700 to-amber-800 overflow-hidden">
          {food.svgLink ? (
            <Image 
              src={food.svgLink} 
              alt={food.name} 
              width={80}
              height={80}
              className="object-contain transition-transform duration-300 group-hover:scale-110" 
            />
          ) : (
            <Utensils className="w-16 h-16 text-amber-200 transition-transform duration-300 group-hover:scale-110" />
          )}
          
          {/* Hover overlay */}
          <div className={`absolute inset-0 bg-black/20 flex items-center justify-center transition-opacity duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}>
            <Eye className="w-8 h-8 text-white" />
          </div>

          {/* Preference badge */}
          {showPreferenceBadge && preferenceNamesList.length > 0 && (
            <div className="absolute top-2 right-2">
              <Badge variant="secondary" className="bg-green-600 text-white text-xs">
                <Heart className="w-3 h-3 mr-1" />
                Match
              </Badge>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-4 space-y-3">
          {/* Title */}
          <h3 className="text-lg font-bold text-white group-hover:text-amber-100 transition-colors line-clamp-2">
            {food.name}
          </h3>

          {/* Preferences */}
          {preferenceNamesList.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-amber-200">Preferences:</p>
              <div className="flex flex-wrap gap-1">
                {preferenceNamesList.slice(0, 2).map((name, index) => (
                  <Badge key={index} variant="outline" className="text-xs border-amber-400 text-amber-100">
                    {name}
                  </Badge>
                ))}
                {preferenceNamesList.length > 2 && (
                  <Badge variant="outline" className="text-xs border-amber-400 text-amber-100">
                    +{preferenceNamesList.length - 2} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Dietary Restrictions */}
          {restrictionNamesList.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-amber-200">Dietary Info:</p>
              <div className="flex flex-wrap gap-1">
                {restrictionNamesList.slice(0, 2).map((name, index) => (
                  <Badge key={index} variant="secondary" className="text-xs bg-green-600 text-white">
                    {name}
                  </Badge>
                ))}
                {restrictionNamesList.length > 2 && (
                  <Badge variant="secondary" className="text-xs bg-green-600 text-white">
                    +{restrictionNamesList.length - 2} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Click to view more indicator */}
          <div className="flex items-center justify-between pt-2 border-t border-amber-600/30">
            <span className="text-xs text-amber-200 group-hover:text-amber-100 transition-colors">
              Click for details
            </span>
            <Eye className="w-4 h-4 text-amber-200 group-hover:text-amber-100 transition-colors" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}