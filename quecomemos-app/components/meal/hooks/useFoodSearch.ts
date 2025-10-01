import { useEffect, useMemo, useRef, useState } from "react";
import { ExistingFood } from "../types";
import { kcal100 } from "../utils";

type UseFoodSearchParams = {
  apiBase: string;
  open: boolean; 
  initialFoods?: ExistingFood[];
};

export function useFoodSearch({ apiBase, open, initialFoods }: UseFoodSearchParams) {
  const [allFoods, setAllFoods] = useState<ExistingFood[]>(initialFoods ?? []);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ExistingFood[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selected, setSelected] = useState<ExistingFood | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    if (!open) return;
    let cancel = false;
    (async () => {
      try {
        const res = await fetch(`${apiBase}/foods`);
        const data: ExistingFood[] = await res.json();
        if (!cancel) setAllFoods(Array.isArray(data) ? data : []);
      } catch { /* ignore */ }
    })();
    return () => { cancel = true; };
  }, [apiBase, open]);

  const [q, setQ] = useState("");
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => setQ(query.trim().toLowerCase()), 250);
    return () => clearTimeout(t);
  }, [query, open]);

  useEffect(() => {
    if (!open) return;
    if (!q) {
      setResults([]); setShowDropdown(false); setActiveIndex(-1); setSelected(null);
      return;
    }
    const filtered = allFoods.filter(f => f.name?.toLowerCase().includes(q)).slice(0, 12);
    setResults(filtered);
    setShowDropdown(true);
    setActiveIndex(filtered.length ? 0 : -1);

    const exact = filtered.find(f => f.name?.toLowerCase() === q);
    if (exact) {
      setSelected(exact);
      setShowDropdown(false);
    } else {
      setSelected(null);
    }
  }, [q, allFoods, open]);

  const kcalSelected = useMemo(() => kcal100(selected), [selected]);

  return {
    query, setQuery,
    results, showDropdown,
    selected, setSelected,
    activeIndex, setActiveIndex,
    kcalSelected,
  };
}