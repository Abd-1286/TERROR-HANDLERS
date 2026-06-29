// Catalog of common subscriptions with real US plan pricing (approximate, 2026).
// The model identifies the service + plan from the user's words; the PRICE,
// cancel URL, and ad flag always come from here — never from the model — so the
// totals stay accurate even with a small local model.
// Prices are editable per-subscription in the UI if they drift.

export const SUBSCRIPTION_CATALOG = [
  {
    service: "Netflix",
    icon: "🎬",
    cancelUrl: "https://www.netflix.com/cancelplan",
    plans: [
      { plan: "Standard with Ads", price: 7.99, cycle: "monthly", adSupported: true },
      { plan: "Standard", price: 17.99, cycle: "monthly", adSupported: false },
      { plan: "Premium", price: 24.99, cycle: "monthly", adSupported: false },
    ],
  },
  {
    service: "Spotify",
    icon: "🎧",
    cancelUrl: "https://www.spotify.com/account/subscription/",
    plans: [
      { plan: "Student", price: 5.99, cycle: "monthly", adSupported: false },
      { plan: "Individual", price: 11.99, cycle: "monthly", adSupported: false },
      { plan: "Duo", price: 16.99, cycle: "monthly", adSupported: false },
      { plan: "Family", price: 19.99, cycle: "monthly", adSupported: false },
    ],
  },
  {
    service: "Disney+",
    icon: "🏰",
    cancelUrl: "https://www.disneyplus.com/account/subscription",
    plans: [
      { plan: "Basic (With Ads)", price: 9.99, cycle: "monthly", adSupported: true },
      { plan: "Premium", price: 15.99, cycle: "monthly", adSupported: false },
    ],
  },
  {
    service: "Hulu",
    icon: "📺",
    cancelUrl: "https://secure.hulu.com/account",
    plans: [
      { plan: "With Ads", price: 9.99, cycle: "monthly", adSupported: true },
      { plan: "No Ads", price: 18.99, cycle: "monthly", adSupported: false },
    ],
  },
  {
    service: "Max",
    icon: "🟣",
    cancelUrl: "https://www.max.com/account",
    plans: [
      { plan: "With Ads", price: 9.99, cycle: "monthly", adSupported: true },
      { plan: "Ad-Free", price: 16.99, cycle: "monthly", adSupported: false },
      { plan: "Ultimate", price: 20.99, cycle: "monthly", adSupported: false },
    ],
  },
  {
    service: "YouTube Premium",
    icon: "▶️",
    cancelUrl: "https://www.youtube.com/paid_memberships",
    plans: [
      { plan: "Individual", price: 13.99, cycle: "monthly", adSupported: false },
      { plan: "Family", price: 22.99, cycle: "monthly", adSupported: false },
      { plan: "Student", price: 7.99, cycle: "monthly", adSupported: false },
    ],
  },
  {
    service: "Amazon Prime",
    icon: "📦",
    cancelUrl: "https://www.amazon.com/gp/primecentral",
    plans: [
      { plan: "Monthly", price: 14.99, cycle: "monthly", adSupported: false },
      { plan: "Annual", price: 139.0, cycle: "yearly", adSupported: false },
    ],
  },
  {
    service: "Apple Music",
    icon: "🍎",
    cancelUrl: "https://music.apple.com/account/subscriptions",
    plans: [
      { plan: "Student", price: 5.99, cycle: "monthly", adSupported: false },
      { plan: "Individual", price: 10.99, cycle: "monthly", adSupported: false },
      { plan: "Family", price: 16.99, cycle: "monthly", adSupported: false },
    ],
  },
  {
    service: "ChatGPT Plus",
    icon: "🤖",
    cancelUrl: "https://chatgpt.com/#settings/Subscription",
    plans: [{ plan: "Plus", price: 20.0, cycle: "monthly", adSupported: false }],
  },
  {
    service: "Adobe Creative Cloud",
    icon: "🎨",
    cancelUrl: "https://account.adobe.com/plans",
    plans: [
      { plan: "All Apps", price: 59.99, cycle: "monthly", adSupported: false },
      { plan: "Photography", price: 9.99, cycle: "monthly", adSupported: false },
    ],
  },
  {
    service: "Microsoft 365",
    icon: "🪟",
    cancelUrl: "https://account.microsoft.com/services",
    plans: [
      { plan: "Personal", price: 6.99, cycle: "monthly", adSupported: false },
      { plan: "Family", price: 9.99, cycle: "monthly", adSupported: false },
    ],
  },
  {
    service: "Peacock",
    icon: "🦚",
    cancelUrl: "https://www.peacocktv.com/account/subscription",
    plans: [
      { plan: "Premium", price: 7.99, cycle: "monthly", adSupported: true },
      { plan: "Premium Plus", price: 13.99, cycle: "monthly", adSupported: false },
    ],
  },
  {
    service: "Paramount+",
    icon: "⛰️",
    cancelUrl: "https://www.paramountplus.com/account/",
    plans: [
      { plan: "Essential", price: 7.99, cycle: "monthly", adSupported: true },
      { plan: "With Showtime", price: 12.99, cycle: "monthly", adSupported: false },
    ],
  },
  {
    service: "Xbox Game Pass",
    icon: "🎮",
    cancelUrl: "https://account.microsoft.com/services",
    plans: [{ plan: "Ultimate", price: 19.99, cycle: "monthly", adSupported: false }],
  },
  {
    service: "GitHub Copilot",
    icon: "🐙",
    cancelUrl: "https://github.com/settings/billing",
    plans: [
      { plan: "Pro", price: 10.0, cycle: "monthly", adSupported: false },
      { plan: "Pro+", price: 39.0, cycle: "monthly", adSupported: false },
    ],
  },
  {
    service: "iCloud+",
    icon: "☁️",
    cancelUrl: "https://support.apple.com/icloud",
    plans: [
      { plan: "50GB", price: 0.99, cycle: "monthly", adSupported: false },
      { plan: "200GB", price: 2.99, cycle: "monthly", adSupported: false },
      { plan: "2TB", price: 9.99, cycle: "monthly", adSupported: false },
    ],
  },
];

// Flat list of "Service — Plan" options for the manual quick-add dropdown.
export const CATALOG_OPTIONS = SUBSCRIPTION_CATALOG.flatMap((svc) =>
  svc.plans.map((p) => ({
    key: `${svc.service}__${p.plan}`,
    service: svc.service,
    icon: svc.icon,
    cancelUrl: svc.cancelUrl,
    ...p,
  })),
);
