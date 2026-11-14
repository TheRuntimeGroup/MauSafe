import { useEffect } from "react";
import { Baby, Gamepad2, Plus, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import { FeatureSections } from "@/components/FeatureSections";
import ChildSafety from "@/pages/ChildSafety";
import KidsDashboard from "@/pages/KidsDashboard";
import { GuardianChildren } from "@/components/GuardianChildren";
import { ChildAccountSetup } from "@/components/ChildAccountSetup";

export default function KidZone() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const childMode = profile?.account_type === "child";
  const view = pathname === "/child-account" ? "create" : pathname === "/kids" ? "play" : "child";

  useEffect(() => {
    if (childMode && pathname !== "/kids") navigate("/kids", { replace: true });
  }, [childMode, pathname, navigate]);

  if (childMode) {
    return <KidsDashboard />;
  }

  return (
    <div className="space-y-6">
      <FeatureSections
        sections={childMode
          ? [
              { id: "child", labelKey: "nav.child", icon: Baby },
              { id: "play", labelKey: "kids.mode", icon: Gamepad2 },
            ]
          : [
              { id: "child", labelKey: "guardian.childrenTitle", icon: Search },
              { id: "create", labelKey: "child.createTitle", icon: Plus },
              { id: "play", labelKey: "kids.mode", icon: Gamepad2 },
            ]}
        activeId={view}
        onSelect={(id) => navigate(id === "create" ? "/child-account" : id === "play" ? "/kids" : "/guardian-children")}
      />
      {view === "create" ? <ChildAccountSetup /> : view === "child" ? <GuardianChildren /> : <KidsDashboard />}
    </div>
  );
}
