import { useEffect, useState } from "react";
import { Accessibility, ExternalLink, HeartHandshake, LoaderCircle, MapPin } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";

type Resource = {
  id: string;
  name: string;
  street: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  sourceUrl: string;
  wheelchairAccessible: boolean;
};

export function MobilityResources() {
  const { t } = useI18n();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/mobility-resources", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("unavailable");
        return response.json() as Promise<{ resources: Resource[] }>;
      })
      .then((data) => {
        setResources(Array.isArray(data.resources) ? data.resources : []);
      })
      .catch((error) => {
        if (error instanceof Error && error.name === "AbortError") return;
        setUnavailable(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  return (
    <section className="mt-4 rounded-2xl border border-[#DDE6ED] bg-[#F4F8FB] p-4" aria-labelledby="mobility-resources-title">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <HeartHandshake className="h-[18px] w-[18px]" aria-hidden="true" />
        </span>
        <div>
          <h2 id="mobility-resources-title" className="text-sm font-extrabold text-foreground">
            {t("mobility.title")}
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t("mobility.subtitle")}</p>
        </div>
      </div>

      {loading && (
        <p role="status" className="mt-4 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <LoaderCircle className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
          {t("mobility.loading")}
        </p>
      )}
      {unavailable && <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{t("mobility.unavailable")}</p>}
      {!loading && !unavailable && resources.length === 0 && (
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{t("mobility.empty")}</p>
      )}

      {!loading && !unavailable && resources.length > 0 && (
        <div className="mt-4 space-y-2.5">
          {resources.map((resource) => {
            const telephone = resource.phone?.replace(/[^\d+]/g, "");
            const address = [resource.street, resource.city].filter(Boolean).join(", ");
            return (
              <article key={resource.id} className="rounded-xl border border-foreground/[0.07] bg-white p-3">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-extrabold leading-snug text-foreground">{resource.name}</h3>
                  {resource.wheelchairAccessible && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-secondary px-2 py-1 text-[10px] font-bold text-primary">
                      <Accessibility className="h-3 w-3" aria-hidden="true" />
                      {t("mobility.wheelchair")}
                    </span>
                  )}
                </div>
                {address && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{address}</p>}
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1.5 text-xs font-semibold text-primary">
                  {telephone && <a href={`tel:${telephone}`} className="hover:underline">{resource.phone}</a>}
                  {resource.website && (
                    <a href={resource.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:underline">
                      {t("mobility.website")}
                      <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    </a>
                  )}
                  <a href={resource.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:underline">
                    <MapPin className="h-3 w-3" aria-hidden="true" />
                    {t("mobility.source")}
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
