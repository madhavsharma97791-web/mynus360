import { MENU, type MenuItem } from "./menu";
export type MenuOverride = { item_id: string; available: boolean; prices: unknown };
export function applyMenuOverrides(overrides: MenuOverride[]): MenuItem[] {
  return MENU.filter(item => overrides.find(o => o.item_id === item.id)?.available !== false).map(item => {
    const prices = overrides.find(o => o.item_id === item.id)?.prices;
    return { ...item, sizes: item.sizes.map(size => {
      const value = prices && typeof prices === "object" && !Array.isArray(prices) ? (prices as Record<string, unknown>)[size.label] : undefined;
      return { ...size, price: typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : size.price };
    }) };
  });
}