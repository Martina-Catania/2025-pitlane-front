import { ExistingFood } from "./types";

export const getKcalFromFood = (f?: ExistingFood | null): number | undefined => {
  if (!f) return undefined;
  if (typeof f.kcalPer100g === "number") return f.kcalPer100g;
  if (typeof f.kCal === "number") return f.kCal;
  return undefined;
};

export const iconUrl = (f?: ExistingFood | null): string =>
  (f?.svgLink || f?.icon || "");

export const namesFrom = (arr?: ExistingFood["preferences"]): string[] => {
  if (!arr) return [];
  return (arr as Array<{ id?: number; name?: string }>)
    .map((x: { id?: number; name?: string }) => (typeof x === "number" ? `#${x}` : (x?.name || `#${x?.id}`)))
    .filter(Boolean);
};

export const restrNames = (f: ExistingFood | null) =>
  namesFrom((f?.dietaryRestrictions ?? f?.restrictions) as ExistingFood["preferences"]);

export const calcKcalFromUnits = (kcalPerUnit: number, units: number) =>
  Math.round(kcalPerUnit * units);