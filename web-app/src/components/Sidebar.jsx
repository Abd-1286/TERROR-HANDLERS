// App navigation. Each feature is one entry here; add future finance features
// to FEATURES and render them from App.jsx.

export const FEATURES = [
  { id: "home", label: "Home", icon: "🏠", ready: true },
  { id: "deductions", label: "Tax Deduction Finder", icon: "🧾", ready: true },
  { id: "subscriptions", label: "Subscription Manager", icon: "🔁", ready: true },
  { id: "cashflow", label: "Cash-Flow Forecaster", icon: "📈", ready: true },
  { id: "anomalies", label: "Spending Anomalies", icon: "🚨", ready: true },
];

export default function Sidebar({ active, onSelect }) {
  return (
    <aside className="w-64 shrink-0 border-r border-slate-800 bg-slate-950/60 flex flex-col">
      <div className="px-5 py-5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-2xl">💰</span>
          <div>
            <h1 className="text-base font-bold text-white leading-tight">FinDesk</h1>
            <p className="text-[11px] text-slate-500">100% local · offline</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {FEATURES.map((f) => {
          const isActive = f.id === active;
          return (
            <button
              key={f.id}
              disabled={!f.ready}
              onClick={() => f.ready && onSelect(f.id)}
              className={[
                "w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-left transition",
                isActive
                  ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30"
                  : f.ready
                    ? "text-slate-300 hover:bg-slate-800/70"
                    : "text-slate-600 cursor-not-allowed",
              ].join(" ")}
            >
              <span className="text-lg">{f.icon}</span>
              <span className="flex-1">{f.label}</span>
              {!f.ready && (
                <span className="text-[10px] uppercase tracking-wide text-slate-600">
                  soon
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 text-[11px] text-slate-600 border-t border-slate-800">
        Your data never leaves this machine.
      </div>
    </aside>
  );
}
