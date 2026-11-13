const CONTACTS_KEY = "anou.contacts";

export interface TrustedContact {
  id: string;
  name: string;
  contact: string;
  relationship: string;
}

export function listContacts(): TrustedContact[] {
  try {
    const raw = localStorage.getItem(CONTACTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (c): c is TrustedContact =>
        c && typeof c.id === "string" && typeof c.name === "string" && typeof c.contact === "string",
    );
  } catch {
    return [];
  }
}

export function addContact(
  input: Omit<TrustedContact, "id">,
): TrustedContact[] {
  const contact: TrustedContact = {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name: input.name.trim(),
    contact: input.contact.trim(),
    relationship: input.relationship.trim(),
  };
  const next = [...listContacts(), contact];
  try {
    localStorage.setItem(CONTACTS_KEY, JSON.stringify(next));
  } catch {
    // ignore storage errors
  }
  return next;
}

export function deleteContact(id: string): TrustedContact[] {
  const next = listContacts().filter((c) => c.id !== id);
  try {
    localStorage.setItem(CONTACTS_KEY, JSON.stringify(next));
  } catch {
    // ignore storage errors
  }
  return next;
}
