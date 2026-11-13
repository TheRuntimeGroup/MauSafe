export type IncidentCategory = "theft" | "assault" | "harassment" | "fraud" | "road_hazard" | "other";

export interface IncidentReport {
  id: string;
  reference: string;
  category: IncidentCategory;
  occurredAt: string;
  area: string;
  description: string;
  createdAt: number;
  exportedCount: number;
}

const STORAGE_KEY = "mausafe.incidentReports";

export function listIncidentReports(): IncidentReport[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is IncidentReport =>
        item &&
        typeof item.id === "string" &&
        typeof item.reference === "string" &&
        typeof item.category === "string" &&
        typeof item.occurredAt === "string" &&
        typeof item.area === "string" &&
        typeof item.description === "string" &&
        typeof item.createdAt === "number",
    );
  } catch {
    return [];
  }
}

function persist(reports: IncidentReport[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
}

export function createIncidentReport(input: {
  category: IncidentCategory;
  occurredAt: string;
  area: string;
  description: string;
}): IncidentReport[] {
  const id = crypto.randomUUID();
  const report: IncidentReport = {
    id,
    reference: `LOCAL-${Date.now().toString(36).toUpperCase()}`,
    category: input.category,
    occurredAt: input.occurredAt,
    area: input.area.trim(),
    description: input.description.trim(),
    createdAt: Date.now(),
    exportedCount: 0,
  };
  const next = [report, ...listIncidentReports()].slice(0, 100);
  persist(next);
  return next;
}

export function markIncidentExported(id: string): IncidentReport[] {
  const next = listIncidentReports().map((report) =>
    report.id === id ? { ...report, exportedCount: report.exportedCount + 1 } : report,
  );
  persist(next);
  return next;
}

export function deleteIncidentReport(id: string): IncidentReport[] {
  const next = listIncidentReports().filter((report) => report.id !== id);
  persist(next);
  return next;
}
