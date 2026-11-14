import { Baby, Gamepad2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { FeatureSections } from "@/components/FeatureSections";
import ChildSafety from "@/pages/ChildSafety";
import KidsDashboard from "@/pages/KidsDashboard";

export default function KidZone() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const view = pathname === "/kids" ? "play" : "child";

  return (
    <div className="space-y-6">
      <FeatureSections
        sections={[
          { id: "child", labelKey: "nav.child", icon: Baby },
          { id: "play", labelKey: "kids.mode", icon: Gamepad2 },
        ]}
        activeId={view}
        onSelect={(id) => navigate(id === "child" ? "/child-safety" : "/kids")}
      />
      {view === "child" ? <ChildSafety /> : <KidsDashboard />}
    </div>
  );
}
