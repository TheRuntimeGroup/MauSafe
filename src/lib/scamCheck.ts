export type ScamRuleId =
  | "urgency"
  | "otp"
  | "payment"
  | "link"
  | "phishing"
  | "impersonation"
  | "investment"
  | "download";

export interface ScamFinding {
  ruleId: ScamRuleId;
  matches: string[];
}

export interface ScamResult {
  label: "warning" | "clean";
  risk: "low" | "medium" | "high";
  score: number;
  findings: ScamFinding[];
  matchedTerms: string[];
  links: string[];
}

const URL_RE = /\bhttps?:\/\/[^\s)>\]}]+/gi;
const SHORTENER_RE =
  /\b(?:bit\.ly|tinyurl\.com|t\.co|goo\.gl|is\.gd|cutt\.ly|ow\.ly|rb\.gy|shorturl\.at|rebrand\.ly|tiny\.one|cutt\.us)\/[^\s)>\]}]+/gi;
const SUSPICIOUS_URL_RE =
  /\bhttps?:\/\/(?:(?:\d{1,3}\.){3}\d{1,3}|[^\s/?#]*@|xn--)[^\s)>\]}]*/gi;

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
      SUSPICIOUS_URL_RE,
      /\bclick( here)?\b/gi,
      /\bcliquez?( ici)?\b/gi,
      /\bklik( la)?\b/gi,
    ],
  },
  {
    id: "phishing",
    patterns: [
      /\b(dear (customer|user|client|member)|verify (your )?(identity|account)|your account (has been|is)|unusual (activity|sign[- ]?in)|confirm (your )?details|update (your )?information|account (is )?on hold|suspended account|security (check|alert) required)\b/gi,
      /\b(cher client|ch[èe]re? client|v[ée]rifiez (votre )?(identit[ée]|compte)|votre compte (a [ée]t[ée]|est)|activit[ée] (inhabituelle|suspecte)|confirmez (vos )?donn[ée]es|mettez [àa] jour (vos )?informations|compte suspendu)\b/gi,
      /\b(cher kliyan|verifie (ou )?(identite|kont)|ou kont finn|aktivite sisp[èe]k|konfirm (ou )?detay|met a zour ou informasion|kont suspan)\b/gi,
    ],
  },
  {
    id: "impersonation",
    patterns: [
      /\b(police|government|ministry|revenue authority|MRA|central bank|bank of mauritius|customs|post office|immigration|military|judiciary|official (notice|letter)|tax (refund|office|department))\b/gi,
      /\b(police|gouvernement|minist[èe]re|autorit[ée] fiscale|MRA|banque centrale|banque de maurice|douane|poste|immigration|militaire|avis officiel|remboursement d'imp[ôo]t)\b/gi,
      /\b(lapolis|gouvernman|minister|MRA|labank|douane|lapos|imigrasion|larm|avis ofisiel)\b/gi,
    ],
  },
  {
    id: "investment",
    patterns: [
      /\b(bitcoin|crypto(currency)?|investment|invest|forex|trading|guaranteed (returns|profit)|double your money|earn (money|cash) (fast|online)|passive income|financial freedom|get rich)\b/gi,
      /\b(bitcoin|crypto(monnaie)?|investissement|investir|forex|trading|rendements garantis|doublez votre argent|gagner de l'argent|revenu passif|libert[ée] financi[èe]re)\b/gi,
      /\b(bitcoin|crypto|lenvestisman|investi|forex|trading|profit garanti|doub ou larzan|gagn larzan|revenu pasif)\b/gi,
    ],
  },
  {
    id: "download",
    patterns: [
      /\b(install (this |the )?app|download (the |this )?(app|file|attachment|apk)|open (the )?attachment|enable unknown sources|scan this qr|apk file|click to install)\b/gi,
      /\b(installez (cette |l')?app|t[ée]l[ée]chargez (l'|cette )?(app|fichier|pi[èe]ce jointe|apk)|ouvrez la pi[èe]ce jointe|activez les sources inconnues|scannez ce qr|fichier apk)\b/gi,
      /\b(instal (sa )?app|telecharg (sa )?(app|fichie|apk)|ouver pi[èe]s zwenn|aktiv sours inkoni|scan sa qr|fichie apk)\b/gi,
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

  const weights: Record<ScamRuleId, number> = {
    urgency: 18,
    otp: 32,
    payment: 22,
    link: 12,
    phishing: 24,
    impersonation: 20,
    investment: 18,
    download: 16,
  };
  const baseScore = findings.reduce((total, finding) => total + weights[finding.ruleId], 0);
  SUSPICIOUS_URL_RE.lastIndex = 0;
  const suspiciousBonus = SUSPICIOUS_URL_RE.test(text) ? 20 : 0;
  const score = findings.length === 0
    ? 0
    : Math.min(100, baseScore + suspiciousBonus + Math.min(10, matched.size * 2));

  return {
    label: findings.length > 0 ? "warning" : "clean",
    risk: score >= 60 ? "high" : score >= 25 ? "medium" : "low",
    score,
    findings,
    matchedTerms: Array.from(matched).sort((a, b) => b.length - a.length),
    links: Array.from(links),
  };
}
