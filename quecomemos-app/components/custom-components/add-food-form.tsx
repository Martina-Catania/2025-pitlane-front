"use client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CustomCheckbox } from "@/components/custom-components/custom-checkbox";
import { DropdownWrapper } from "@/components/custom-components/dropdown-wrapper";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IconSelect } from "@/components/custom-components/icon-select";
import { API_BASE_URL } from "@/lib/config/api";
import { useState } from "react";
import { useFoods } from "@/lib/contexts/FoodsContext";
import { useGlobalNotification } from "@/lib/contexts/NotificationContext";
import { useUser } from "@/lib/contexts/UserContext";
import { Plus } from "lucide-react";

interface AddFoodFormProps {
  onSuccess?: () => void
  className?: string;
}

export function AddFoodForm({ className, onSuccess, ...props }: AddFoodFormProps & React.ComponentPropsWithoutRef<"div">) {
  const { addFood } = useFoods();
  const { showSuccess, showError } = useGlobalNotification();
  const { userData } = useUser();
  const [foodName, setFoodName] = useState("");
  const [kCal, setKCal] = useState<number>(0);
  const [preferences, setPreferences] = useState<number[]>([]);
  const [restrictions, setRestrictions] = useState<number[]>([]);
  const [icon, setIcon] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasRestrictions, setHasRestrictions] = useState<boolean | null>(null);

  const handleAddFood = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate that user is logged in and has a profile
      if (!userData?.profile?.id) {
        throw new Error('You must be logged in to add foods');
      }

      // Determine if this food has no restrictions (should get "For Everyone")
      const hasNoRestrictions = hasRestrictions === false;
      
      const response = await fetch(`${API_BASE_URL}/foods`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: foodName,
          kCal: kCal,
          svgLink: icon ?? "",
          preferences,
          dietaryRestrictions: hasNoRestrictions ? [] : restrictions,
          hasNoRestrictions: hasNoRestrictions,
          profileId: userData.profile.id,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to add food");
      }

      const newFood = await response.json();
      
      // Agregar la comida al contexto inmediatamente
      addFood(newFood);
      
      // Limpiar el formulario
      setFoodName("");
      setKCal(0);
      setPreferences([]);
      setRestrictions([]);
      setIcon(null);
      setHasRestrictions(null);

      console.log('About to show success notification for:', foodName);
      showSuccess(
        "Food Added Successfully!",
        `"${foodName}" has been added to your food list with all selected preferences and restrictions.`,
        <Plus className="w-8 h-8" />
      );
      console.log('Success notification called');

      // Delay onSuccess to allow notification to show
      if (onSuccess) {
        setTimeout(() => {
          console.log('Calling onSuccess after delay');
          onSuccess();
        }, 1000);
      }
    } catch (err: unknown) {
      showError(
        "Failed to Add Food",
        err instanceof Error ? err.message : "An unexpected error occurred while adding the food item."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("max-w-md mx-auto", className)} {...props}>
      <Card className="bg-neutral-800 border-amber-800/30">
        <CardHeader>
          <CardTitle className="text-amber-100">Add Food</CardTitle>
          <CardDescription className="text-gray-400">Add a new food item to the list</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddFood}>
            <div className="grid gap-4">
              <div>
                <Label htmlFor="food-name" className="text-amber-200">Food Name</Label>
                <Input
                  id="food-name"
                  value={foodName}
                  onChange={(e) => setFoodName(e.target.value)}
                  required
                  className="bg-neutral-700 border-amber-800/30 text-amber-100 placeholder:text-gray-400 focus:border-amber-600 focus:ring-amber-600/20"
                />
              </div>

              <div>
                <Label htmlFor="kcal" className="text-amber-200">Calories (kCal)</Label>
                <Input
                  id="kcal"
                  type="number"
                  min="0"
                  value={kCal}
                  onChange={(e) => setKCal(Math.max(0, parseInt(e.target.value) || 0))}
                  required
                  className="bg-neutral-700 border-amber-800/30 text-amber-100 placeholder:text-gray-400 focus:border-amber-600 focus:ring-amber-600/20"
                  placeholder="Enter calories"
                />
              </div>

              <DropdownWrapper label="Preferences">
                <CustomCheckbox
                  initialOptions={preferences.length > 0 ? preferences : []}
                  endpoint="preferences"
                  onSelectionChange={setPreferences}
                />
              </DropdownWrapper>

              <div>
                <Label className="text-amber-200 mb-3 block">Does this food have dietary restrictions?</Label>
                <div className="flex gap-4 mb-4">
                  <button
                    type="button"
                    onClick={() => setHasRestrictions(false)}
                    className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                      hasRestrictions === false
                        ? 'bg-amber-700 border-amber-600 text-white'
                        : 'bg-neutral-700 border-amber-800/30 text-amber-200 hover:border-amber-700/50'
                    }`}
                  >
                    No restrictions (For Everyone)
                  </button>
                  <button
                    type="button"
                    onClick={() => setHasRestrictions(true)}
                    className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                      hasRestrictions === true
                        ? 'bg-amber-700 border-amber-600 text-white'
                        : 'bg-neutral-700 border-amber-800/30 text-amber-200 hover:border-amber-700/50'
                    }`}
                  >
                    Has restrictions
                  </button>
                </div>
                
                {hasRestrictions === true && (
                  <DropdownWrapper label="Select Dietary Restrictions">
                    <CustomCheckbox
                      initialOptions={restrictions.length > 0 ? restrictions : []}
                      endpoint="dietary-restrictions/excluding-for-everyone"
                      onSelectionChange={setRestrictions}
                    />
                  </DropdownWrapper>
                )}
              </div>

              <IconSelect onSelectionChange={setIcon} />
            </div>

            <div className="flex justify-center mt-4">
              <Button 
                type="submit" 
                disabled={isLoading} 
                className="mt-2 bg-amber-700 hover:bg-amber-600 text-white font-medium py-2 px-6 rounded-lg transition-colors shadow-lg"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    Adding Food...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add Food
                  </div>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
