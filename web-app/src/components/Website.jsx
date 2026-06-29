// Public marketing website (shown when FinDesk is opened in a browser, not the
// desktop app). Liquid Glass design, matching the in-app look.

import { useState } from "react";
import { motion, MotionConfig } from "motion/react";
import {
  Wallet,
  Receipt,
  Repeat,
  TrendingUp,
  ShieldAlert,
  SlidersHorizontal,
  Target,
  ShieldCheck,
  WifiOff,
  Cpu,
  Lock,
  Download,
  ArrowRight,
  Code2,
  Mail,
  Check,
  ChevronDown,
} from "lucide-react";
import { useSettings } from "../lib/settings";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how" },
  { label: "Privacy", href: "#privacy" },
  { label: "About", href: "#about" },
  { label: "FAQ", href: "#faq" },
  { label: "Contact", href: "#contact" },
];

const FEATURES = [
  {
    icon: Receipt,
    title: "Tax Deduction Finder",
    blurb:
      "Import a bank or card statement and a local AI flags every plausible business write-off. You confirm each one, then export a clean report your accountant will love.",
    points: ["CSV import", "Schedule-C categorization", "One-click report export"],
  },
  {
    icon: Repeat,
    title: "Subscription Manager",
    blurb:
      "Describe your subscriptions in plain English — “Netflix Premium, Spotify Family” — and FinDesk identifies each plan, totals your true monthly and yearly spend, and tracks every renewal.",
    points: ["Natural-language entry", "Monthly ⇄ yearly totals", "Cancel & renewal tracking"],
  },
  {
    icon: TrendingUp,
    title: "Cash-Flow Forecaster",
    blurb:
      "Project your balance forward from recurring income and bills. See your lowest point on an interactive chart and get warned before you ever overdraft.",
    points: ["30 / 60 / 90-day projection", "Overdraft warnings", "Plain-English AI advice"],
  },
  {
    icon: ShieldAlert,
    title: "Spending Anomalies",
    blurb:
      "FinDesk learns your normal spending and flags the outliers — unusually large charges and probable duplicates — then explains, in one sentence, why each one stands out.",
    points: ["Statistical outlier detection", "Duplicate-charge alerts", "AI explanations"],
  },
  {
    icon: SlidersHorizontal,
    title: "What-If Simulator",
    blurb:
      "Model a raise, a spending cut, or a big one-time purchase with live sliders — and watch your projected balance recompute instantly, baseline versus scenario, fully offline.",
    points: ["Live scenario sliders", "Baseline vs. scenario chart", "Overdraft-avoided alerts"],
  },
  {
    icon: Target,
    title: "Smart Goals Optimizer",
    blurb:
      "Log a purchase in plain English. A local model normalizes it, checks your offline price catalog for a cheaper alternative, and turns the difference into a tracked savings goal.",
    points: ["Local purchase parsing", "Offline catalog price match", "Auto-created savings goals"],
  },
];

const STEPS = [
  {
    n: "01",
    title: "Install a local model",
    body: "FinDesk runs a small AI model on your own machine via Ollama. One download, no API keys, no accounts.",
  },
  {
    n: "02",
    title: "Bring your numbers",
    body: "Import a CSV or just describe your finances in plain English. Everything is read and stored locally.",
  },
  {
    n: "03",
    title: "Get answers — offline",
    body: "Categorized deductions, subscription totals, forecasts, and anomaly alerts. No internet required, ever.",
  },
];

const FAQS = [
  {
    q: "Is my financial data really private?",
    a: "Yes. FinDesk has no servers and no accounts. Your data is read, analyzed, and saved entirely on your device using local storage. Nothing is uploaded, and there is no telemetry.",
  },
  {
    q: "Do I need an internet connection?",
    a: "No. The AI model runs on your own computer through Ollama, so every feature works fully offline — on a plane, in a vault, anywhere.",
  },
  {
    q: "Which AI model does it use?",
    a: "A small, fast local model (the default is qwen2.5-coder:3b). You can pick any installed model under 3B parameters in Settings. The model only does language tasks — all the math is computed in code, so the numbers are always correct.",
  },
  {
    q: "Can I move my data between computers?",
    a: "Yes. Settings includes export and import — your entire workspace travels as a single JSON file you control.",
  },
  {
    q: "How much does FinDesk cost?",
    a: "FinDesk is a local app with no subscription and no cloud bill. You run it on your own hardware.",
  },
];

