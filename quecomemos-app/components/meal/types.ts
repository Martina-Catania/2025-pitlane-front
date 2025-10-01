export type FoodItem = {
  name: string;
  quantity: number;
  kCal: number; 
};

export type ExistingFood = {
  id?: string | number;
  name: string;
  kcalPer100g?: number;
  kCal?: number;
  svgLink?: string;
  icon?: string;
  preferences?: Array<{ id: number; name?: string }> | number[];
  dietaryRestrictions?: Array<{ id: number; name?: string }> | number[];
  restrictions?: Array<{ id: number; name?: string }> | number[];
};

export interface AddMealFormProps {
  onFoodAdded?: () => void;
}