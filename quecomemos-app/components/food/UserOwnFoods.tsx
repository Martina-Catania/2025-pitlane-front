"use client";
import { FoodModal } from "@/components/modals";
import { EditFoodForm } from "@/components/admin";
import { useState, useEffect, useCallback } from "react";
import { useUser } from "@/lib/contexts/UserContext";
import { API_BASE_URL } from "@/lib/config/api";
import { AddFoodForm } from "./forms";
import { EditableFoodCarousel } from "./carousels";

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
    <div>
      <EditableFoodCarousel
        title="Your Foods"
        foods={userFoods}
        onCardClick={openViewModal}
        onEditClick={openEditModal}
        onAddClick={openAddModal}
        showAddButton={true}
        emptyStateTitle="No foods created yet"
        emptyStateDescription="Start by creating your first custom food!"
        emptyStateButtonText="Create Your First Food"
      />

      {/* View Modal */}
      <FoodModal
        food={selectedFood}
        isOpen={isViewModalOpen}
        onClose={closeViewModal}
      />

      {/* Edit Modal */}
      {isEditModalOpen && selectedFood && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={closeEditModal}
          />
          
          {/* Modal */}
          <div className="relative bg-neutral-900 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-amber-800/30">
            {/* Header */}
            <div className="sticky top-0 bg-neutral-900 rounded-t-2xl border-b border-amber-800/30 p-6 pb-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-amber-100">Edit Food</h2>
                <button
                  onClick={closeEditModal}
                  className="p-2 hover:bg-amber-800/20 rounded-full transition-colors"
                  aria-label="Close modal"
                >
                  <svg className="w-5 h-5 text-amber-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 pt-4">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={closeAddModal}
          />
          
          {/* Modal */}
          <div className="relative bg-neutral-900 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-amber-800/30">
            {/* Header */}
            <div className="sticky top-0 bg-neutral-900 rounded-t-2xl border-b border-amber-800/30 p-6 pb-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-amber-100">Add New Food</h2>
                <button
                  onClick={closeAddModal}
                  className="p-2 hover:bg-amber-800/20 rounded-full transition-colors"
                  aria-label="Close modal"
                >
                  <svg className="w-5 h-5 text-amber-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 pt-4">
              <AddFoodForm onSuccess={closeAddModal} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}