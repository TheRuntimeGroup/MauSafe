import { useState } from "react";
import { IdCard, Siren } from "lucide-react";
import { FeatureSections } from "@/components/FeatureSections";
import Emergency from "@/pages/Emergency";
import EmergencyId from "@/pages/EmergencyId";

export default function SosMap() {
  const [view, setView] = useState<"sos" | "id">("sos");

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <FeatureSections
        sections={[
          { id: "sos", labelKey: "sosMap.sos", icon: Siren },
          { id: "id", labelKey: "profile.title", icon: IdCard },
        ]}
        activeId={view}
        onSelect={(id) => setView(id as "sos" | "id")}
      />

      {view === "sos" ? <Emergency /> : <EmergencyId />}
    </div>
  );
}
