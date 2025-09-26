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
import { useState } from "react";
import { useFoods } from "@/lib/contexts/FoodsContext";
import { useGlobalNotification } from "@/lib/contexts/NotificationContext";
import { Plus } from "lucide-react";

interface AddFoodFormProps {
  onSuccess?: () => void
  className?: string;
}

export function AddFoodForm({ className, onSuccess, ...props }: AddFoodFormProps & React.ComponentPropsWithoutRef<"div">) {
  const { addFood } = useFoods();
  const { showSuccess, showError } = useGlobalNotification();
  const [foodName, setFoodName] = useState("");
  const [preferences, setPreferences] = useState<number[]>([]);
  const [restrictions, setRestrictions] = useState<number[]>([]);
  const [icon, setIcon] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddFood = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:3005/foods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: foodName,
          svgLink: icon ?? "",
          preferences,
          dietaryRestrictions: restrictions,
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
      setPreferences([]);
      setRestrictions([]);
      setIcon(null);

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
