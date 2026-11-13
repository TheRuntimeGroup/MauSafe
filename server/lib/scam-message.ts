import type { MessageFinding } from "../../src/lib/scamCheck";

interface MessageRule {
  id: string;
  title: string;
  explanation: string;
  severity: "warning" | "critical";
  weight: number;
  patterns: RegExp[];
}

const RULES: MessageRule[] = [
  {
    id: "secret_request",
    title: "Asks for a login or security code",
    explanation:
      "Banks and genuine services will not ask you to send them your password, PIN, CVV or one-time code.",
    severity: "critical",
    weight: 42,
    patterns: [
      /\b(?:share|send|give|provide|forward|enter|confirm|reply with|verify with)\b.{0,55}\b(?:otp|one[- ]?time (?:code|password|pin)|verification code|security code|password|passcode|pin|cvv)\b/gi,
      /\b(?:otp|verification code|security code|password|pin|cvv)\b.{0,40}\b(?:to me|to us|here|to confirm|to verify|pour confirmer)\b/gi,
      /\b(?:partage[rz]?|envoy[ez]+|donne[rz]?|fournisse[rz]?|saisisse[rz]?|confirme[rz]?)\b.{0,55}\b(?:code|mot de passe|code pin|cvv)\b/gi,
      /\b(?:avoy|donn|partaz|ant besoin|confirm)\b.{0,45}\b(?:kod|motdepas|modpas|pin|cvv)\b/gi,
    ],
  },
  {
    id: "payment_request",
    title: "Pressure to send money or financial details",
    explanation:
      "Unexpected transfers, gift cards, crypto payments and card details are common ways scammers collect money.",
    severity: "critical",
    weight: 28,
    patterns: [
      /\b(?:bank transfer|wire transfer|transfer (?:the )?(?:money|funds)|send (?:the )?(?:money|payment)|pay (?:the )?(?:fee|fine|invoice)|gift cards?|itunes cards?|steam cards?|cryptocurrency|bitcoin|usdt|card (?:number|details)|banking details|bank account details)\b/gi,
      /\b(?:virement bancaire|transfert d'argent|envoyez l'argent|cartes? cadeaux?|cryptomonnaie|coordonn[ée]es bancaires|num[ée]ro de carte)\b/gi,
      /\b(?:avoy larzan|fer transfe|pey amann|kat kado|detay bank|nimero kat)\b/gi,
    ],
  },
  {
    id: "urgency",
    title: "Creates unusual urgency",
    explanation:
      "Short deadlines are used to stop you from pausing, checking with someone else or contacting the organisation directly.",
    severity: "warning",
    weight: 18,
    patterns: [
      /\b(?:immediately|right now|within (?:\d+|one) (?:minutes?|hours?|days?)|in (?:\d+|one) (?:minutes?|hours?)|last chance|final notice|act now|expires? today|urgent action|do it now|asap)\b/gi,
      /\b(?:imm[ée]diatement|tout de suite|dans (?:\d+|une) (?:minutes?|heures?|jours?)|derni[èe]re chance|dernier avis|agissez maintenant|expire aujourd'hui|action urgente)\b/gi,
      /\b(?:touswit|toutswit|immediat|aster mem|dernye sans|dernye avi|azi vite|expir zordi)\b/gi,
    ],
  },
  {
    id: "threat",
    title: "Threatens account closure or penalties",
    explanation:
      "Scare tactics about suspension, arrest, fines or lost deliveries often accompany demands for money or details.",
    severity: "warning",
    weight: 20,
    patterns: [
      /\b(?:account (?:will be |has been |is )?(?:suspend(?:ed)?|block(?:ed)?|clos(?:ed|ing)|deactivat(?:ed|ed))|permanent(?:ly)? (?:suspend|block|clos)|legal action|arrest warrant|you will be arrested| customs (?:fine|penalty)|parcel (?:will be returned|cannot be delivered)|avoid (?:a )?(?:fine|penalty|arrest))\b/gi,
      /\b(?:compte (?:sera |est )?(?:suspendu|bloqu[ée]|ferm[ée])|poursuites judiciaires|mandat d'arr[êe]t|amende de douane|colis (?:sera retourn[ée]|ne peut pas [êe]tre livr[ée]))\b/gi,
      /\b(?:kont pou (?:blok|ferm|suspan)|kont inn blok|aksion legal|pou aret ou|amann|parsel pou retournen)\b/gi,
    ],
  },
  {
    id: "too_good",
    title: "Promises an unexpected reward",
    explanation:
      "A prize, refund, inheritance or guaranteed return you did not expect is a frequent opening for advance-fee fraud.",
    severity: "warning",
    weight: 24,
    patterns: [
      /\b(?:you(?:'ve| have) won|winner of|congratulations.{0,35}(?:won|winner|prize)|claim your (?:prize|reward|refund)|lottery (?:prize|winner)|inheritance|guaranteed (?:profit|returns?)|risk[- ]free investment|double your money)\b/gi,
      /\b(?:vous avez gagn[ée]|gagnant d|f[ée]licitations.{0,35}(?:gagn[ée]|prix)|r[ée]clamez votre (?:prix|r[ée]compense|remboursement)|h[ée]ritage|rendement garanti)\b/gi,
      /\b(?:ou inn gagn|felisitasion.{0,35}(?:gagn|pri)|ramas ou pri|leritaz|prof garanti)\b/gi,
    ],
  },
  {
    id: "secrecy",
    title: "Tells you to keep it secret",
    explanation:
      "Isolating you from family, colleagues or your bank makes independent verification harder.",
    severity: "critical",
    weight: 25,
    patterns: [
      /\b(?:keep (?:this|it) (?:a )?secret|do not tell (?:anyone|anybody|your bank)|don't tell (?:anyone|anybody|your bank)|keep this confidential|between you and me)\b/gi,
      /\b(?:gardez (?:ceci|cela) secret|n'en parlez [àa] personne|ne dites [àa] personne|reste entre nous)\b/gi,
      /\b(?:pa dir personne|pa koze ar personne|gard sa secret|res ant nou de)\b/gi,
    ],
  },
  {
    id: "authority_claim",
    title: "Claims to represent an organisation",
    explanation:
      "A name or logo in a pasted message is not proof of identity. Verify through a separately sourced official channel.",
    severity: "warning",
    weight: 8,
    patterns: [
      /\b(?:mcb|juicebypro|juice by pro|absa|mauritius post|mauritius revenue authority|\bmra\b|\bceb\b|police (?:department|service)|customs (?:department|service)|paypal|netflix|whatsapp|microsoft support|apple support)\b/gi,
      /\b(?:service client|service douane|autorit[ée] fiscale|police de maurice)\b/gi,
    ],
  },
];

const URL_PATTERN = /\b(?:(?:https?:\/\/|www\.)[^\s<>"']+|(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}(?::\d{2,5})?(?:\/[^\s<>"']*)?)/gi;

export function extractUrls(text: string): string[] {
  const urls = new Set<string>();
  for (const match of text.matchAll(URL_PATTERN)) {
    const cleaned = match[0].replace(/[.,;:!?)\]}>]+$/g, "");
    if (cleaned) urls.add(cleaned);
  }
  return [...urls];
}

export function analyseMessage(text: string): { findings: MessageFinding[]; score: number } {
  const findings: MessageFinding[] = [];

  for (const rule of RULES) {
    const matches = new Set<string>();
    for (const pattern of rule.patterns) {
      for (const match of text.matchAll(pattern)) {
        const value = match[0].replace(/\s+/g, " ").trim();
        if (value) matches.add(value);
        if (matches.size >= 6) break;
      }
    }

    if (matches.size > 0) {
      findings.push({
        id: rule.id,
        title: rule.title,
        explanation: rule.explanation,
        severity: rule.severity,
        matches: [...matches],
        weight: rule.weight,
      });
    }
  }

  return {
    findings,
    score: Math.min(100, findings.reduce((total, finding) => total + finding.weight, 0)),
  };
}
