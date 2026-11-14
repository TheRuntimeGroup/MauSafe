import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Mail, MessageSquareText, Plus, Trash2, Users } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { addContact, deleteContact, listContacts, type TrustedContact } from "@/lib/contacts";
import { AppButton, appButtonVariants } from "@/components/ui/app-button";
import { cn } from "@/lib/utils";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Contacts() {
  const { t } = useI18n();
  const [contacts, setContacts] = useState<TrustedContact[]>(() => listContacts());
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [relationship, setRelationship] = useState("family");
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedContact = contact.trim();
    if (!trimmedName || !trimmedContact) {
      setError(t("contacts.requiredFields"));
      return;
    }
    if (!EMAIL_PATTERN.test(trimmedContact)) {
      setError(t("contacts.invalidEmail"));
      return;
    }

    setContacts(addContact({
      name: trimmedName,
      contact: trimmedContact.toLowerCase(),
      relationship,
    }));
    setName("");
    setContact("");
    setRelationship("family");
    setShowForm(false);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">{t("contacts.title")}</h1>
          <p className="mt-1 max-w-md text-sm leading-relaxed text-muted-foreground">{t("contacts.subtitle")}</p>
        </div>
        <AppButton variant={showForm ? "outline" : "primary"} size="md" onClick={() => setShowForm((value) => !value)}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">{showForm ? t("common.cancel") : t("contacts.add")}</span>
        </AppButton>
      </header>

      {showForm && (
        <form onSubmit={handleAdd} className="space-y-5 rounded-[1.75rem] border border-[#DDE6ED] bg-card p-5 shadow-premium sm:p-7 motion-safe:animate-fade-in-up">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Users className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-display text-lg font-extrabold text-foreground">{t("contacts.addTitle")}</h2>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{t("contacts.formHint")}</p>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="contact-name" className="text-sm font-semibold text-foreground">{t("contacts.nameLabel")}</label>
            <input
              id="contact-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t("contacts.namePlaceholder")}
              maxLength={60}
              autoComplete="off"
              required
              className="h-12 w-full rounded-xl border border-input bg-white px-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="contact-value" className="text-sm font-semibold text-foreground">
              {t("contacts.emailAddressLabel")}
            </label>
            <input
              id="contact-value"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={contact}
              onChange={(event) => {
                setContact(event.target.value);
                setError(null);
              }}
              placeholder="name@example.com"
              maxLength={100}
              required
              className="h-12 w-full rounded-xl border border-input bg-white px-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="contact-relationship" className="text-sm font-semibold text-foreground">{t("contacts.relationshipLabel")}</label>
            <select
              id="contact-relationship"
              value={relationship}
              onChange={(event) => setRelationship(event.target.value)}
              className="h-12 w-full rounded-xl border border-input bg-white px-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {["family", "friend", "neighbour", "other"].map((option) => (
                <option key={option} value={option}>{t(`contacts.relation.${option}`)}</option>
              ))}
            </select>
          </div>

          {error && <p role="alert" className="rounded-xl bg-danger/[0.06] px-3 py-2.5 text-xs font-semibold text-danger">{error}</p>}

          <div className="flex flex-wrap gap-2 border-t border-foreground/[0.07] pt-4">
            <AppButton type="submit" variant="primary" size="lg">{t("contacts.add")}</AppButton>
            <AppButton type="button" variant="ghost" size="lg" onClick={() => setShowForm(false)}>{t("common.cancel")}</AppButton>
          </div>
        </form>
      )}

      {contacts.length === 0 ? (
        <section className="rounded-[1.75rem] border border-dashed border-border bg-card p-8 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary">
            <Heart className="h-7 w-7" aria-hidden="true" />
          </span>
          <p className="mt-4 font-display text-base font-extrabold text-foreground">{t("contacts.empty")}</p>
          <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">{t("contacts.emptyHint")}</p>
        </section>
      ) : (
        <ul className="space-y-3">
          {contacts.map((item) => {
            const email = EMAIL_PATTERN.test(item.contact);
            return (
              <li key={item.id} className="flex items-center justify-between gap-3 rounded-2xl border border-[#DDE6ED] bg-card p-4 shadow-[0_10px_30px_-28px_rgba(13,43,69,0.55)]">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                    {email ? <Mail className="h-5 w-5" aria-hidden="true" /> : <MessageSquareText className="h-5 w-5" aria-hidden="true" />}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-display text-base font-extrabold text-foreground">{item.name}</p>
                    <p className="truncate text-sm text-muted-foreground">{item.contact}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-primary">
                        {email ? t("contacts.channelEmail") : t("contacts.channelPhone")}
                      </span>
                      {item.relationship && ["family", "friend", "neighbour", "other"].includes(item.relationship) && (
                        <span>{t(`contacts.relation.${item.relationship}`)}</span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setContacts(deleteContact(item.id))}
                  className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-danger transition-colors hover:bg-danger/[0.07]"
                  aria-label={`${t("contacts.delete")} ${item.name}`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">{t("contacts.removeContact")}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <Link to="/start" className={appButtonVariants({ variant: "subtle", size: "lg" })}>
        <Plus className="h-4 w-4" aria-hidden="true" />
        {t("app.ctaStart")}
      </Link>
    </div>
  );
}
