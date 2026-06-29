// Static product catalog — bundled with the app ("downloaded while online, used
// offline"). The Smart Goals Optimizer filters this locally; nothing is fetched
// at runtime. Each entry: generic product class + vendor + market price.

export const PRODUCT_CATALOG = [
  // laptops
  { product: "laptop", name: "AeroBook 14", vendor: "ByteMart", price: 2000 },
  { product: "laptop", name: "ProLite 15", vendor: "CompuWorld", price: 2350 },
  { product: "laptop", name: "UltraEdge Pro", vendor: "TechNova", price: 2750 },

  // phones
  { product: "phone", name: "Nova 8", vendor: "MobileHub", price: 650 },
  { product: "phone", name: "Pulse X", vendor: "CellPoint", price: 720 },

  // headphones
  { product: "headphones", name: "SilentWave 3", vendor: "AudioMart", price: 180 },
  { product: "headphones", name: "BassPods Pro", vendor: "SoundLabs", price: 240 },

  // monitors
  { product: "monitor", name: "ClearView 27", vendor: "PixelMart", price: 280 },
  { product: "monitor", name: "UltraWide 34", vendor: "DisplayCo", price: 520 },

  // tvs
  { product: "tv", name: "VividScreen 55", vendor: "HomeVision", price: 700 },
  { product: "tv", name: "CinemaMax 65", vendor: "ElectroDeals", price: 1100 },

  // tablets
  { product: "tablet", name: "SlatePad 11", vendor: "ByteMart", price: 480 },
  { product: "tablet", name: "SlatePad Mini", vendor: "GadgetGo", price: 330 },

  // smartwatches
  { product: "watch", name: "FitTime 2", vendor: "WearHub", price: 220 },

  // cameras
  { product: "camera", name: "SnapPro X", vendor: "FotoMart", price: 900 },

  // keyboards
  { product: "keyboard", name: "KeyType Mech", vendor: "GearShop", price: 90 },
];
