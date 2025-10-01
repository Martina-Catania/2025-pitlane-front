"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { calculateKcal } from "@/lib/utils/nutrition";
import { FoodItem } from "@/components/types/food";;
import { CustomCheckbox } from "./CustomCheckbox";

type Props = {
  food: FoodItem;
  onUpdate: (field: keyof FoodItem, value: any) => void;
  onRemove: () => void;
};

export function AddFoodCard({ food, onUpdate, onRemove }: Props) {
  const handleQuantity = (val: string) => {
    const grams = parseInt(val) || 0;
    onUpdate("quantity", grams);
    if (food.kCal) {
      onUpdate("kCal", calculateKcal(food.kCal, grams));
    }
  };

  return (
    <Card className="p-4 mt-4 shadow-md rounded-xl">
      <CardHeader>
        <CardTitle>{food.name || "Nuevo Alimento"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label>Nombre</Label>
          <Input value={food.name} onChange={(e) => onUpdate("name", e.target.value)} />
        </div>
        <div>
          <Label>Kcal (por 100g)</Label>
          <Input
            type="number"
            value={food.kCal || ""}
            onChange={(e) => onUpdate("kCal", parseInt(e.target.value) || 0)}
          />
        </div>
        <div>
          <Label>Cantidad (g)</Label>
          <Input
            type="number"
            value={food.quantity || ""}
            onChange={(e) => handleQuantity(e.target.value)}
          />
        </div>
        <p className="font-bold">
          Total kcal: {food.kCal && food.quantity ? calculateKcal(food.kCal, food.quantity) : 0}
        </p>

        <CustomCheckbox
          endpoint="preferences"
          selected={food.preferences || []}
          onChange={(ids) => onUpdate("preferences", ids)}
          label="Preferencias"
        />

        <CustomCheckbox
          endpoint="dietary-restrictions"
          selected={food.dietaryRestrictions || []}
          onChange={(ids) => onUpdate("dietaryRestrictions", ids)}
          label="Restricciones"
        />

        <Button variant="destructive" onClick={onRemove}>
          Eliminar alimento
        </Button>
      </CardContent>
    </Card>
  );
}