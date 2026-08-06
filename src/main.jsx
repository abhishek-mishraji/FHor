import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AppProvider } from "./context/AppContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { PrintProvider } from "./components/report-print/PrintProvider.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AppProvider>
        <AuthProvider>
          <PrintProvider>
            <App />
          </PrintProvider>
        </AuthProvider>
      </AppProvider>
    </BrowserRouter>
  </StrictMode>,
);
