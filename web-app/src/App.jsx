import { useState } from "react";
import { isElectron } from "./lib/platform";
import Website from "./components/Website";
import Console from "./features/Console";

export default function App() {
  // The full app runs in the desktop (Electron) build. In a plain browser we
  // show the marketing website. `preview` is the in-browser "launch" hook.
  const [preview, setPreview] = useState(false);

  if (!isElectron() && !preview) {
    return <Website onPreview={() => setPreview(true)} />;
  }

  return <Console />;
}
