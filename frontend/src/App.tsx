import { useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AssistantProvider } from "./contexts/AssistantContext";
import { FilterProvider } from "./contexts/FilterContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AppShell } from "./components/layout/AppShell";
import { Areas } from "./pages/Areas";
import { CrimeMap } from "./pages/CrimeMap";
import { Dashboard } from "./pages/Dashboard";
import { Help } from "./pages/Help";
import { Hotspots } from "./pages/Hotspots";
import { Landing } from "./pages/Landing";
import { NotFound } from "./pages/NotFound";
import { Reports } from "./pages/Reports";
import { Settings } from "./pages/Settings";
import { Trends } from "./pages/Trends";
import { Upload } from "./pages/Upload";

export function App() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <FilterProvider>
            <AssistantProvider>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route element={<AppShell />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/overview" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/map" element={<CrimeMap />} />
                  <Route path="/crime-map" element={<Navigate to="/map" replace />} />
                  <Route path="/hotspots" element={<Hotspots />} />
                  <Route path="/trends" element={<Trends />} />
                  <Route path="/areas" element={<Areas />} />
                  <Route path="/area-explorer" element={<Navigate to="/areas" replace />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/upload" element={<Upload />} />
                  <Route path="/data-upload" element={<Navigate to="/upload" replace />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/help" element={<Help />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </AssistantProvider>
          </FilterProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}
