// MYNUS 360 menu — source of truth supplied by the owner. Do not change names or prices.
import images from "@/assets/menu-images.json";

export type Size = { label: string; price: number };
export type MenuItem = {
  id: string;
  name: string;
  category: Category;
  group?: string;
  note?: string; // e.g. "4 pieces"
  sizes: Size[]; // one entry with label "" when no size choice
  image?: string;
};

export const CATEGORIES = [
  "Burgers", "Sandwiches", "Wraps", "Fries", "Pasta", "Garlic Bread", "Momos",
  "Chinese", "Pizza", "Desserts", "Mocktails", "Shakes", "Premium Shakes",
] as const;
export type Category = (typeof CATEGORIES)[number];

const img = images as Record<string, string>;
export const LOGO_URL = img["mynus360-logo"];
export const STORE_URL = img["store-interior"];

const one = (p: number): Size[] => [{ label: "", price: p }];
const ml = (m: number, l: number): Size[] => [{ label: "Medium", price: m }, { label: "Large", price: l }];
const rml = (r: number, m: number, l: number): Size[] => [
  { label: "Regular", price: r }, { label: "Medium", price: m }, { label: "Large", price: l },
];

type Row = [id: string, name: string, sizes: Size[], note?: string, group?: string];
const build = (category: Category, rows: Row[]): MenuItem[] =>
  rows.map(([id, name, sizes, note, group]) => ({ id, name, category, sizes, note, group, image: img[id] }));

