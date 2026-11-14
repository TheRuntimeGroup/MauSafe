import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Heart, UserPlus } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { listContacts, type TrustedContact } from "@/lib/contacts";
import { QuickShareDialog } from "@/components/QuickShareDialog";
import type { OwnerJourney } from "@/lib/types";
import { cn } from "@/lib/utils";

const AVATAR_TONES = [
  "bg-sky-100 text-sky-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-violet-100 text-violet-700",
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function toneFor(name: string): string {
  let hash = 0;
  for (const char of name) hash = (hash + char.charCodeAt(0)) % AVATAR_TONES.length;
  return AVATAR_TONES[hash];
}

export function HomeTrustedContacts({ journey }: { journey: OwnerJourney | null }) {
  const { t } = useI18n();
  const [contacts] = useState<TrustedContact[]>(() => listContacts());
  const [selectedContact, setSelectedContact] = useState<TrustedContact | null>(null);

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3 px-1">
        <div>
          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            {t("nav.contacts")}
          </p>
          <h2 className="mt-1 font-display text-xl font-extrabold tracking-tight text-foreground">
            {t("home.peopleTitle")}
          </h2>
        </div>
        <Link
          to="/contacts"
          className="inline-flex min-h-10 items-center gap-1.5 rounded-xl px-2 text-xs font-bold text-primary transition-colors hover:bg-secondary"
        >
          {t("home.peopleManage")}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>

      {contacts.length === 0 ? (
        <Link
          to="/contacts"
          className="flex items-center gap-4 rounded-[1.35rem] border border-dashed border-[#C7D5E0] bg-white/60 p-5 transition-colors hover:border-primary/30 hover:bg-white"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EEF5FA] text-primary ring-1 ring-primary/10">
            <Heart className="h-[22px] w-[22px]" strokeWidth={1.8} aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-display text-sm font-extrabold text-foreground">
              {t("contacts.empty")}
            </span>
            <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
              {t("contacts.emptyHint")}
            </span>
          </span>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/80 text-muted-foreground">
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </span>
        </Link>
      ) : (
        <ul className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {contacts.map((contact) => (
            <li key={contact.id} className="w-[4.75rem] shrink-0">
              <button type="button" onClick={() => setSelectedContact(contact)} aria-label={t("quickShare.shareWith", { name: contact.name })} className="group flex w-full flex-col items-center gap-2 rounded-2xl text-center focus-visible:outline-primary">
                <span
                  className={cn(
                    "flex h-14 w-14 items-center justify-center rounded-full text-base font-extrabold shadow-sm ring-2 ring-white transition-transform group-hover:-translate-y-0.5",
                    toneFor(contact.name),
                  )}
                >
                  {initials(contact.name)}
                </span>
                <span className="max-w-full truncate text-xs font-semibold text-foreground">
                  {contact.name}
                </span>
              </button>
            </li>
          ))}
          <li className="w-[4.75rem] shrink-0">
            <Link to="/contacts" className="flex flex-col items-center gap-2 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-[#C7D5E0] text-primary transition-colors hover:border-primary/40 hover:bg-secondary">
                <UserPlus className="h-5 w-5" strokeWidth={1.9} aria-hidden="true" />
              </span>
              <span className="max-w-full truncate text-xs font-semibold text-primary">
                {t("home.peopleAddShort")}
              </span>
            </Link>
          </li>
        </ul>
      )}
      {selectedContact && <QuickShareDialog recipient={selectedContact} onClose={() => setSelectedContact(null)} />}
    </section>
  );
}
