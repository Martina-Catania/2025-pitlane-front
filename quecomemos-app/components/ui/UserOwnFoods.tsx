"use client";
import { FoodModal } from "./food-modal";
import { EditFoodForm } from "./EditForm";
import { ChevronLeft, ChevronRight, Utensils, Plus } from 'lucide-react';
import { useRef, useState, useEffect, useCallback } from "react";
import { useUser } from "@/lib/contexts/UserContext";
import { API_BASE_URL } from "@/lib/config/api";
import { AddFoodForm } from "../custom-components/add-food-form";
import { EditableFoodCard } from "./EditableFoodCard";

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

interface UserOwnFoodsProps {
  refreshTrigger?: number;
}



export function UserOwnFoods({ refreshTrigger = 0 }: UserOwnFoodsProps) {
  const { userData } = useUser();
  const [userFoods, setUserFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Carousel states
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Fetch user's own foods
  const fetchUserFoods = useCallback(async () => {
    if (!userData.profile?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/foods/user/${userData.profile.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const foods = await response.json();
        setUserFoods(foods);
      } else {
        throw new Error('Failed to fetch user foods');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching user foods:', err);
    } finally {
      setLoading(false);
    }
  }, [userData.profile?.id]);

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

  // Modal functions
  const openViewModal = (food: Food) => {
    setSelectedFood(food);
    setIsViewModalOpen(true);
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedFood(null);
  };

  const openEditModal = (food: Food) => {
    setSelectedFood(food);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedFood(null);
    fetchUserFoods(); // Refresh the list after editing
  };

  const openAddModal = () => {
    setIsAddModalOpen(true);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    fetchUserFoods(); // Refresh the list after adding
  };

  // Effects
  useEffect(() => {
    fetchUserFoods();
  }, [fetchUserFoods, refreshTrigger]);

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
  }, [userFoods]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="w-48 h-6 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-24 h-8 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="flex gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-64 h-80 bg-gray-200 rounded-xl animate-pulse flex-shrink-0"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-4 bg-red-100 dark:bg-red-900/20 rounded-lg">
        Error loading your foods: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-xl text-amber-200">Your Foods</h2>
          <p className="text-sm text-gray-400">
            {userFoods.length} food{userFoods.length !== 1 ? 's' : ''} created by you
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Food
        </button>
      </div>

      {/* Foods carousel */}
      {userFoods.length > 0 ? (
        <div className="relative py-4">
          {/* Scroll buttons */}
          {canScrollLeft && (
            <button
              onClick={scrollLeft}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-amber-800/80 hover:bg-amber-700/90 p-2 rounded-full shadow-lg transition-all"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
          )}
          
          {canScrollRight && (
            <button
              onClick={scrollRight}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-amber-800/80 hover:bg-amber-700/90 p-2 rounded-full shadow-lg transition-all"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          )}

          {/* Foods container */}
          <div
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto scrollbar-hide px-12 py-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {userFoods.map((food) => (
              <EditableFoodCard
                key={food.FoodID}
                food={food}
                onCardClick={openViewModal}
                onEditClick={openEditModal}
                isOwner={true} // User always owns their own foods
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">
          <Utensils className="w-16 h-16 mx-auto mb-4 text-gray-500" />
          <h3 className="text-lg font-medium mb-2">No foods created yet</h3>
          <p className="text-sm mb-4">Start by creating your first custom food!</p>
          <button
            onClick={openAddModal}
            className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Create Your First Food
          </button>
        </div>
      )}

      {/* View Modal */}
      <FoodModal
        food={selectedFood}
        isOpen={isViewModalOpen}
        onClose={closeViewModal}
      />

      {/* Edit Modal */}
      {isEditModalOpen && selectedFood && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50 p-4">
          <div className="bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto relative p-6 border border-amber-800/30">
            <button
              className="absolute top-4 right-4 text-amber-200 hover:text-amber-100 bg-amber-800/20 hover:bg-amber-700/30 p-2 rounded-full transition-all"
              onClick={closeEditModal}
              aria-label="Close modal"
            >
              ✖
            </button>
            <div className="mt-4">
              <EditFoodForm
                food={selectedFood}
                onSuccess={closeEditModal}
              />
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50 p-4">
          <div className="bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto relative p-6 border border-amber-800/30">
            <button
              className="absolute top-4 right-4 text-amber-200 hover:text-amber-100 bg-amber-800/20 hover:bg-amber-700/30 p-2 rounded-full transition-all"
              onClick={closeAddModal}
              aria-label="Close modal"
            >
              ✖
            </button>
            <div className="mt-4">
              <AddFoodForm onSuccess={closeAddModal} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}