import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Plus, Trash2, Users } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { addContact, deleteContact, listContacts, type TrustedContact } from "@/lib/contacts";
import { AppButton, appButtonVariants } from "@/components/ui/app-button";

const Contacts = () => {
  const { t } = useI18n();
  const [contacts, setContacts] = useState<TrustedContact[]>(() => listContacts());
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [relationship, setRelationship] = useState("family");
  const [showForm, setShowForm] = useState(false);

  function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim() || !contact.trim()) return;
    setContacts(addContact({ name, contact, relationship }));
    setName("");
    setContact("");
    setRelationship("family");
    setShowForm(false);
  }

  function handleDelete(id: string) {
    setContacts(deleteContact(id));
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">{t("contacts.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("contacts.subtitle")}</p>
        </div>
        <AppButton variant="primary" size="md" onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">{t("contacts.add")}</span>
        </AppButton>
      </header>

      {showForm && (
        <form
          onSubmit={handleAdd}
          className="space-y-4 rounded-2xl border border-border bg-card p-5 animate-fade-in-up"
        >
          <h2 className="font-display text-base font-bold text-foreground">{t("contacts.addTitle")}</h2>
          <div className="space-y-2">
            <label htmlFor="contact-name" className="text-sm font-semibold text-foreground">
              {t("contacts.nameLabel")}
            </label>
            <input
              id="contact-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("contacts.namePlaceholder")}
              className="h-12 w-full rounded-2xl border border-input bg-card px-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="contact-value" className="text-sm font-semibold text-foreground">
              {t("contacts.contactLabel")}
            </label>
            <input
              id="contact-value"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder={t("contacts.contactPlaceholder")}
              className="h-12 w-full rounded-2xl border border-input bg-card px-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="contact-relationship" className="text-sm font-semibold text-foreground">
              {t("contacts.relationshipLabel")}
            </label>
            <select
              id="contact-relationship"
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              className="h-12 w-full rounded-xl border border-input bg-card px-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {["family", "friend", "neighbour", "other"].map((option) => (
                <option key={option} value={option}>{t(`contacts.relation.${option}`)}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <AppButton type="submit" variant="primary" size="lg" disabled={!name.trim() || !contact.trim()}>
              {t("contacts.add")}
            </AppButton>
            <AppButton type="button" variant="ghost" size="lg" onClick={() => setShowForm(false)}>
              {t("common.cancel")}
            </AppButton>
          </div>
        </form>
      )}

      {contacts.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <Heart className="mx-auto h-10 w-10 text-muted-foreground" aria-hidden="true" />
          <p className="mt-3 font-display text-base font-bold text-foreground">{t("contacts.empty")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("contacts.emptyHint")}</p>
        </section>
      ) : (
        <ul className="space-y-3">
          {contacts.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Users className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-display text-base font-bold text-foreground">{c.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {c.contact}
                    {c.relationship
                      ? ` · ${["family", "friend", "neighbour", "other"].includes(c.relationship)
                          ? t(`contacts.relation.${c.relationship}`)
                          : c.relationship}`
                      : ""}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(c.id)}
                className="inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-destructive hover:bg-destructive/10"
                aria-label={t("contacts.delete")}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">{t("contacts.delete")}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Link
        to="/start"
        className={appButtonVariants({ variant: "subtle", size: "lg" })}
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        {t("app.ctaStart")}
      </Link>
    </div>
  );
};

export default Contacts;
