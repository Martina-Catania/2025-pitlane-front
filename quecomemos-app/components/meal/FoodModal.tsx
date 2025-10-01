'use client';
import { useMemo, useRef, KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DropdownWrapper } from "@/components/custom-components/dropdown-wrapper";
import { CustomCheckbox } from "@/components/custom-components/custom-checkbox";
import { IconSelect } from "@/components/custom-components/icon-select";
import { X } from "lucide-react";
import { ExistingFood, FoodItem } from "./types";
import { calcKcalFrom100g, iconUrl, kcal100, namesFrom } from "./utils";
import { useFoodSearch } from "./hooks/useFoodSearch";

type Props = {
  apiBase: string;
  open: boolean;
  onClose: () => void;

  editingItem?: FoodItem | null;
  onConfirm: (payload: FoodItem) => void;

  createPreferences: number[];
  setCreatePreferences: (v: number[]) => void;
  createRestrictions: number[];
  setCreateRestrictions: (v: number[]) => void;
  createHasRestrictions: boolean;
  setCreateHasRestrictions: (v: boolean) => void;
  createIcon: string;
  setCreateIcon: (v: string) => void;

  quantity: number | "";
  setQuantity: (v: number | "") => void;
  kcalPer100: number | "";
  setKcalPer100: (v: number | "") => void;
  name: string;
  setName: (v: string) => void;
};

