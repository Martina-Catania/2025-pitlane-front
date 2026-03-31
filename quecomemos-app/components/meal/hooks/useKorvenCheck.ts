import { useState, useEffect } from 'react';

interface KorvenProduct {
  name: string;
}

// Function to check if a name contains connectors (for meal names)
const hasConnectors = (name: string): boolean => {
  const connectors = ['con', 'y', 'de', 'al', 'en', 'para', 'sin', 'a', 'el', 'la', 'los', 'las'];
  const words = name.toLowerCase().split(/\s+/);
  return words.some(word => connectors.includes(word));
};

let cachedProducts: KorvenProduct[] | null = null;
let isLoading = false;
let loadPromise: Promise<KorvenProduct[]> | null = null;

const fetchKorvenProducts = async (): Promise<KorvenProduct[]> => {
  if (cachedProducts) {
    return cachedProducts;
  }

  if (isLoading && loadPromise) {
    return loadPromise;
  }

  // Korven integration is temporarily disabled.
  cachedProducts = [];
  isLoading = false;
  loadPromise = Promise.resolve(cachedProducts);

  return cachedProducts;
};

export const useKorvenCheck = () => {
  const [products, setProducts] = useState<KorvenProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKorvenProducts().then(products => {
      setProducts(products);
      setLoading(false);
    });
  }, []);

  const isKorvenInspiredFood = (name: string): boolean => {
    if (!name || products.length === 0) return false;
    return products.some(
      product => product.name.toLowerCase() === name.toLowerCase() && !hasConnectors(product.name)
    );
  };

  const isKorvenInspiredMeal = (name: string): boolean => {
    if (!name || products.length === 0) return false;
    return products.some(
      product => product.name.toLowerCase() === name.toLowerCase() && hasConnectors(product.name)
    );
  };

  return {
    korvenProducts: products,
    isLoadingKorven: loading,
    isKorvenInspiredFood,
    isKorvenInspiredMeal,
    loading
  };
};