export default function Website({ onPreview }) {
  const { settings } = useSettings();

  return (
    <MotionConfig reducedMotion={settings.reduceMotion ? "always" : "never"}>
      <div className="mesh-bg min-h-screen w-full overflow-x-hidden text-slate-200">
        <div className="relative z-10">
          <Navbar onPreview={onPreview} />
          <Hero onPreview={onPreview} />
          <Stats />
          <Features />
          <HowItWorks />
          <Privacy />
          <About />
          <FAQSection />
          <Contact />
          <Footer onPreview={onPreview} />
        </div>
      </div>
    </MotionConfig>
  );
}

// Fade/slide reveal on scroll.
function Reveal({ children, className, delay = 0 }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

function Navbar({ onPreview }) {
  return (
    <header className="sticky top-0 z-50 px-4 pt-4">
      <div className="glass mx-auto max-w-6xl rounded-2xl px-4 sm:px-6 py-3 flex items-center justify-between">
        <a href="#top" className="flex items-center gap-2.5">
          <span className="icon-chip h-9 w-9">
            <Wallet size={18} strokeWidth={2.2} />
          </span>
          <span className="font-bold text-white tracking-tight">FinDesk</span>
        </a>
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="px-3 py-1.5 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/[0.07] transition-all"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <button
          onClick={onPreview}
          className="rounded-xl bg-[var(--accent)] text-slate-950 px-4 py-2 text-sm font-semibold hover:brightness-110 transition flex items-center gap-1.5"
        >
          Launch app
          <ArrowRight size={15} />
        </button>
      </div>
    </header>
  );
}

function Hero({ onPreview }) {
  return (
    <section id="top" className="px-6 pt-20 pb-16 max-w-5xl mx-auto text-center">
      <Reveal>
        <div className="glass-soft inline-flex items-center gap-2 text-xs text-[var(--accent)] rounded-full px-3.5 py-1.5 mb-7">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] shadow-[0_0_8px_2px_rgba(var(--accent-rgb),0.7)]" />
          100% local · offline-first personal finance
        </div>
        <h1 className="text-5xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.05]">
          Your money's command center —{" "}
          <span className="stat-value">entirely on your machine.</span>
        </h1>
        <p className="text-lg text-slate-400 mt-6 max-w-2xl mx-auto leading-relaxed">
          FinDesk is a private finance toolkit that reads, analyzes, and stores
          everything locally. A small AI model runs on your own computer —
          nothing is uploaded, tracked, or sold. Ever.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 mt-9">
          <button
            onClick={onPreview}
            className="rounded-xl bg-[var(--accent)] text-slate-950 px-6 py-3 text-sm font-semibold hover:brightness-110 transition flex items-center gap-2"
          >
            <Download size={17} />
            Launch FinDesk
          </button>
          <a
            href="#how"
            className="glass-soft rounded-xl px-6 py-3 text-sm font-medium text-slate-200 hover:text-white transition flex items-center gap-2"
          >
            See how it works
            <ArrowRight size={15} />
          </a>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-8 text-sm text-slate-500">
          {["No accounts", "No cloud", "No telemetry", "Yours by design"].map(
            (chip) => (
              <span key={chip} className="flex items-center gap-1.5">
                <Check size={14} className="text-[var(--accent)]" />
                {chip}
              </span>
            ),
          )}
        </div>
      </Reveal>

      {/* Faux dashboard preview */}
      <Reveal delay={0.15} className="mt-16">
        <div className="glass glass-sheen rounded-3xl p-4 sm:p-6 max-w-4xl mx-auto">
          <div className="grid grid-cols-3 gap-3">
            {FEATURES.map((f, i) => (
              <div key={f.title} className="glass-soft rounded-2xl p-4 text-left">
                <span className="icon-chip h-10 w-10 mb-3">
                  <f.icon size={20} />
                </span>
                <div className="stat-value text-2xl font-extrabold">
                  {["13", "$67", "60d", "4", "Live", "2"][i]}
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-tight">
                  {["write-offs", "per month", "outlook", "flagged", "scenarios", "goals"][i]}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function Stats() {
  const stats = [
    { icon: WifiOff, value: "0 bytes", label: "leave your device" },
    { icon: Cpu, value: "1 model", label: "running on-device" },
    { icon: Receipt, value: "6 tools", label: "in one app" },
    { icon: Lock, value: "100%", label: "private by design" },
  ];
  return (
    <section className="px-6 max-w-5xl mx-auto">
      <Reveal>
        <div className="glass rounded-2xl grid grid-cols-2 md:grid-cols-4 divide-x divide-white/10">
          {stats.map((s) => (
            <div key={s.label} className="p-6 text-center">
              <s.icon size={20} className="mx-auto mb-2 text-[var(--accent)]" />
              <div className="stat-value text-2xl font-extrabold">{s.value}</div>
              <p className="text-xs text-slate-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

function SectionHeading({ eyebrow, title, sub }) {
  return (
    <Reveal className="text-center max-w-2xl mx-auto mb-12">
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent)] font-semibold">
        {eyebrow}
      </p>
      <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-3">
        {title}
      </h2>
      {sub && <p className="text-slate-400 mt-4 leading-relaxed">{sub}</p>}
    </Reveal>
  );
}

function Features() {
  return (
    <section id="features" className="px-6 py-24 max-w-6xl mx-auto scroll-mt-24">
      <SectionHeading
        eyebrow="What's inside"
        title="Six finance tools. One private app."
        sub="Each tool follows the same principle: a local AI handles the language, while your computer does every calculation — so the numbers are always right."
      />
      <div className="grid md:grid-cols-2 gap-6">
        {FEATURES.map((f, i) => (
          <Reveal key={f.title} delay={(i % 2) * 0.1}>
            <div className="glass glass-card glass-sheen rounded-3xl p-6 h-full">
              <div className="relative z-10">
                <span className="icon-chip h-12 w-12 mb-4">
                  <f.icon size={24} />
                </span>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  {f.title}
                </h3>
                <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                  {f.blurb}
                </p>
                <ul className="mt-4 space-y-1.5">
                  {f.points.map((p) => (
                    <li
                      key={p}
                      className="flex items-center gap-2 text-sm text-slate-300"
                    >
                      <Check size={15} className="text-[var(--accent)] shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how" className="px-6 py-24 max-w-6xl mx-auto scroll-mt-24">
      <SectionHeading
        eyebrow="How it works"
        title="From install to insight in minutes"
      />
      <div className="grid md:grid-cols-3 gap-6">
        {STEPS.map((s, i) => (
          <Reveal key={s.n} delay={i * 0.1}>
            <div className="glass rounded-3xl p-6 h-full">
              <div className="stat-value text-4xl font-extrabold">{s.n}</div>
              <h3 className="text-lg font-bold text-white mt-3">{s.title}</h3>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                {s.body}
              </p>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal className="mt-8">
        <div className="glass glass-sheen rounded-3xl p-8 text-center">
          <h3 className="text-2xl font-bold text-white tracking-tight">
            Code does the math.{" "}
            <span className="stat-value">AI does the language.</span>
          </h3>
          <p className="text-slate-400 mt-3 max-w-2xl mx-auto leading-relaxed">
            Small AI models are great at reading messy descriptions but unreliable
            at arithmetic. So in FinDesk the model only categorizes and explains —
            every total, forecast, and statistic is computed in plain code. You get
            a smart assistant you can actually trust with your money.
          </p>
        </div>
      </Reveal>
    </section>
  );
}

function Privacy() {
  const points = [
    {
      icon: WifiOff,
      title: "Works fully offline",
      body: "The AI runs on your machine via Ollama. Disconnect from the internet and everything still works.",
    },
    {
      icon: Lock,
      title: "No servers, no accounts",
      body: "There's nowhere to sign up because there's no cloud. Your data is saved only in the app, on your device.",
    },
    {
      icon: ShieldCheck,
      title: "You're always in control",
      body: "Export your entire workspace to a file, move it between machines, or wipe everything in one click.",
    },
  ];
  return (
    <section id="privacy" className="px-6 py-24 max-w-6xl mx-auto scroll-mt-24">
      <SectionHeading
        eyebrow="Privacy"
        title="Privacy isn't a setting. It's the architecture."
        sub="Most finance apps ask you to upload your most sensitive data to their cloud. FinDesk is built so that's simply impossible."
      />
      <div className="grid md:grid-cols-3 gap-6">
        {points.map((p, i) => (
          <Reveal key={p.title} delay={i * 0.1}>
            <div className="glass glass-card rounded-3xl p-6 h-full">
              <div className="relative z-10">
                <span className="icon-chip h-12 w-12 mb-4">
                  <p.icon size={24} />
                </span>
                <h3 className="text-lg font-bold text-white">{p.title}</h3>
                <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                  {p.body}
                </p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function About() {
  return (
    <section id="about" className="px-6 py-24 max-w-5xl mx-auto scroll-mt-24">
      <SectionHeading eyebrow="About us" title="Why we built FinDesk" />
      <Reveal>
        <div className="glass glass-sheen rounded-3xl p-8 sm:p-10 space-y-5 text-slate-300 leading-relaxed">
          <p>
            Personal finance is the most sensitive data most of us have — and
            almost every tool that helps you understand it wants you to hand it to
            the cloud first. We thought that trade-off was backwards.
          </p>
          <p>
            FinDesk started from a simple question:{" "}
            <span className="text-white font-medium">
              what if a finance app never sent your data anywhere at all?
            </span>{" "}
            With small, capable AI models now running on ordinary laptops, we
            could finally build a genuinely private assistant — one that reads
            your statements, finds your deductions, tracks your subscriptions,
            forecasts your cash flow, flags unusual charges, simulates what-ifs,
            and hunts down savings, all without a single byte leaving your machine.
          </p>
          <p>
            Our principle is honesty by design. The AI handles language; your
            computer handles the math. Nothing is hidden behind a server you can't
            see. It's your money, your model, your machine.
          </p>
          <div className="grid sm:grid-cols-3 gap-4 pt-4">
            {[
              { k: "Local-first", v: "Always" },
              { k: "Data collected", v: "None" },
              { k: "Built for", v: "You" },
            ].map((x) => (
              <div key={x.k} className="glass-soft rounded-2xl p-4 text-center">
                <div className="stat-value text-xl font-extrabold">{x.v}</div>
                <p className="text-xs text-slate-400 mt-1">{x.k}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function FAQSection() {
  return (
    <section id="faq" className="px-6 py-24 max-w-3xl mx-auto scroll-mt-24">
      <SectionHeading eyebrow="FAQ" title="Questions, answered" />
      <div className="space-y-3">
        {FAQS.map((f, i) => (
          <Reveal key={f.q} delay={i * 0.05}>
            <FAQItem q={f.q} a={f.a} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="font-medium text-white">{q}</span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-slate-400 leading-relaxed">{a}</div>
      )}
    </div>
  );
}

function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  function submit(e) {
    e.preventDefault();
    const subject = encodeURIComponent(`FinDesk — message from ${form.name}`);
    const body = encodeURIComponent(`${form.message}\n\n— ${form.name} (${form.email})`);
    window.location.href = `mailto:hello@findesk.app?subject=${subject}&body=${body}`;
  }

  const field =
    "w-full rounded-xl bg-white/[0.04] border border-white/10 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]";

  return (
    <section id="contact" className="px-6 py-24 max-w-5xl mx-auto scroll-mt-24">
      <SectionHeading
        eyebrow="Contact us"
        title="Get in touch"
        sub="Questions, feedback, or just want to say hi? We'd love to hear from you."
      />
      <div className="grid md:grid-cols-5 gap-6">
        <Reveal className="md:col-span-2">
          <div className="glass rounded-3xl p-6 h-full space-y-5">
            <ContactLine icon={Mail} label="Email" value="hello@findesk.app" />
            <ContactLine icon={Code2} label="Source" value="github.com/FinDesk" />
            <ContactLine
              icon={ShieldCheck}
              label="Where we run"
              value="Only on your device"
            />
            <p className="text-xs text-slate-500 pt-2 leading-relaxed">
              FinDesk has no support servers harvesting your data. This form simply
              opens your own email client.
            </p>
          </div>
        </Reveal>

        <Reveal className="md:col-span-3" delay={0.1}>
          <form onSubmit={submit} className="glass glass-sheen rounded-3xl p-6 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <input
                required
                placeholder="Your name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={field}
              />
              <input
                required
                type="email"
                placeholder="Your email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={field}
              />
            </div>
            <textarea
              required
              rows={5}
              placeholder="Your message"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className={`${field} resize-none`}
            />
            <button
              type="submit"
              className="rounded-xl bg-[var(--accent)] text-slate-950 px-6 py-3 text-sm font-semibold hover:brightness-110 transition flex items-center gap-2"
            >
              Send message
              <ArrowRight size={16} />
            </button>
          </form>
        </Reveal>
      </div>
    </section>
  );
}

function ContactLine({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <span className="icon-chip h-10 w-10">
        <Icon size={18} />
      </span>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm text-slate-200">{value}</p>
      </div>
    </div>
  );
}

function Footer({ onPreview }) {
  return (
    <footer className="px-6 pb-10 pt-8 max-w-6xl mx-auto">
      <div className="glass rounded-3xl p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <span className="icon-chip h-9 w-9">
              <Wallet size={18} strokeWidth={2.2} />
            </span>
            <div>
              <p className="font-bold text-white">FinDesk</p>
              <p className="text-xs text-slate-500">Your data never leaves your machine.</p>
            </div>
          </div>
          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-400">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} className="hover:text-white transition">
                {l.label}
              </a>
            ))}
          </nav>
          <button
            onClick={onPreview}
            className="rounded-xl bg-[var(--accent)] text-slate-950 px-5 py-2.5 text-sm font-semibold hover:brightness-110 transition self-start md:self-auto"
          >
            Launch app
          </button>
        </div>
        <div className="border-t border-white/10 mt-7 pt-5 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <span>© {2026} FinDesk · 100% local · offline-first</span>
          <span>Built for the hackathon · runs offline</span>
        </div>
      </div>
    </footer>
  );
}
