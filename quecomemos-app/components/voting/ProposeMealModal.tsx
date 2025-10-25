'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { MealSearchBar } from '../meal/MealSearchBar';
import { MealComposition } from '../meal/MealComposition';
import { useMeals, Meal } from '@/lib/contexts/MealsContext';
import { useUser } from '@/lib/contexts/UserContext';
import { fetchGroupDietaryInfo } from '@/lib/utils/groupService';

interface GroupDietaryInfo {
  dietaryRestrictions: Array<{
    DietaryRestrictionID: number;
    name: string;
  }>;
  preferences: Array<{
    PreferenceID: number; 
    name: string;
  }>;
}

interface ProposeMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPropose: (mealId: number) => void;
  groupId: number;
}

export function ProposeMealModal({ isOpen, onClose, onPropose, groupId }: ProposeMealModalProps) {
  const { userData } = useUser();
  const { allMeals } = useMeals();
  
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [groupDietaryInfo, setGroupDietaryInfo] = useState<GroupDietaryInfo | null>(null);

  const userRestrictions = userData?.preferences?.dietaryRestrictions || [];
  const groupRestrictions = groupDietaryInfo?.dietaryRestrictions?.map(r => r.DietaryRestrictionID) || [];

  // Fetch group dietary info when modal opens
  React.useEffect(() => {
    const fetchGroupInfo = async () => {
      if (groupId && isOpen) {
        try {
          const info = await fetchGroupDietaryInfo(groupId.toString());
          setGroupDietaryInfo(info);
        } catch (error) {
          console.error('Error fetching group dietary info:', error);
        }
      }
    };

    fetchGroupInfo();
  }, [groupId, isOpen]);

  const handlePropose = () => {
    if (selectedMeal) {
      onPropose(selectedMeal.MealID);
      setSelectedMeal(null);
    }
  };

  const handleClose = () => {
    setSelectedMeal(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl bg-neutral-900 rounded-2xl shadow-2xl border border-amber-800/30 overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-amber-900/20 to-amber-800/20 border-b border-amber-800/30">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-amber-200">Propose a Meal</h2>
              <p className="text-gray-300 mt-1">
                Choose a meal to propose for the group voting
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white transition-colors p-2"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Group Info */}
          {groupDietaryInfo && (
            <div className="p-4 bg-amber-900/20 border border-amber-700/50 rounded-lg">
              <h3 className="text-amber-200 font-medium mb-2">Group Dietary Information</h3>
              <div className="text-sm text-gray-300">
                {groupDietaryInfo.dietaryRestrictions.length > 0 && (
                  <p>Group Restrictions: {groupDietaryInfo.dietaryRestrictions.map(r => r.name).join(', ')}</p>
                )}
              </div>
            </div>
          )}

          {/* Meal Search */}
          <div className="space-y-4">
            <MealSearchBar
              allMeals={allMeals}
              selectedMeal={selectedMeal}
              onMealSelect={setSelectedMeal}
              userRestrictions={userRestrictions}
              groupRestrictions={groupRestrictions}
              isGroupMode={true}
              showAdvancedFilters={true}
              placeholder="Search for a meal to propose..."
            />

            {/* Selected Meal Composition */}
            {selectedMeal && (
              <div className="space-y-4">
                <MealComposition meal={selectedMeal} />
                
                <div className="flex justify-end gap-3">
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePropose}
                    className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors font-medium"
                  >
                    Propose This Meal
                  </button>
                </div>
              </div>
            )}

            {!selectedMeal && (
              <div className="text-center py-8 text-gray-400">
                <p>Select a meal from the search above to propose it for voting</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}