export default function FoodModal(props: Props) {
  const {
    apiBase, open, onClose, editingItem, onConfirm,
    createPreferences, setCreatePreferences,
    createRestrictions, setCreateRestrictions,
    createHasRestrictions, setCreateHasRestrictions,
    createIcon, setCreateIcon,
    quantity, setQuantity,
    kcalPer100, setKcalPer100,
    name, setName,
  } = props;

  const {
    query, setQuery,
    results, showDropdown,
    selected, setSelected,
    activeIndex, setActiveIndex,
    kcalSelected,
  } = useFoodSearch({ apiBase, open });

  const searchRef = useRef<HTMLInputElement>(null);

  const inputClass =
    "w-full p-3 rounded-lg border border-amber-700 bg-amber-800 text-amber-100 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500";

  // sincronizar caja de búsqueda con "name"
  const onChangeName = (v: string) => { setName(v); setQuery(v); };

  // helper: cargar detalle (relaciones) cuando hay id
  const hydrateSelectedWithDetails = async (food: ExistingFood | any) => {
    if (!food?.id) return;
    try {
      const res = await fetch(`${apiBase}/foods/${food.id}?include=preferences,dietaryRestrictions`);
      if (res.ok) {
        const full = await res.json();
        setSelected(full);
      }
    } catch (e) {
      console.error("No se pudo cargar el detalle de la food", e);
    }
  };

  const onKeyDownSearch = async (e: KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown && e.key !== "Enter") return;
    if (e.key === "ArrowDown") {
      e.preventDefault(); setActiveIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault(); setActiveIndex(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (showDropdown && activeIndex >= 0 && results[activeIndex]) {
        const f = results[activeIndex];
        setSelected(f);
        setName(f.name);
        setQuery(f.name);
        const k = kcal100(f);
        if (typeof k === "number") setKcalPer100(k);
        await hydrateSelectedWithDetails(f);
        return;
      }
      handleConfirm();
    } else if (e.key === "Escape") {
      // cierra dropdown
    }
  };

  const liveKcal = useMemo(() => {
    const base = selected ? kcalSelected : (typeof kcalPer100 === "number" ? kcalPer100 : undefined);
    if (!base || !quantity) return undefined;
    return calcKcalFrom100g(base, Number(quantity));
  }, [selected, kcalSelected, kcalPer100, quantity]);

  // nombres de restricciones (robusto a distintos formatos del backend)
  const restrictionNames = useMemo(() => {
    const r =
      (selected as any)?.dietaryRestrictions ??
      (selected as any)?.restrictions ??
      [];
    if (!Array.isArray(r)) return [];
    return r
      .map((x: any) => x?.name ?? x?.label ?? x?.Nombre ?? x?.title)
      .filter(Boolean);
  }, [selected]);

  const handleConfirm = () => {
    if (selected) {
      if (!quantity) { alert("Enter the amount in grams."); return; }
      const k = kcalSelected;
      if (typeof k !== "number") { alert("kcal/100g not found."); return; }
      onConfirm({ name: selected.name, quantity: Number(quantity), kCal: calcKcalFrom100g(k, Number(quantity)) });
      onClose(); return;
    }
    // crear
    if (!name || !quantity || !kcalPer100) {
      alert("Complete name, quantity and kcal/100g.");
      return;
    }
    onConfirm({ name, quantity: Number(quantity), kCal: calcKcalFrom100g(Number(kcalPer100), Number(quantity)) });
    onClose();
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div
        className="relative w-full max-w-2xl bg-neutral-900 border border-amber-800/30 rounded-2xl shadow-2xl overflow-hidden"
        style={{ zIndex: 121 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-amber-800/40">
          <h4 className="text-amber-100 font-semibold text-sm md:text-base">
            {editingItem ? "Edit food" : "Add new food"}
          </h4>
          <button onClick={onClose} className="p-2 text-amber-200 hover:text-amber-50">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-[1fr,1.2fr] gap-4">
            {/* Izquierda: buscador */}
            <div className="relative">
              <input
                ref={searchRef}
                type="text"
                placeholder="Search food by name..."
                value={name}
                onChange={(e) => onChangeName(e.target.value)}
                onKeyDown={onKeyDownSearch}
                className={inputClass}
              />
              {showDropdown && results.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-amber-800 border border-amber-700 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                  {results.map((food, i) => {
                    const k = kcal100(food);
                    const active = i === activeIndex;
                    return (
                      <button
                        key={`${food.id ?? food.name}-${i}`}
                        type="button"
                        onMouseEnter={() => setActiveIndex(i)}
                        onClick={async () => {
                          setSelected(food);
                          onChangeName(food.name);
                          if (typeof k === "number") setKcalPer100(k);
                          await hydrateSelectedWithDetails(food);
                        }}
                        className={`w-full text-left px-4 py-2 border-b border-amber-700 last:border-b-0 transition-colors ${active ? "bg-amber-700 text-white" : "hover:bg-amber-700/60 text-amber-100"}`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="truncate">{food.name}</span>
                          <span className="text-xs opacity-80">{typeof k === "number" ? `${k} kcal/100g` : "s/kcal"}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
              {/* Estado */}
              <div className="mt-2">
                {selected ? (
                  <div className="text-sm text-amber-200 bg-amber-900/30 border border-amber-700 rounded-lg p-2">
                    Using existing food: <strong>{selected.name}</strong>.
                  </div>
                ) : (name.trim().length > 0 && results.length === 0) ? (
                  <div className="text-sm text-amber-200 bg-neutral-700/50 border border-amber-700/50 rounded-lg p-2">
                   There are no matches. You are going to <strong>create</strong> a new food with this name.
                  </div>
                ) : null}
              </div>
            </div>

            {/* Derecha: detalle */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-amber-200 text-sm">Quantity (g)</Label>
                  <input
                    type="number"
                    min={1}
                    placeholder="grams"
                    value={quantity}
                    onChange={(e) => props.setQuantity(Number(e.target.value))}
                    className={inputClass}
                  />
                  {liveKcal !== undefined && (
                    <p className="mt-1 text-xs text-amber-300">This adds up to approx. <b>{liveKcal}</b> kcal.</p>
                  )}
                </div>
                <div>
                  <Label className="text-amber-200 text-sm">Kcal</Label>
                  {selected ? (
                    <input
                      type="number"
                      value={kcalSelected ?? ""}
                      disabled
                      className={inputClass + " opacity-70 cursor-not-allowed"}
                    />
                  ) : (
                    <input
                      type="number"
                      min={0}
                      placeholder="kcal/100g"
                      value={kcalPer100}
                      onChange={(e) => props.setKcalPer100(Number(e.target.value))}
                      className={inputClass}
                    />
                  )}
                </div>
              </div>

              {/* Meta según exista o crear */}
              {selected ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-amber-900/30 border border-amber-700 rounded-lg p-3">
                    <Label className="text-amber-200 text-sm">Icon (BDD)</Label>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-neutral-700 flex items-center justify-center overflow-hidden">
                        {iconUrl(selected) ? (
                          <img
                            src={iconUrl(selected)!}
                            alt="icon"
                            className="w-10 h-10 object-contain"
                          />
                        ) : (
                          <span className="text-xs text-amber-300">N/A</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-amber-900/30 border border-amber-700 rounded-lg p-3">
                    <Label className="text-amber-200 text-sm">kcal/100g (BDD)</Label>
                    <div className="mt-2 text-amber-100 text-sm">{kcalSelected ?? "N/D"}</div>
                  </div>

                  <div className="bg-amber-900/30 border border-amber-700 rounded-lg p-3">
                    <Label className="text-amber-200 text-sm">Preferences (BDD)</Label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {namesFrom((selected as any)?.preferences).length
                        ? namesFrom((selected as any)?.preferences).map((v, i) => (
                            <span
                              key={i}
                              className="text-xs bg-neutral-700 border border-amber-700/60 text-amber-100 px-2 py-1 rounded"
                            >
                              {v}
                            </span>
                          ))
                        : <span className="text-amber-300 text-xs">Sin datos</span>}
                    </div>
                  </div>

                  <div className="bg-amber-900/30 border border-amber-700 rounded-lg p-3">
                    <Label className="text-amber-200 text-sm">Dietary restrictions (BDD)</Label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {restrictionNames.length
                        ? restrictionNames.map((v, i) => (
                            <span
                              key={i}
                              className="text-xs bg-neutral-700 border border-amber-700/60 text-amber-100 px-2 py-1 rounded"
                            >
                              {v}
                            </span>
                          ))
                        : <span className="text-amber-300 text-xs">Sin datos</span>}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <DropdownWrapper label="Preferences">
                    <CustomCheckbox
                      initialOptions={createPreferences}
                      endpoint="preferences"
                      onSelectionChange={setCreatePreferences}
                    />
                  </DropdownWrapper>

                  <div>
                    <Label className="text-amber-200 mb-3 block">Dietary Restrictions</Label>
                    <div className="flex gap-4 mb-4">
                      <button
                        type="button"
                        onClick={() => setCreateHasRestrictions(false)}
                        className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${!createHasRestrictions ? 'bg-amber-700 border-amber-600 text-white' : 'bg-neutral-700 border-amber-800/30 text-amber-200 hover:border-amber-700/50'}`}
                      >
                        No restrictions
                      </button>
                      <button
                        type="button"
                        onClick={() => setCreateHasRestrictions(true)}
                        className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${createHasRestrictions ? 'bg-amber-700 border-amber-600 text-white' : 'bg-neutral-700 border-amber-800/30 text-amber-200 hover:border-amber-700/50'}`}
                      >
                        Has restrictions
                      </button>
                    </div>

                    {createHasRestrictions && (
                      <DropdownWrapper label="Select Dietary Restrictions)">
                        <CustomCheckbox
                          initialOptions={createRestrictions}
                          endpoint="dietary-restrictions/excluding-for-everyone"
                          onSelectionChange={setCreateRestrictions}
                        />
                      </DropdownWrapper>
                    )}
                  </div>

                  <div>
                    <Label className="text-amber-200 mb-2 block">Icon (SVG link)</Label>
                    <IconSelect onSelectionChange={setCreateIcon} />
                  </div>
                </>
              )}

              <div className="pt-1">
                <Button type="button" onClick={handleConfirm} className="w-full bg-amber-600 hover:bg-amber-700 text-white">
                  {editingItem ? "Update food" : "Confirm and add food"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}