export const MENU: MenuItem[] = [
  ...build("Burgers", [
    ["crispy-veg-burger", "Crispy Veg Burger", one(50)],
    ["cheese-burger", "Cheese Burger", one(60)],
    ["supreme-burger", "Supreme Burger", one(70)],
    ["dubble-crunch-burger", "Dubble Crunch Burger", one(80)],
    ["cheesy-mushroom-burger", "Cheesy Mushroom Burger", one(90)],
    ["paneer-makhani-burger", "Paneer Makhani Burger", one(100)],
    ["loaded-fries-burger", "Loaded Fries Burger", one(100)],
    ["pizza-burger", "Pizza Burger", one(120)],
    ["crispy-paneer-tikki-burger", "Crispy Paneer Tikki Burger", one(150)],
    ["maharaja-burger", "Maharaja Burger", one(150)],
  ]),
  ...build("Sandwiches", [
    ["potato-grilled-sandwich", "Potato Grilled Sandwich", one(100), "4 pieces"],
    ["paneer-grilled-sandwich", "Paneer Grilled Sandwich", one(140), "4 pieces"],
    ["mushroom-grilled-sandwich", "Mushroom Grilled Sandwich", one(140), "4 pieces"],
    ["veg-delight-sandwich", "Veg Delight Sandwich", one(150)],
    ["cheesy-mushroom-sandwich", "Cheesy Mushroom", one(180), "4 pieces"],
    ["cheese-corn-sandwich", "Cheese Corn Sandwich", one(180), "4 pieces"],
  ]),
  ...build("Wraps", [
    ["crispy-crunchy-wrap", "Crispy & Crunchy Wrap", one(60)],
    ["peri-peri-mushroom-wrap", "Peri Peri Mushroom Wrap", one(70)],
    ["paneer-makhani-wrap", "Paneer Makhani Wrap", one(80)],
    ["paneer-jalapeno-wrap", "Paneer Jalapeno Wrap", one(90)],
    ["cheesy-loaded-wrap", "Cheesy Loaded Wrap", one(120)],
    ["cheesy-mushroom-wrap", "Cheesy Mushroom Wrap", one(120)],
    ["crispy-paneer-tikki-wrap", "Crispy Paneer Tikki Wrap", one(150)],
    ["cheesy-affair-wrap", "Cheesy Affair Wrap", one(170)],
    ["creamy-alfredo-wrap", "Creamy Alfredo Wrap", one(180)],
  ]),
  ...build("Fries", [
    ["salted-fries", "Salted Fries", ml(70, 120)],
    ["masala-fries", "Masala Fries", ml(90, 140)],
    ["peri-peri-fries", "Peri Peri Fries", ml(100, 150)],
    ["ultimate-loaded-fries", "Ultimate Loaded Fries", ml(150, 200)],
    ["cheesy-fries", "Cheesy Fries", ml(160, 220)],
    ["paneer-tikki-fries", "Paneer Tikki Fries", one(270)],
  ]),
  ...build("Pasta", [
    ["white-sauce-pasta", "White Sauce Pasta", ml(140, 200)],
    ["red-sauce-pasta", "Red Sauce Pasta", ml(140, 200)],
    ["mix-sauce-pasta", "Mix Sauce Pasta", ml(150, 210)],
    ["chilli-garlic-pasta", "Chilli Garlic Pasta", ml(180, 240)],
    ["paneer-makhani-pasta", "Paneer Makhani Pasta", ml(200, 280)],
    ["alfredo-mushroom-pasta", "Classic Alfredo Mushroom Pasta", ml(200, 280)],
  ]),
  ...build("Garlic Bread", [
    ["cheesy-garlic-bread", "Cheesy Garlic Bread", one(80), "3 pcs"],
    ["supreme-garlic-bread", "Supreme Garlic Bread", one(100), "3 pcs"],
    ["cheesy-mushroom-garlic-bread", "Cheesy Mushroom", one(120), "3 pcs"],
    ["garlic-paneer", "Garlic Paneer", one(150), "3 pcs"],
  ]),
  ...build("Momos", [
    ["steam-veg-momos", "Steam Veg Momos", one(90), "8 pcs"],
    ["steam-cheesy-momos", "Steam Cheesy Momos", one(100), "8 pcs"],
    ["kurkure-veg-momos", "Kur Kure Veg Momos", one(120), "8 pcs"],
    ["kurkure-cheese-momos", "Kur Kure Cheese Momos", one(150), "8 pcs"],
    ["afghan-momos", "Afghan Momos", one(180), "8 pcs"],
    ["peri-peri-momos", "Peri Peri Momos", one(180), "8 pcs"],
    ["chilli-garlic-momos", "Chilli Garlic Momos", one(190), "8 pcs"],
    ["cheese-burst-momos", "Cheese Burst Momos", one(220), "8 pcs"],
    ["kurkure-cheese-burst-momos", "Kurkure Cheese Burst Momos", one(270), "8 pcs"],
  ]),
  ...build("Chinese", [
    ["cheese-chilly", "Cheese Chilly", one(220), "16 pcs"],
    ["crunchy-paneer-springroll", "Crunchy Paneer Springroll", one(120)],
    ["manchurian", "Manchurian", one(220), "16 pcs"],
  ]),
  ...build("Pizza", [
    ["cheese-onion-pizza", "Cheese Onion Pizza", rml(100, 180, 280), undefined, "Regular Pizza"],
    ["cheese-capsicum-pizza", "Cheese Capsicum Pizza", rml(100, 180, 280), undefined, "Regular Pizza"],
    ["cheese-tomato-pizza", "Cheese Tomato Pizza", rml(100, 180, 280), undefined, "Regular Pizza"],
    ["onion-capsicum-pizza", "Onion & Capsicum Pizza", rml(120, 200, 300), undefined, "Regular Pizza"],
    ["onion-mushroom-pizza", "Onion & Mushroom Pizza", rml(120, 200, 300), undefined, "Regular Pizza"],
    ["cheese-margherita-pizza", "Cheese Margherita Pizza", rml(120, 200, 300), undefined, "Regular Pizza"],
    ["cheese-corn-pizza", "Cheese & Corn Pizza", rml(120, 200, 300), undefined, "Regular Pizza"],
    ["paneer-makhani-pizza", "Paneer Makhani Pizza", rml(200, 300, 400), undefined, "Premium Pizza"],
    ["simply-veg-pizza", "Simply Veg Pizza", rml(200, 300, 400), undefined, "Premium Pizza"],
    ["farm-house-pizza", "Farm House Pizza", rml(200, 300, 400), undefined, "Premium Pizza"],
    ["spicy-garlic-paneer-pizza", "Spicy Garlic Paneer Pizza", rml(220, 340, 440), undefined, "Paneer Lovers' Pizza"],
    ["paneer-jalapeno-pizza", "Paneer Jalapeno Pizza", rml(220, 340, 440), undefined, "Paneer Lovers' Pizza"],
    ["peri-peri-paneer-pizza", "Peri Peri Paneer Pizza", rml(220, 340, 440), undefined, "Paneer Lovers' Pizza"],
    ["peppy-paneer-pizza", "Peppy Paneer Pizza", rml(220, 340, 440), undefined, "Paneer Lovers' Pizza"],
    ["burn-to-hell-pizza", "360 Special Pizza — Burn To Hell", rml(320, 430, 570), undefined, "360 Special Pizza"],
    ["chizzy-blast-pizza", "360 Special Pizza — Chizzy Blast", rml(320, 430, 570), undefined, "360 Special Pizza"],
  ]),
  ...build("Desserts", [
    ["rich-dry-fruit", "Rich Dry Fruit", one(30)],
    ["berry-cookie", "Berry Cookie", one(70)],
    ["cookie-crunch", "Cookie Crunch", one(70)],
    ["khoya-stick-kulfi", "Khoya Stick Kulfi", one(50)],
    ["biscoff-sundae", "Biscoff Ice Cream Sundae", one(140)],
    ["strawberry-chocolate-sundae", "Strawberry Chocolate Ice Cream Sundae", one(140)],
  ]),
  ...build("Mocktails", [
    ["virgin-mojito", "Virgin Mojito", ml(80, 140)],
    ["blue-curacao", "Blue Curacao", ml(80, 140)],
    ["strawberry-mocktail", "Strawberry", ml(80, 140)],
    ["cranberry", "Cranberry", ml(80, 140)],
    ["lemon-iced-tea", "Lemon Iced Tea", ml(80, 140)],
    ["green-apple", "Green Apple", ml(80, 140)],
    ["kaccha-mango-bite", "Kaccha Mango Bite", ml(80, 140)],
    ["pina-colada", "Pina Colada", ml(80, 140)],
    ["fruit-beer", "Fruit Beer", one(40)],
  ]),
  ...build("Shakes", [
    ["vanilla-shake", "Vanilla", ml(80, 140)],
    ["strawberry-shake", "Strawberry", ml(80, 140)],
    ["butterscotch-shake", "Butterscotch", ml(80, 140)],
    ["chocolate-shake", "Chocolate", ml(90, 140)],
    ["blackcurrant-shake", "Blackcurrant", ml(90, 140)],
    ["mango-shake", "Mango", ml(90, 140)],
    ["banana-shake", "Banana", ml(90, 140)],
    ["cold-coffee", "Cold Coffee", ml(90, 140)],
    ["pineapple-shake", "Pineapple", ml(90, 140)],
  ]),
  ...build("Premium Shakes", [
    ["kitkat-shake", "KitKat", ml(100, 160)],
    ["oreo-butterscotch-shake", "Oreo Butterscotch", ml(100, 160)],
    ["strawberry-premium-shake", "Strawberry", ml(100, 160)],
    ["oreo-shake", "Oreo", ml(100, 160)],
    ["nutella-choco-chips-shake", "Nutella and Choco Chips", ml(100, 160)],
    ["brownie-shake", "Brownie", ml(100, 160)],
    ["berry-blast-shake", "Berry Blast", ml(100, 160)],
    ["berry-crunch-shake", "Berry Crunch", ml(100, 160)],
    ["kitkat-white-shake", "KitKat White", ml(100, 160)],
    ["sweetheart-oreo-shake", "Sweetheart Oreo", ml(100, 160)],
  ]),
];

export const rupee = (n: number) => `₹${n.toLocaleString("en-IN")}`;
export const fromPrice = (i: MenuItem) => Math.min(...i.sizes.map((s) => s.price));
