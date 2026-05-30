import ReactDOM from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./index.css";

window.addEventListener("error", (e) => {
  console.error("[window.error]", e.error ?? e.message);
});
window.addEventListener("unhandledrejection", (e) => {
  console.error("[unhandledrejection]", e.reason);
});

// Prevent the webview from "downloading" or navigating when a file is dropped
// outside of one of our specific drop targets. Our app-level drop handlers
// still receive the drop event because we attach them to specific elements.
window.addEventListener(
  "dragover",
  (e) => {
    if (e.dataTransfer && Array.from(e.dataTransfer.types).includes("Files")) {
      e.preventDefault();
    }
  },
  { capture: false },
);
window.addEventListener(
  "drop",
  (e) => {
    if (e.dataTransfer && Array.from(e.dataTransfer.types).includes("Files")) {
      // If the drop already had a target handler that called preventDefault,
      // this is a no-op. Otherwise we stop the default download/navigation.
      if (!e.defaultPrevented) {
        e.preventDefault();
      }
    }
  },
  { capture: false },
);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
