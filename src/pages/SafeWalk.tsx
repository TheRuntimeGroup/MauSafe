import { Footprints, ListChecks, Plus } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { FeatureSections } from "@/components/FeatureSections";
import CheckIns from "@/pages/CheckIns";
import StartCheckIn from "@/pages/StartCheckIn";

export default function SafeWalk() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const view = pathname === "/start" ? "new" : "list";

  return (
    <div className="space-y-6">
      <FeatureSections
        sections={[
          { id: "list", labelKey: "safeWalk.list", icon: ListChecks },
          { id: "new", labelKey: "safeWalk.new", icon: Plus },
        ]}
        activeId={view}
        onSelect={(id) => navigate(id === "new" ? "/start" : "/check-ins")}
      />
      {view === "new" ? <StartCheckIn /> : <CheckIns />}
    </div>
  );
}
