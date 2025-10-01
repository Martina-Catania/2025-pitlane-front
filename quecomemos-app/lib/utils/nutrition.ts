export const calculateKcal = (kcalPer100g: number, grams: number) => {
  if (!kcalPer100g || !grams) return 0;
  return Math.round((kcalPer100g * grams) / 100);
};