import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { LoaderCircle } from "lucide-react";
import { I18nProvider } from "@/i18n/I18nContext";
import { restoreVisualPreferences } from "@/lib/visualPreferences";
import { AppLoadingScreen } from "@/components/AppLoadingScreen";
import { AppShell } from "@/components/AppShell";
import { SessionContextProvider, useAuth } from "@/contexts/AuthContext";
import AuthPage from "./pages/AuthPage";
import AuthCallback from "./pages/AuthCallback";
import ResetPassword from "./pages/ResetPassword";
import Onboarding from "./pages/Onboarding";
import PairChild from "./pages/PairChild";
import Index from "./pages/Index";
import SafeWalk from "./pages/SafeWalk";
import ScamCheck from "./pages/ScamCheck";
import Community from "./pages/Community";
import KidZone from "./pages/KidZone";
import JourneyDetail from "./pages/JourneyDetail";
import GuestView from "./pages/GuestView";
import ShareLocation from "./pages/ShareLocation";
import Emergency from "./pages/Emergency";
import SosMap from "./pages/SosMap";
import DisasterSafety from "./pages/DisasterSafety";
import IncidentReports from "./pages/IncidentReports";
import SafetyAlarm from "./pages/SafetyAlarm";
import EmergencyId from "./pages/EmergencyId";
import SafePlaces from "./pages/SafePlaces";
import Settings from "./pages/Settings";
import More from "./pages/More";
import AdminAnnouncements from "./pages/AdminAnnouncements";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function RequireAuth() {
  const { user, profile, loading, profileLoading } = useAuth();

  if (loading || profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/welcome" replace />;
  }

  if (profile?.account_type === "child" && !profile?.onboarding_completed) {
    return <Navigate to="/pair-child" replace />;
  }

  return <Outlet />;
}

const App = () => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    restoreVisualPreferences();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          {!ready && <AppLoadingScreen onComplete={() => setReady(true)} />}
          {ready && (
            <SessionContextProvider>
              <BrowserRouter>
                <Routes>
                  <Route path="/welcome" element={<Onboarding />} />
                  <Route path="/pair-child" element={<PairChild />} />
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/j/:token" element={<GuestView />} />
                  <Route path="/share/:token" element={<ShareLocation />} />

                  <Route element={<RequireAuth />}>
                    <Route element={<AppShell />}>
                      <Route path="/" element={<Index />} />
                      <Route path="/check-ins" element={<SafeWalk />} />
                      <Route path="/scam-check" element={<ScamCheck />} />
                      <Route path="/get-help" element={<Community />} />
                      <Route path="/start" element={<SafeWalk />} />
                      <Route path="/journey/:id" element={<JourneyDetail />} />
                      <Route path="/emergency" element={<Emergency />} />
                      <Route path="/sos-map" element={<SosMap />} />
                      <Route path="/contacts" element={<Community />} />
                      <Route path="/community" element={<Community />} />
                      <Route path="/safety-tips" element={<Community />} />
                      <Route path="/child-safety" element={<KidZone />} />
                      <Route path="/child-account" element={<KidZone />} />
                      <Route path="/guardian-children" element={<KidZone />} />
                      <Route path="/kids" element={<KidZone />} />
                      <Route path="/disaster-safety" element={<DisasterSafety />} />
                      <Route path="/incident-report" element={<IncidentReports />} />
                      <Route path="/safety-alarm" element={<SafetyAlarm />} />
                      <Route path="/emergency-id" element={<EmergencyId />} />
                      <Route path="/safe-places" element={<SafePlaces />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/more" element={<More />} />
                      <Route path="/admin/announcements" element={<AdminAnnouncements />} />
                    </Route>
                  </Route>

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </SessionContextProvider>
          )}
        </TooltipProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
};

export default App;
