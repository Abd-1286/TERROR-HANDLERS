// Public website view. Shown when the app is opened in a plain browser (not the
// Electron desktop app). It only describes FinDesk — the actual features run
// locally on the user's device, offline, so they aren't exposed here.

const FEATURE_OVERVIEW = [
  {
    icon: "🧾",
    title: "Tax Deduction Finder",
    desc: "Import a bank or card CSV and a local AI flags likely business write-offs. You confirm, then export a report for your accountant.",
  },
  {
    icon: "🔁",
    title: "Subscription Manager",
    desc: "Describe your subscriptions in plain English. See every plan, your true monthly and yearly spend, and when each one renews.",
  },
  {
    icon: "📈",
    title: "Cash-Flow Forecaster",
    desc: "Project your balance forward from recurring income and bills. Spot your lowest point and get warned before you overdraft.",
  },
  {
    icon: "🚨",
    title: "Spending Anomalies",
    desc: "Coming soon — automatically surface charges that don't match your normal spending pattern.",
  },
];

export default function Landing({ onPreview }) {
  return (
    <div className="min-h-screen w-full overflow-y-auto bg-[#0b0f14] text-slate-200">
      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-4xl">💰</span>
          <span className="text-xl font-bold text-white">FinDesk</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight tracking-tight">
          Your money, on{" "}
          <span className="text-emerald-400">your machine.</span>
        </h1>
        <p className="text-lg text-slate-400 mt-4 max-w-xl">
          FinDesk is a private finance toolkit that runs entirely on your own
          device. Your bank data is read, analyzed, and stored locally — it never
          touches the internet.
        </p>

        <div className="inline-flex items-center gap-2 text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 mt-6">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          100% local · offline · no accounts, no cloud
        </div>

        {/* How it works */}
        <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-sm text-slate-300 leading-relaxed">
            FinDesk runs a small AI model{" "}
            <span className="text-white font-medium">on your computer</span> (via
            Ollama) to read your finances. Because everything happens on-device,
            the features live in the <span className="text-white font-medium">desktop app</span>,
            not on this website. This page is just the overview.
          </p>
        </div>

        {/* Features */}
        <h2 className="text-xl font-bold text-white mt-12 mb-4">What's inside</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {FEATURE_OVERVIEW.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5"
            >
              <div className="text-2xl mb-2">{f.icon}</div>
              <h3 className="text-sm font-semibold text-slate-100">{f.title}</h3>
              <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-center">
          <p className="text-slate-300">
            Open the <span className="text-white font-medium">FinDesk desktop app</span>{" "}
            to get started — your data stays with you.
          </p>
          {import.meta.env.DEV && (
            <button
              onClick={onPreview}
              className="mt-4 rounded-lg bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-medium text-slate-300 transition"
            >
              Preview the app (dev only)
            </button>
          )}
        </div>

        <p className="text-center text-xs text-slate-700 mt-10">
          FinDesk · built for the hackathon · runs offline
        </p>
      </div>
    </div>
  );
}
