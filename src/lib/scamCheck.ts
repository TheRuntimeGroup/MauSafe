export type ScamRuleId = "urgency" | "otp" | "payment" | "link";

export interface ScamFinding {
  ruleId: ScamRuleId;
  matches: string[];
}

export interface ScamResult {
  label: "warning" | "clean";
  findings: ScamFinding[];
  matchedTerms: string[];
  links: string[];
}

const URL_RE = /\bhttps?:\/\/[^\s)>\]}]+/gi;
const SHORTENER_RE =
  /\b(?:bit\.ly|tinyurl\.com|t\.co|goo\.gl|is\.gd|cutt\.ly|ow\.ly|rb\.gy|shorturl\.at|rebrand\.ly)\/[^\s)>\]}]+/gi;

const RULES: { id: ScamRuleId; patterns: RegExp[] }[] = [
  {
    id: "urgency",
    patterns: [
      /\b(urgent|urgently|immediately|right now|asap|last chance|final notice|within 24 hours|act now|expires? today|hurry|suspend(ed)?|block(ed)?|clos(ed|ing)|final warning)\b/gi,
      /\b(urgent|imm[ée]diatement|tout de suite|derni[èe]re chance|dernier avis|sous 24 heures|votre compte|suspendu|bloqu[ée]|ferm[ée]|expire|d[ée]p[êe]chez)\b/gi,
      /\b(depes|touswit|toutswit|im[ée]diat|vite|derni[ée]|blok[ée]|suspan|ferm[ée]|expir[ée])\b/gi,
    ],
  },
  {
    id: "otp",
    patterns: [
      /\b(one[- ]?time (code|password|pin)|otp|verification code|security code|confirmation code|enter (the )?code|send( me)? (the )?code|share (the )?code|code (has been )?sent)\b/gi,
      /\b(code ([àa] usage unique|de v[ée]rification|secret|de confirmation)|partage[rz] le code|envoyez (le )?code|code re[çc]u)\b/gi,
      /\b(kod|k[òo]d|nim[ée]ro s[ée]kr[ée]|kod verifikasion|kod konfirmasion)\b/gi,
    ],
  },
  {
    id: "payment",
    patterns: [
      /\b(payment|pay|transfer|refund|fee|prize|winner|won|lottery|bank details|account details|customs fee|delivery fee|outstanding|invoice|credit card|balance|redeem)\b/gi,
      /\b(paiement|payer|virement|remboursement|frais|prix|gagnant|lot[ée]rie|coordonn[ée]es bancaires|frais de douane|facture|carte bancaire|solde)\b/gi,
      /\b(peye|pay[ée]|larzan|transak[s]?ion|pri|gagnan|lotri|kart|faktir)\b/gi,
    ],
  },
  {
    id: "link",
    patterns: [
      URL_RE,
      SHORTENER_RE,
      /\bclick( here)?\b/gi,
      /\bcliquez?( ici)?\b/gi,
      /\bklik( la)?\b/gi,
    ],
  },
];

function cleanUrl(url: string): string {
  return url.replace(/[.,;:!?]+$/, "");
}

export function analyzeScam(text: string): ScamResult {
  const findings: ScamFinding[] = [];
  const matched = new Set<string>();
  const links = new Set<string>();

  const urlMatches = text.match(URL_RE) ?? [];
  for (const url of urlMatches) links.add(cleanUrl(url));

  for (const rule of RULES) {
    const ruleMatches = new Set<string>();
    for (const pattern of rule.patterns) {
      pattern.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(text)) !== null) {
        const term = match[0].trim();
        ruleMatches.add(term);
        matched.add(term.toLowerCase());
        if (pattern === URL_RE || pattern === SHORTENER_RE) {
          links.add(cleanUrl(term));
        }
        if (pattern.lastIndex === match.index) pattern.lastIndex += 1;
      }
    }
    if (ruleMatches.size > 0) {
      findings.push({ ruleId: rule.id, matches: Array.from(ruleMatches) });
    }
  }

  return {
    label: findings.length > 0 ? "warning" : "clean",
    findings,
    matchedTerms: Array.from(matched).sort((a, b) => b.length - a.length),
    links: Array.from(links),
  };
}
