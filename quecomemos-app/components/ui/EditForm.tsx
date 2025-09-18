"use client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CustomCheckbox } from "@/components/custom-components/custom-checkbox";
import { DropdownWrapper } from "@/components/custom-components/dropdown-wrapper";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IconSelect } from "@/components/custom-components/icon-select";
import { useState, useEffect } from "react";

interface EditFoodFormProps {
  food: any;
  onSuccess: () => void;
}

export function EditFoodForm({ food, onSuccess }: EditFoodFormProps) {
  const [foodName, setFoodName] = useState(food.name || "");
  const [preferences, setPreferences] = useState<number[]>(
    food.preferences?.map((p: any) => p.PreferenceID || p) || []
  );
  const [restrictions, setRestrictions] = useState<number[]>(
    food.dietaryRestrictions?.map((r: any) => r.DietaryRestrictionID || r) || []
  );
  const [icon, setIcon] = useState<string | null>(food.svgLink || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEditFood = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:3005/foods/${food.FoodID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: foodName,
          svgLink: icon,
          preferences: preferences,
          dietaryRestrictions: restrictions
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update food");
      }
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("max-w-md mx-auto")}>
      <form onSubmit={handleEditFood}>
        <div className="grid gap-4">
          <div>
            <Label htmlFor="food-name">Food Name</Label>
            <Input
              id="food-name"
              value={foodName}
              onChange={(e) => setFoodName(e.target.value)}
              required
            />
          </div>

          <DropdownWrapper label="Preferences">
            <CustomCheckbox
              initialOptions={preferences.length > 0 ? preferences : []}
              endpoint="preferences"
              onSelectionChange={setPreferences}
            />
          </DropdownWrapper>

          <DropdownWrapper label="Dietary Restrictions">
            <CustomCheckbox
              initialOptions={restrictions.length > 0 ? restrictions : []}
              endpoint="dietary-restrictions"
              onSelectionChange={setRestrictions}
            />
          </DropdownWrapper>

          <IconSelect onSelectionChange={setIcon} />
        </div>

        {error && <p className="text-red-500">{error}</p>}

        <div className="flex justify-center mt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Updating..." : "Update Food"}
          </Button>
        </div>
      </form>
    </div>
  );
}
