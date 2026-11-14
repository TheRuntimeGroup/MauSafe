import { Baby, IdCard } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { FeatureSections } from "@/components/FeatureSections";
import ChildSafety from "@/pages/ChildSafety";
import EmergencyId from "@/pages/EmergencyId";

export default function KidZone() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const view = pathname === "/emergency-id" ? "id" : "child";

  return (
    <div className="space-y-6">
      <FeatureSections
        sections={[
          { id: "child", labelKey: "nav.child", icon: Baby },
          { id: "id", labelKey: "profile.title", icon: IdCard },
        ]}
        activeId={view}
        onSelect={(id) => navigate(id === "child" ? "/child-safety" : "/emergency-id")}
      />
      {view === "child" ? <ChildSafety /> : <EmergencyId />}
    </div>
  );
}
