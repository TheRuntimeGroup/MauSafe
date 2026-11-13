export type ReportTag = "scam" | "spam" | "harassment" | "other";
export type NumberType = "mobile" | "landline" | "other";
export type CarrierLineType =
  | "mobile"
  | "landline"
  | "voip"
  | "toll_free"
  | "premium_rate"
  | "special_services"
  | "other";

export interface LiveCarrierLookup {
  carrier: string | null;
  lineType: CarrierLineType | null;
  location: string | null;
  countryName: string | null;
  internationalFormat: string | null;
}

export type RiskLevel = "low" | "medium" | "high";
export interface RiskAssessment {
  level: RiskLevel;
  labelKey: string;
  hintKey: string;
}

export interface NumberReport {
  id: string;
  number: string;
  tags: ReportTag[];
  note: string;
  createdAt: number;
}

export interface NumberAnalysis {
  input: string;
  normalized: string | null;
  valid: boolean;
  country: "Mauritius" | null;
  type: NumberType | null;
  operator: string | null;
  reasonKey: string | null;
  report: NumberReport | null;
}

const REPORTS_KEY = "anou.numberReports";

const OPERATOR_RANGES: { from: number; to: number; name: string }[] = [
  { from: 525, to: 529, name: "Emtel" },
  { from: 542, to: 543, name: "MTML (Chili)" },
  { from: 571, to: 579, name: "Mauritius Telecom (my.t)" },
  { from: 581, to: 589, name: "Mauritius Telecom (my.t)" },
  { from: 591, to: 599, name: "Mauritius Telecom (my.t)" },
];

/** Strip formatting, normalise `00`/`+`/trunk `0`, and keep only digits (plus a leading `+`). */
function normaliseInput(input: string): string {
  let s = input.trim().replace(/[\s()\-.]/g, "");
  if (/^00\d/.test(s)) s = "+" + s.slice(2);
  s = s.replace(/[^\d+]/g, "");
  if (s.includes("+", 1)) s = s.replace(/\+/g, "");
  return s;
}

function detectType(digits: string): NumberType {
  if (digits[0] === "5") return "mobile";
  if (["2", "4", "6", "8"].includes(digits[0])) return "landline";
  return "other";
}

function detectOperator(digits: string): string | null {
  if (digits[0] !== "5") return null;
  const prefix = Number(digits.slice(0, 3));
  const match = OPERATOR_RANGES.find((r) => prefix >= r.from && prefix <= r.to);
  return match ? match.name : null;
}

export function normalizePhone(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  const cleaned = normaliseInput(raw);
  if (!cleaned) return null;

  let digits: string;
  if (cleaned.startsWith("+230")) digits = cleaned.slice(4);
  else if (cleaned.startsWith("230")) digits = cleaned.slice(3);
  else if (cleaned.startsWith("+")) return null; // non-Mauritian number
  else if (cleaned.startsWith("0") && cleaned.length > 1) digits = cleaned.slice(1);
  else digits = cleaned;

  if (!/^\d{8}$/.test(digits)) return null;
  return "+230" + digits;
}

export function formatMauritiusNumber(normalized: string): string {
  if (!normalized.startsWith("+230") || normalized.length !== 12) return normalized;
  const digits = normalized.slice(4);
  return `+230 ${digits.slice(0, 4)} ${digits.slice(4)}`;
}

export function analyzeNumber(input: string): NumberAnalysis {
  const base: NumberAnalysis = {
    input,
    normalized: null,
    valid: false,
    country: null,
    type: null,
    operator: null,
    reasonKey: null,
    report: null,
  };

  if (!input.trim()) {
    return { ...base, reasonKey: "callcheck.reason.invalidEmpty" };
  }

  const raw = normaliseInput(input);

  if (raw.startsWith("+") && !raw.startsWith("+230") && !raw.startsWith("230")) {
    return { ...base, normalized: raw, reasonKey: "callcheck.reason.invalidCountry" };
  }

  const normalized = normalizePhone(input);
  if (!normalized) {
    return { ...base, reasonKey: "callcheck.reason.invalidLength" };
  }

  const digits = normalized.slice(4);
  return {
    input,
    normalized,
    valid: true,
    country: "Mauritius",
    type: detectType(digits),
    operator: detectOperator(digits),
    reasonKey: null,
    report: findReport(normalized),
  };
}

export function listReports(): NumberReport[] {
  try {
    const raw = localStorage.getItem(REPORTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (r): r is NumberReport =>
        r &&
        typeof r.id === "string" &&
        typeof r.number === "string" &&
        Array.isArray(r.tags) &&
        typeof r.createdAt === "number",
    );
  } catch {
    return [];
  }
}

export function findReport(normalized: string): NumberReport | null {
  return listReports().find((r) => r.number === normalized) ?? null;
}

export function assessScamRisk(
  report: NumberReport | null,
  lineType: CarrierLineType | null,
): RiskAssessment {
  if (report?.tags.some((tag) => tag === "scam" || tag === "harassment")) {
    return {
      level: "high",
      labelKey: "callcheck.risk.high",
      hintKey: "callcheck.risk.reportedHint",
    };
  }
  if (report) {
    return {
      level: "medium",
      labelKey: "callcheck.risk.medium",
      hintKey: "callcheck.risk.reportedHint",
    };
  }
  if (lineType === "voip" || lineType === "premium_rate") {
    return {
      level: "medium",
      labelKey: "callcheck.risk.medium",
      hintKey: "callcheck.risk.voipHint",
    };
  }
  return {
    level: "low",
    labelKey: "callcheck.risk.low",
    hintKey: "callcheck.risk.lowHint",
  };
}

export function normalizeLineType(value: string | null | undefined): CarrierLineType | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase().replace(/[ -]/g, "_");
  if (normalized === "mobile") return "mobile";
  if (normalized === "landline" || normalized === "fixed_line") return "landline";
  if (normalized === "voip") return "voip";
  if (normalized === "toll_free") return "toll_free";
  if (normalized === "premium_rate") return "premium_rate";
  if (normalized === "special_services") return "special_services";
  return "other";
}

export function reportNumber(input: {
  number: string;
  tags: ReportTag[];
  note: string;
}): NumberReport[] {
  const existing = listReports().find((r) => r.number === input.number);
  const report: NumberReport = existing
    ? {
        ...existing,
        tags: Array.from(new Set([...existing.tags, ...input.tags])),
        note: input.note.trim() || existing.note,
        createdAt: existing.createdAt,
      }
    : {
        id:
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        number: input.number,
        tags: input.tags,
        note: input.note.trim(),
        createdAt: Date.now(),
      };

  const next = [
    report,
    ...listReports().filter((r) => r.number !== input.number),
  ];
  try {
    localStorage.setItem(REPORTS_KEY, JSON.stringify(next));
  } catch {
    // ignore storage errors
  }
  return next;
}

export function deleteReport(id: string): NumberReport[] {
  const next = listReports().filter((r) => r.id !== id);
  try {
    localStorage.setItem(REPORTS_KEY, JSON.stringify(next));
  } catch {
    // ignore storage errors
  }
  return next;
}
