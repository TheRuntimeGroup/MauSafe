const SECRET_KEY = "anou.ownerSecret";
const NAME_KEY = "anou.ownerName";
const CONTACT_KEY = "anou.ownerContact";

function randomSecret(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function getOwnerSecret(): string | null {
  try {
    return localStorage.getItem(SECRET_KEY);
  } catch {
    return null;
  }
}

/** A high-entropy, device-bound owner secret used to authorise changes. */
export function ensureOwnerSecret(): string {
  const existing = getOwnerSecret();
  if (existing) return existing;
  const secret = randomSecret();
  try {
    localStorage.setItem(SECRET_KEY, secret);
  } catch {
    // ignore storage errors; the secret still works for this session
  }
  return secret;
}

export function getOwnerName(): string {
  try {
    return localStorage.getItem(NAME_KEY) ?? "";
  } catch {
    return "";
  }
}

export function setOwnerName(name: string): void {
  try {
    localStorage.setItem(NAME_KEY, name);
  } catch {
    // ignore
  }
}

export function getOwnerContact(): string {
  try {
    return localStorage.getItem(CONTACT_KEY) ?? "";
  } catch {
    return "";
  }
}

export function setOwnerContact(contact: string): void {
  try {
    localStorage.setItem(CONTACT_KEY, contact);
  } catch {
    // ignore
  }
}
