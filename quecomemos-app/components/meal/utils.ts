import { ExistingFood } from "./types";

export const kcal100 = (f?: ExistingFood | null): number | undefined => {
  if (!f) return undefined;
  if (typeof f.kcalPer100g === "number") return f.kcalPer100g;
  if (typeof f.kCal === "number") return f.kCal;
  return undefined;
};

export const iconUrl = (f?: ExistingFood | null): string =>
  (f?.svgLink || f?.icon || "");

export const namesFrom = (arr?: ExistingFood["preferences"]): string[] => {
  if (!arr) return [];
  return (arr as any[])
    .map((x: any) => (typeof x === "number" ? `#${x}` : (x?.name || `#${x?.id}`)))
    .filter(Boolean);
};

export const restrNames = (f: ExistingFood | null) =>
  namesFrom((f?.dietaryRestrictions ?? f?.restrictions) as any);

export const calcKcalFrom100g = (kcalPer100: number, grams: number) =>
  Math.round((kcalPer100 * grams) / 100);