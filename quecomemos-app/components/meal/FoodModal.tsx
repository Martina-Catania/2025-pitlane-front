'use client';
import { useMemo, useRef, KeyboardEvent, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DropdownWrapper } from "@/components/custom-components/dropdown-wrapper";
import { CustomCheckbox } from "@/components/custom-components/custom-checkbox";
import { IconSelect } from "@/components/custom-components/icon-select";
import { X, Utensils, Plus } from "lucide-react";
import { ExistingFood, FoodItem } from "./types";
import { getKcalFromFood } from "./utils";
import { useFoodSearch } from "./hooks/useFoodSearch";
import { useGlobalNotification } from "@/lib/contexts/NotificationContext";

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
  createHasRestrictions: boolean | null;
  setCreateHasRestrictions: (v: boolean | null) => void;
  createIcon: string;
  setCreateIcon: (v: string) => void;

  quantity: number | "";
  setQuantity: (v: number | "") => void;
  kcalPerUnit: number | "";
  setKcalPerUnit: (v: number | "") => void;
  name: string;
  setName: (v: string) => void;
  
  actionType?: 'create' | 'search';
  onSwitchToCreate?: () => void;
};

export default function FoodModal(props: Props) {
  const {
    apiBase, open, onClose, editingItem, onConfirm,
    createPreferences, setCreatePreferences,
    createRestrictions, setCreateRestrictions,
    createHasRestrictions, setCreateHasRestrictions,
    createIcon, setCreateIcon,
    quantity,
    kcalPerUnit, setKcalPerUnit,
    name, setName,
    actionType = 'create',
    onSwitchToCreate,
  } = props;

  const { showError } = useGlobalNotification();

  const {
    setQuery,
    results, showDropdown,
    selected, setSelected,
    activeIndex, setActiveIndex,
    kcalSelected,
    allFoods,
  } = useFoodSearch({ apiBase, open });

  // Clear selected food when switching to create mode
  useEffect(() => {
    if (actionType === 'create' && open) {
      if (selected) {
        setSelected(null);
      }
    }
  }, [actionType, open, selected, setSelected]);

  const searchRef = useRef<HTMLInputElement>(null);

  const inputClass =
    "w-full p-3 rounded-lg border border-amber-700 bg-amber-800 text-amber-100 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500";

  // sincronizar caja de búsqueda con "name"
  const onChangeName = (v: string) => { setName(v); setQuery(v); };

  // helper: cargar detalle (relaciones) cuando hay id
  const hydrateSelectedWithDetails = async (food: ExistingFood) => {
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

  // helper: check if food name already exists
  const checkFoodNameExists = (foodName: string): boolean => {
    const trimmedName = foodName.trim().toLowerCase();
    return allFoods.some(food => food.name?.toLowerCase() === trimmedName);
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
        // Only set kcal automatically in search mode, not in create mode
        if (actionType === 'search') {
          const k = getKcalFromFood(f);
          if (typeof k === "number") setKcalPerUnit(k);
        }
        await hydrateSelectedWithDetails(f);
        return;
      }
      handleConfirm();
    } else if (e.key === "Escape") {
      // cierra dropdown
    }
  };

  const liveKcal = useMemo(() => {
    const base = selected ? kcalSelected : (typeof kcalPerUnit === "number" ? kcalPerUnit : undefined);
    const quantityNum = typeof quantity === "number" ? quantity : (quantity === "" ? 0 : Number(quantity));
    
    // Debug logging to help identify the issue
    console.log('liveKcal calculation:', { 
      selected: !!selected, 
      kcalSelected, 
      kcalPerUnit, 
      quantity, 
      quantityNum, 
      base 
    });
    
    if (!base || quantityNum <= 0 || isNaN(quantityNum) || isNaN(base)) return undefined;
    return Math.round(base * quantityNum);
  }, [selected, kcalSelected, kcalPerUnit, quantity]);

  const handleConfirm = () => {
    // When editing an existing food item
    if (editingItem) {
      if (!quantity || !kcalPerUnit) {
        showError("Incomplete Information", "Please complete the quantity and calories per unit.");
        return;
      }
      onConfirm({ 
        name, 
        quantity: Number(quantity), 
        kCal: Math.round(Number(kcalPerUnit) * Number(quantity)),
        kcalPerUnit: Number(kcalPerUnit),
        svgLink: createIcon || editingItem.svgLink || ""
      });
      onClose(); 
      return;
    }
    
    // When in create mode, always create a new food regardless of selected state
    if (actionType === 'create') {
      if (!name || !quantity || !kcalPerUnit) {
        showError("Incomplete Information", "Please complete the food name, quantity, and calories per unit.");
        return;
      }
      
      // Check if food name already exists
      if (checkFoodNameExists(name)) {
        showError("Duplicate Food Name", `A food named "${name.trim()}" already exists. Please choose a different name or search for the existing food.`);
        return;
      }
      
      onConfirm({ 
        name, 
        quantity: Number(quantity), 
        kCal: Math.round(Number(kcalPerUnit) * Number(quantity)),
        kcalPerUnit: Number(kcalPerUnit),
        svgLink: createIcon || ""
      });
      onClose();
      return;
    }
    
    // When in search mode and selecting an existing food from search
    if (actionType === 'search' && selected) {
      if (!quantity) { 
        showError("Missing Quantity", "Please enter a quantity for the selected food.");
        return;
      }
      const k = kcalSelected;
      if (typeof k !== "number") { 
        showError("Calorie Information Missing", "Calorie information per unit was not found for this food.");
        return;
      }
      onConfirm({ 
        name: selected.name, 
        quantity: Number(quantity), 
        kCal: Math.round(k * Number(quantity)),
        kcalPerUnit: k,
        svgLink: selected.svgLink || selected.icon || createIcon || ""
      });
      onClose(); 
      return;
    }
    
    // Fallback: When creating a new food (legacy compatibility)
    if (!name || !quantity || !kcalPerUnit) {
      showError("Incomplete Information", "Please complete the food name, quantity, and calories per unit.");
      return;
    }
    onConfirm({ 
      name, 
      quantity: Number(quantity), 
      kCal: Math.round(Number(kcalPerUnit) * Number(quantity)),
      kcalPerUnit: Number(kcalPerUnit),
      svgLink: createIcon || ""
    });
    onClose();
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-2xl bg-neutral-900 border border-amber-800/30 rounded-2xl shadow-2xl overflow-hidden"
        style={{ zIndex: 96 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-amber-800/40">
          <h4 className="text-amber-100 font-semibold text-sm md:text-base">
            {editingItem ? "Edit food" : 
             actionType === 'create' ? "Create New Food" : "Search Existing Food"}
          </h4>
          <button onClick={onClose} className="p-2 text-amber-200 hover:text-amber-50">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 max-h-[75vh] overflow-y-auto">
          {actionType === 'search' ? (
            // Search Mode - Focus on finding existing foods
            <div className="space-y-4">
              {/* Search Section */}
              <div>
                <Label className="text-amber-200 text-sm mb-2 block">Search for existing food</Label>
                <div className="relative">
                  <input
                    ref={searchRef}
                    type="text"
                    placeholder="Type food name to search..."
                    value={name}
                    onChange={(e) => onChangeName(e.target.value)}
                    onKeyDown={onKeyDownSearch}
                    className={inputClass}
                  />
                  {showDropdown && results.length > 0 && (
                    <div className="absolute z-20 w-full mt-1 bg-amber-800 border border-amber-700 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                      {results.map((food, i) => {
                        const k = getKcalFromFood(food);
                        const active = i === activeIndex;
                        return (
                          <button
                            key={`${food.id ?? food.name}-${i}`}
                            type="button"
                            onMouseEnter={() => setActiveIndex(i)}
                            onClick={async () => {
                              setSelected(food);
                              onChangeName(food.name);
                              // Only set kcal automatically in search mode
                              if (actionType === 'search' && typeof k === "number") {
                                setKcalPerUnit(k);
                              }
                              await hydrateSelectedWithDetails(food);
                            }}
                            className={`w-full text-left px-4 py-2 border-b border-amber-700 last:border-b-0 transition-colors ${active ? "bg-amber-700 text-white" : "hover:bg-amber-700/60 text-amber-100"}`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="truncate">{food.name}</span>
                              <span className="text-xs opacity-80">{typeof k === "number" ? `${k} kcal/unit` : "s/kcal"}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                
                {/* Search Status */}
                <div className="mt-2">
                  {selected ? (
                    <div className="text-sm text-green-200 bg-green-900/30 border border-green-700 rounded-lg p-3">
                      ✓ Selected: <strong>{selected.name}</strong>
                      {kcalSelected && <span className="text-xs block mt-1">{kcalSelected} kcal per unit</span>}
                    </div>
                  ) : name.trim().length > 2 ? (
                    results.length === 0 ? (
                      <div className="text-sm text-amber-200 bg-amber-900/30 border border-amber-700 rounded-lg p-3 space-y-3">
                        <div>No existing foods found for &ldquo;{name.trim()}&rdquo;.</div>
                        {onSwitchToCreate && (
                          checkFoodNameExists(name.trim()) ? (
                            <div className="text-xs text-red-400 bg-red-900/30 border border-red-700 rounded p-2">
                              ⚠️ A food named &ldquo;{name.trim()}&rdquo; already exists in the database. Try searching with the exact name or use a different search term.
                            </div>
                          ) : (
                            <Button
                              onClick={() => {
                                onSwitchToCreate();
                              }}
                              className="w-full bg-amber-700 hover:bg-amber-600 text-amber-100 border border-amber-600 text-sm py-2 flex items-center justify-center gap-2"
                            >
                              <Plus className="w-4 h-4" />
                              Create &ldquo;{name.trim()}&rdquo; as new food
                            </Button>
                          )
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-blue-200 bg-blue-900/30 border border-blue-700 rounded-lg p-3">
                        {results.length} food{results.length !== 1 ? 's' : ''} found. Click one to select it.
                      </div>
                    )
                  ) : (
                    <div className="text-sm text-gray-400 bg-gray-900/30 border border-gray-700 rounded-lg p-3">
                      Start typing to search for existing foods...
                    </div>
                  )}
                </div>
              </div>

              {/* Food Details - Show when food is selected */}
              {selected && (
                <div className="border-t border-amber-800/30 pt-4">
                  <Label className="text-amber-200 text-sm mb-3 block">Food Details</Label>
                  <div className="bg-amber-900/20 border border-amber-700/50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 flex items-center justify-center bg-amber-800/30 rounded-full border border-amber-700/50 flex-shrink-0">
                        {selected.svgLink ? (
                          <Image 
                            src={selected.svgLink} 
                            alt={selected.name} 
                            width={24}
                            height={24}
                            className="w-6 h-6 object-contain" 
                          />
                        ) : (
                          <Utensils className="w-5 h-5 text-amber-400" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-amber-100">{selected.name}</h4>
                        <p className="text-sm text-amber-300">{kcalSelected} kcal per unit</p>
                      </div>
                    </div>
                    
                    {/* Show preferences and restrictions if available */}
                    {selected.preferences && selected.preferences.length > 0 && (
                      <div>
                        <p className="text-xs text-amber-200 mb-1">Preferences:</p>
                        <div className="flex flex-wrap gap-1">
                          {selected.preferences.map((pref, index) => (
                            <span key={index} className="bg-amber-800/40 text-amber-200 text-xs px-2 py-1 rounded">
                              {typeof pref === 'string' ? pref : (typeof pref === 'object' && pref && 'name' in pref ? pref.name : `ID: ${typeof pref === 'number' ? pref : 'Unknown'}`)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {selected.dietaryRestrictions && selected.dietaryRestrictions.length > 0 && (
                      <div>
                        <p className="text-xs text-amber-200 mb-1">Dietary Restrictions:</p>
                        <div className="flex flex-wrap gap-1">
                          {selected.dietaryRestrictions.map((restriction, index) => (
                            <span key={index} className="bg-green-800/40 text-green-200 text-xs px-2 py-1 rounded">
                              {typeof restriction === 'string' ? restriction : (typeof restriction === 'object' && restriction && 'name' in restriction ? restriction.name : `ID: ${typeof restriction === 'number' ? restriction : 'Unknown'}`)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Quantity Section - Only show if food is selected */}
              {selected && (
                <div>
                  <Label className="text-amber-200 text-sm mb-2 block">Quantity</Label>
                  <input
                    type="number"
                    min={1}
                    placeholder="Enter quantity"
                    value={quantity === "" ? "" : quantity}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '') {
                        props.setQuantity('');
                      } else {
                        const num = Number(val);
                        if (!isNaN(num)) {
                          props.setQuantity(num);
                        }
                      }
                    }}
                    className={inputClass}
                  />
                  {liveKcal !== undefined && (
                    <p className="mt-1 text-xs text-amber-300">Total: <b>{liveKcal}</b> kcal</p>
                  )}
                </div>
              )}
            </div>
          ) : (
            // Create Mode - Focus on creating new food
            <div className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-amber-200 text-sm mb-2 block">Food Name</Label>
                  <input
                    type="text"
                    placeholder="Enter food name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={editingItem?.id !== undefined}
                    className={`${inputClass} ${editingItem?.id ? 'bg-amber-900/50 text-amber-300 cursor-not-allowed' : ''} ${
                      actionType === 'create' && name.trim() && checkFoodNameExists(name) 
                        ? 'border-red-500 focus:ring-red-500' 
                        : ''
                    }`}
                  />
                  {editingItem?.id && (
                    <p className="mt-1 text-xs text-amber-400">Existing food name cannot be changed</p>
                  )}
                  {actionType === 'create' && name.trim() && checkFoodNameExists(name) && (
                    <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                      ⚠️ A food with this name already exists. Please choose a different name.
                    </p>
                  )}
                  {actionType === 'create' && name.trim() && !checkFoodNameExists(name) && name.length > 2 && (
                    <p className="mt-1 text-xs text-green-400 flex items-center gap-1">
                      ✓ Food name is available
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-amber-200 text-sm mb-2 block">Quantity</Label>
                  <input
                    type="number"
                    min={1}
                    placeholder="Enter quantity"
                    value={quantity === "" ? "" : quantity}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '') {
                        props.setQuantity('');
                      } else {
                        const num = Number(val);
                        if (!isNaN(num)) {
                          props.setQuantity(num);
                        }
                      }
                    }}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-amber-200 text-sm mb-2 block">Calories per unit</Label>
                  <input
                    type="number"
                    min={0}
                    placeholder={actionType === 'create' ? "1" : "kcal per unit"}
                    value={kcalPerUnit}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '') {
                        props.setKcalPerUnit('');
                      } else {
                        const num = Number(val);
                        if (!isNaN(num) && num >= 0) {
                          props.setKcalPerUnit(num);
                        }
                      }
                    }}
                    disabled={editingItem?.id !== undefined}
                    className={`${inputClass} ${editingItem?.id ? 'bg-amber-900/50 text-amber-300 cursor-not-allowed' : ''}`}
                  />
                  {editingItem?.id && (
                    <p className="mt-1 text-xs text-amber-400">Existing food calories cannot be changed</p>
                  )}
                  {liveKcal !== undefined && (
                    <p className="mt-1 text-xs text-amber-300">Total: <b>{liveKcal}</b> kcal</p>
                  )}
                </div>
                <div>
                  <Label className="text-amber-200 text-sm mb-2 block">Icon</Label>
                  {editingItem?.id ? (
                    <div className="text-amber-300 text-sm p-2 bg-amber-900/20 border border-amber-800/30 rounded-lg">
                      Icon cannot be changed for existing foods
                    </div>
                  ) : (
                    <IconSelect onSelectionChange={setCreateIcon} />
                  )}
                </div>
              </div>

              {/* Advanced Options */}
              <div className="border-t border-amber-800/30 pt-4">
                <Label className="text-amber-200 text-sm mb-3 block">Dietary Information {editingItem?.id ? '(Read-only)' : '(Optional)'}</Label>
                {editingItem?.id ? (
                  <div className="space-y-3 text-amber-300">
                    <div className="bg-amber-900/20 border border-amber-800/30 rounded-lg p-3">
                      <h4 className="text-sm font-medium mb-2">Current Preferences:</h4>
                      {createPreferences && createPreferences.length > 0 ? (
                        <div className="text-xs">
                          {createPreferences.length} preference(s) set
                        </div>
                      ) : (
                        <div className="text-xs text-amber-400">No preferences set</div>
                      )}
                    </div>
                    <div className="bg-amber-900/20 border border-amber-800/30 rounded-lg p-3">
                      <h4 className="text-sm font-medium mb-2">Current Restrictions:</h4>
                      {createHasRestrictions === true ? (
                        <div className="text-xs text-green-300">✓ For Everyone (No restrictions)</div>
                      ) : createRestrictions && createRestrictions.length > 0 ? (
                        <div className="text-xs text-orange-300">
                          ⚠ {createRestrictions.length} restriction(s) set
                        </div>
                      ) : (
                        <div className="text-xs text-amber-400">No restrictions defined</div>
                      )}
                    </div>
                    <div className="text-xs text-amber-400 mt-2">
                      Dietary information cannot be changed for existing foods. Only quantity can be modified.
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <DropdownWrapper label="Preferences">
                      <CustomCheckbox
                        initialOptions={createPreferences}
                        endpoint="preferences"
                        onSelectionChange={setCreatePreferences}
                      />
                    </DropdownWrapper>
                    
                    <div>
                      <Label className="text-amber-200 mb-3 block">Does this food have dietary restrictions?</Label>
                      <div className="flex gap-4 mb-4">
                        <button
                          type="button"
                          onClick={() => setCreateHasRestrictions(true)}
                          className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                            createHasRestrictions === true
                              ? 'bg-amber-700 border-amber-600 text-white'
                              : 'bg-neutral-700 border-amber-800/30 text-amber-200 hover:border-amber-700/50'
                          }`}
                        >
                          No restrictions (For Everyone)
                        </button>
                        <button
                          type="button"
                          onClick={() => setCreateHasRestrictions(false)}
                          className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                            createHasRestrictions === false
                              ? 'bg-amber-700 border-amber-600 text-white'
                              : 'bg-neutral-700 border-amber-800/30 text-amber-200 hover:border-amber-700/50'
                          }`}
                        >
                          Has restrictions
                        </button>
                      </div>
                      
                      {createHasRestrictions === false && (
                        <DropdownWrapper label="Select Dietary Restrictions">
                          <CustomCheckbox
                            initialOptions={createRestrictions}
                            endpoint="dietary-restrictions/excluding-for-everyone"
                            onSelectionChange={setCreateRestrictions}
                          />
                        </DropdownWrapper>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="pt-1">
            <Button type="button" onClick={handleConfirm} className="w-full bg-amber-600 hover:bg-amber-700 text-white">
              {editingItem ? "Update food" : "Confirm and add food"}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}