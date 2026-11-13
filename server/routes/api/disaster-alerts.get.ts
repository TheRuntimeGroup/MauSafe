import { defineHandler } from "nitro";
import { createError } from "nitro/h3";

type DisasterAlert = {
  id: string;
  title: string;
  description: string;
  link: string;
  publishedAt: string | null;
  eventType: string;
  alertLevel: "GREEN" | "ORANGE" | "RED" | "UNKNOWN";
};

let cache: { expiresAt: number; alerts: DisasterAlert[] } | null = null;

function decodeXml(value: string): string {
  return value
    .replace(/^<!\[CDATA\[|\]\]>$/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function tag(block: string, name: string): string {
  const match = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`));
  return match ? decodeXml(match[1]) : "";
}

export default defineHandler(async () => {
  if (cache && cache.expiresAt > Date.now()) return { source: "GDACS", alerts: cache.alerts };

  try {
    const response = await fetch("https://www.gdacs.org/xml/rss.xml", {
      signal: AbortSignal.timeout(9000),
      headers: { Accept: "application/rss+xml, application/xml, text/xml" },
    });
    if (!response.ok) throw new Error("GDACS unavailable");
    const xml = await response.text();
    const alerts = Array.from(xml.matchAll(/<item>([\s\S]*?)<\/item>/g))
      .slice(0, 8)
      .map((match, index): DisasterAlert => {
        const block = match[1];
        const rawLink = tag(block, "link");
        const link = /^https:\/\/(?:www\.)?gdacs\.org\//.test(rawLink)
          ? rawLink
          : "https://www.gdacs.org/";
        const parsedDate = Date.parse(tag(block, "pubDate"));
        const level = tag(block, "gdacs:alertlevel").toUpperCase();
        return {
          id: tag(block, "guid") || link || `gdacs-${index}`,
          title: tag(block, "title").slice(0, 240) || "GDACS disaster alert",
          description: tag(block, "description").slice(0, 500),
          link,
          publishedAt: Number.isFinite(parsedDate) ? new Date(parsedDate).toISOString() : null,
          eventType: tag(block, "gdacs:eventtype").slice(0, 12) || "ALERT",
          alertLevel: ["GREEN", "ORANGE", "RED"].includes(level)
            ? (level as DisasterAlert["alertLevel"])
            : "UNKNOWN",
        };
      });

    cache = { expiresAt: Date.now() + 10 * 60_000, alerts };
    return { source: "GDACS", alerts };
  } catch {
    throw createError({ statusCode: 503, statusMessage: "disaster_alerts_unavailable" });
  }
});
