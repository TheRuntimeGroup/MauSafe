import { BookOpen, HeartHandshake, LifeBuoy } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { FeatureSections } from "@/components/FeatureSections";
import Contacts from "@/pages/Contacts";
import GetHelp from "@/pages/GetHelp";
import SafetyTips from "@/pages/SafetyTips";

export default function Community() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const view = pathname === "/get-help" ? "help" : pathname === "/safety-tips" ? "tips" : "contacts";

  return (
    <div className="space-y-6">
      <FeatureSections
        sections={[
          { id: "contacts", labelKey: "nav.contacts", icon: HeartHandshake },
          { id: "help", labelKey: "nav.gethelp", icon: LifeBuoy },
          { id: "tips", labelKey: "nav.tips", icon: BookOpen },
        ]}
        activeId={view}
        onSelect={(id) => navigate(id === "contacts" ? "/contacts" : id === "help" ? "/get-help" : "/safety-tips")}
      />
      {view === "contacts" ? <Contacts /> : view === "help" ? <GetHelp /> : <SafetyTips />}
    </div>
  );
}
