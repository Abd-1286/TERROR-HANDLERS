import { useState } from "react";
import { isElectron } from "./lib/platform";
import Landing from "./components/Landing";
import Sidebar from "./components/Sidebar";
import Home from "./features/Home";
import TaxDeductionFinder from "./features/TaxDeductionFinder";
import SubscriptionManager from "./features/SubscriptionManager";
import CashFlowForecaster from "./features/CashFlowForecaster";
import SpendingAnomalies from "./features/SpendingAnomalies";
import Settings from "./features/Settings";

export default function App() {
  // The full app runs in the desktop (Electron) build. In a plain browser we
  // show the marketing overview only. `preview` is a dev-only escape hatch.
  const [preview, setPreview] = useState(false);
  const [active, setActive] = useState("home");

  if (!isElectron() && !preview) {
    return <Landing onPreview={() => setPreview(true)} />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0b0f14] text-slate-200">
      <Sidebar active={active} onSelect={setActive} />
      <main className="flex-1 overflow-y-auto">
        {active === "home" && <Home onSelect={setActive} />}
        {active === "deductions" && <TaxDeductionFinder />}
        {active === "subscriptions" && <SubscriptionManager />}
        {active === "cashflow" && <CashFlowForecaster />}
        {active === "anomalies" && <SpendingAnomalies />}
        {active === "settings" && <Settings />}
      </main>
    </div>
  );
}
