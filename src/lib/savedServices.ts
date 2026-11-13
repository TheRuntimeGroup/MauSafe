const STORAGE_KEY = "mausafe.savedServices";

export function getSavedServiceIds(): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function setSavedServiceIds(ids: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(new Set(ids))));
}
