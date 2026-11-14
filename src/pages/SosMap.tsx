import { useState } from "react";
import { IdCard, MapPinned, Siren } from "lucide-react";
import { FeatureSections } from "@/components/FeatureSections";
import Emergency from "@/pages/Emergency";
import SafePlaces from "@/pages/SafePlaces";
import EmergencyId from "@/pages/EmergencyId";

export default function SosMap() {
  const [view, setView] = useState<"sos" | "map" | "id">("sos");

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <FeatureSections
        sections={[
          { id: "sos", labelKey: "sosMap.sos", icon: Siren },
          { id: "map", labelKey: "places.title", icon: MapPinned },
          { id: "id", labelKey: "profile.title", icon: IdCard },
        ]}
        activeId={view}
        onSelect={(id) => setView(id as "sos" | "map" | "id")}
      />

      {view === "sos" ? <Emergency /> : view === "map" ? <SafePlaces /> : <EmergencyId />}
    </div>
  );
}
