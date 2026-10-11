import { expect, it } from "bun:test";
import { applyMenuOverrides } from "./menu-catalog";
it("preserves original owner prices without overrides", () => {
  expect(applyMenuOverrides([]).find(i => i.id === "crispy-veg-burger")?.sizes[0]?.price).toBe(50);
});
it("unavailable items cannot be ordered", () => {
  expect(applyMenuOverrides([{item_id:"crispy-veg-burger",available:false,prices:{}}]).some(i=>i.id==="crispy-veg-burger")).toBe(false);
});
it("owner price overrides are used for the existing item", () => {
  expect(applyMenuOverrides([{item_id:"crispy-veg-burger",available:true,prices:{"":75}}]).find(i=>i.id==="crispy-veg-burger")?.sizes[0]?.price).toBe(75);
});