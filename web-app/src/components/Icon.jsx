// Shared SVG icons (Lucide) keyed by feature id, so the sidebar and dashboard
// use the same crisp icon set instead of emoji.

import {
  Home,
  Receipt,
  Repeat,
  TrendingUp,
  ShieldAlert,
  SlidersHorizontal,
  Target,
  Settings,
} from "lucide-react";

const MAP = {
  home: Home,
  deductions: Receipt,
  subscriptions: Repeat,
  cashflow: TrendingUp,
  anomalies: ShieldAlert,
  whatif: SlidersHorizontal,
  goals: Target,
  settings: Settings,
};

export function FeatureIcon({ id, ...props }) {
  const Cmp = MAP[id] || Home;
  return <Cmp strokeWidth={2} {...props} />;
}
