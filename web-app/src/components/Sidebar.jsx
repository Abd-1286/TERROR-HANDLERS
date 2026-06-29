// App navigation — Liquid Glass styling. Labels are translated via i18n.

import { Wallet } from "lucide-react";
import { useT } from "../lib/i18n";
import { FeatureIcon } from "./Icon";

export const FEATURES = [
  { id: "home", ready: true },
  { id: "deductions", ready: true },
  { id: "subscriptions", ready: true },
  { id: "cashflow", ready: true },
  { id: "anomalies", ready: true },
  { id: "whatif", ready: true },
  { id: "goals", ready: true },
  { id: "settings", ready: true },
];

export default function Sidebar({ active, onSelect }) {
  const t = useT();
  return (
    <aside className="glass w-64 shrink-0 flex flex-col border-y-0 border-l-0">
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className="icon-chip h-10 w-10">
            <Wallet size={20} strokeWidth={2.2} />
          </span>
          <div>
            <h1 className="text-base font-bold text-white leading-tight tracking-tight">
              {t("app.name")}
            </h1>
            <p className="text-[11px] text-slate-400">{t("app.local")}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1.5">
        {FEATURES.map((f) => {
          const isActive = f.id === active;
          return (
            <button
              key={f.id}
              disabled={!f.ready}
              onClick={() => f.ready && onSelect(f.id)}
              className={[
                "group relative w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-left transition-all duration-300",
                isActive
                  ? "glass-soft text-white ring-1 ring-white/15 shadow-[0_8px_24px_-12px_rgba(var(--accent-rgb),0.6)]"
                  : "text-slate-300 hover:bg-white/[0.07] hover:text-white",
              ].join(" ")}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-full bg-[var(--accent)] shadow-[0_0_12px_2px_rgba(var(--accent-rgb),0.6)]" />
              )}
              <FeatureIcon
                id={f.id}
                size={18}
                className={isActive ? "text-[var(--accent)]" : ""}
              />
              <span className="flex-1">{t(`nav.${f.id}`)}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 text-[11px] text-slate-400 border-t border-white/10">
        {t("app.dataNote")}
      </div>
    </aside>
  );
}
