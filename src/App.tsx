import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { I18nProvider } from "@/i18n/I18nContext";
import { AppShell } from "@/components/AppShell";
import Index from "./pages/Index";
import CheckIns from "./pages/CheckIns";
import ScamCheck from "./pages/ScamCheck";
import GetHelp from "./pages/GetHelp";
import StartCheckIn from "./pages/StartCheckIn";
import JourneyDetail from "./pages/JourneyDetail";
import GuestView from "./pages/GuestView";
import Emergency from "./pages/Emergency";
import Contacts from "./pages/Contacts";
import SafetyTips from "./pages/SafetyTips";
import CallChecker from "./pages/CallChecker";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <I18nProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<AppShell />}>
              <Route path="/" element={<Index />} />
              <Route path="/check-ins" element={<CheckIns />} />
              <Route path="/scam-check" element={<ScamCheck />} />
              <Route path="/get-help" element={<GetHelp />} />
              <Route path="/start" element={<StartCheckIn />} />
              <Route path="/journey/:id" element={<JourneyDetail />} />
              <Route path="/emergency" element={<Emergency />} />
              <Route path="/contacts" element={<Contacts />} />
              <Route path="/safety-tips" element={<SafetyTips />} />
              <Route path="/call-checker" element={<CallChecker />} />
            </Route>
            <Route path="/j/:token" element={<GuestView />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </I18nProvider>
  </QueryClientProvider>
);

export default App;
