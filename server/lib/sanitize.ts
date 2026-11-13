export function sanitizeText(input: string, maxLength = 2000): string {
  return input
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[email hidden]")
    .replace(/https?:\/\/\S+/gi, "[link hidden]")
    .replace(/\b\d[\d\s().-]{8,}\d\b/g, "[number hidden]")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, maxLength);
}
