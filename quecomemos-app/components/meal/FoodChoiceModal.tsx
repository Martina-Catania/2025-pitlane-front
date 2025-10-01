'use client';
import { createPortal } from "react-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Plus, Search } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreateNew: () => void;
  onSearchExisting: () => void;
  title?: string;
};

export default function FoodChoiceModal({ open, onClose, onCreateNew, onSearchExisting, title = "Add Food" }: Props) {
  if (!open) return null;

  const modal = (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <Card className="relative bg-neutral-900 border-amber-800/30 rounded-2xl shadow-2xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-amber-100">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-amber-800/20 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-amber-200" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <p className="text-gray-300 text-sm mb-6">
            Choose how you&apos;d like to add a food to your meal:
          </p>

          {/* Create New Food Option */}
          <Button
            onClick={onCreateNew}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white py-4 h-auto flex flex-col items-center gap-2 rounded-lg"
          >
            <Plus className="w-6 h-6" />
            <div className="text-center">
              <div className="font-semibold">Create New Food</div>
              <div className="text-xs opacity-90">Add a custom food with your own details</div>
            </div>
          </Button>

          {/* Search Existing Food Option */}
          <Button
            onClick={onSearchExisting}
            className="w-full bg-amber-800/50 hover:bg-amber-700/60 border border-amber-700/50 text-amber-100 py-4 h-auto flex flex-col items-center gap-2 rounded-lg"
          >
            <Search className="w-6 h-6" />
            <div className="text-center">
              <div className="font-semibold">Search Existing Foods</div>
              <div className="text-xs opacity-90">Find and use foods from our database</div>
            </div>
          </Button>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-amber-800/30">
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full border-amber-700/50 text-amber-200 hover:bg-amber-800/20"
          >
            Cancel
          </Button>
        </div>
      </Card>
    </div>
  );

  return createPortal(modal, document.body);
}