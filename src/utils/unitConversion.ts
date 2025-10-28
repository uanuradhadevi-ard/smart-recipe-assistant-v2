export type StoreUnit = 'g' | 'kg' | 'ml' | 'l';

const LIQUID_HINTS = ['water', 'milk', 'oil', 'broth', 'stock', 'juice', 'vinegar', 'sauce', 'cream'];

const DENSITY_G_PER_ML: Record<string, number> = {
  'flour': 0.53,
  'sugar': 0.85,
  'rice': 0.85,
  'butter': 0.91,
  'honey': 1.42,
};

function looksLiquid(ingredient: string): boolean {
  const name = ingredient.toLowerCase();
  return LIQUID_HINTS.some(h => name.includes(h));
}

function toNumber(val: string): number | null {
  const v = val.trim();
  if (/^\d+\s*\/\s*\d+$/.test(v)) {
    const [a,b] = v.split('/').map(Number);
    return b ? a / b : null;
  }
  const m = v.match(/\d*\.?\d+/);
  return m ? parseFloat(m[0]) : null;
}

export function convertToStoreUnits(ingredient: string, measure: string | undefined): { amount: number; unit: StoreUnit } | null {
  if (!measure || !measure.trim()) return null;
  const m = measure.toLowerCase();
  const amount = toNumber(m) ?? 1;
  
  if (/(teaspoon|tsp)/.test(m)) {
    const ml = amount * 5;
    return normalizeLiquid(ml);
  }
  if (/(tablespoon|tbsp)/.test(m)) {
    const ml = amount * 15;
    return normalizeLiquid(ml);
  }
  if (/(cup|cups)/.test(m)) {
    if (looksLiquid(ingredient)) {
      const ml = amount * 240;
      return normalizeLiquid(ml);
    } else {
      const key = bestDensityKey(ingredient);
      if (key) {
        const grams = amount * 240 * DENSITY_G_PER_ML[key];
        return normalizeSolid(grams);
      }
    }
  }
  if (/(ml|milliliter)/.test(m)) {
    return normalizeLiquid(amount);
  }
  if (/(l|liter)/.test(m)) {
    return normalizeLiquid(amount * 1000);
  }
  if (/(g|gram)/.test(m)) {
    return normalizeSolid(amount);
  }
  if (/(kg|kilogram)/.test(m)) {
    return normalizeSolid(amount * 1000);
  }
  if (/(oz)/.test(m)) {
    return normalizeSolid(amount * 28.3495);
  }
  if (/(pint)/.test(m)) {
    return normalizeLiquid(amount * 473);
  }
  if (/(quart)/.test(m)) {
    return normalizeLiquid(amount * 946);
  }
  if (/(gallon)/.test(m)) {
    return normalizeLiquid(amount * 3785);
  }
  
  if (looksLiquid(ingredient)) {
    return normalizeLiquid(amount * 240);
  }
  return normalizeSolid(amount * 100);
}

function bestDensityKey(ingredient: string): string | null {
  const name = ingredient.toLowerCase();
  let key: string | null = null;
  for (const k of Object.keys(DENSITY_G_PER_ML)) {
    if (name.includes(k)) { key = k; break; }
  }
  return key;
}

function normalizeLiquid(ml: number): { amount: number; unit: StoreUnit } {
  if (ml >= 1000) return { amount: round(ml / 1000), unit: 'l' };
  return { amount: round(ml), unit: 'ml' };
}

function normalizeSolid(g: number): { amount: number; unit: StoreUnit } {
  if (g >= 1000) return { amount: round(g / 1000), unit: 'kg' };
  return { amount: round(g), unit: 'g' };
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}

export function formatStoreAmount(v: { amount: number; unit: StoreUnit } | null): string {
  if (!v) return '';
  return `${v.amount} ${v.unit}`;
}

