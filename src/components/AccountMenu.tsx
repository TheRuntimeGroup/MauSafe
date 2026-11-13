import { NavLink } from "react-router-dom";
import { ChevronDown, LoaderCircle, LogIn, LogOut, Megaphone, UserPlus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/i18n/I18nContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type AccountMenuProps = {
  variant?: "sidebar" | "header";
};

export function AccountMenu({ variant = "sidebar" }: AccountMenuProps) {
  const { t } = useI18n();
  const { user, loading, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();

  if (loading) {
    return (
      <span
        className={cn(
          "items-center justify-center text-muted-foreground",
          variant === "sidebar"
            ? "flex gap-2.5 px-1 text-xs font-semibold"
            : "flex h-10 w-10 rounded-full border border-foreground/[0.08] bg-white shadow-sm",
        )}
        aria-hidden="true"
      >
        <LoaderCircle className="h-4 w-4 animate-spin" />
        {variant === "sidebar" && t("auth.signIn")}
      </span>
    );
  }

  if (!user) {
    return (
      <div
        className={cn(
          variant === "sidebar"
            ? "flex flex-col gap-1.5"
            : "flex items-center gap-1.5",
        )}
      >
        <NavLink
          to="/welcome"
          aria-label={t("auth.signUp")}
          className={cn(
            variant === "sidebar"
              ? "flex items-center gap-2.5 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
              : "flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-colors hover:bg-primary/90",
          )}
        >
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          {variant === "sidebar" && t("auth.signUp")}
        </NavLink>
        <NavLink
          to="/auth"
          aria-label={t("auth.signIn")}
          className={cn(
            variant === "sidebar"
              ? "flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-primary"
              : "flex h-10 w-10 items-center justify-center rounded-full border border-foreground/[0.08] bg-white text-foreground shadow-sm transition-colors hover:text-primary",
          )}
        >
          <LogIn className="h-4 w-4" aria-hidden="true" />
          {variant === "sidebar" && t("auth.signIn")}
        </NavLink>
      </div>
    );
  }

  const email = user.email ?? t("auth.account");
  const fallback = user.email ? user.email.charAt(0).toUpperCase() : "?";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t("auth.account")}
          className={cn(
            "transition-colors",
            variant === "sidebar"
              ? "flex w-full items-center gap-2.5 rounded-xl px-1 text-left text-xs font-semibold text-muted-foreground hover:text-primary"
              : "flex h-10 w-10 items-center justify-center rounded-full border border-foreground/[0.08] bg-white text-foreground shadow-sm hover:text-primary",
          )}
        >
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-primary text-[11px] font-extrabold text-primary-foreground">
              {fallback}
            </AvatarFallback>
          </Avatar>
          {variant === "sidebar" && (
            <>
              <span className="min-w-0 flex-1 truncate">{email}</span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            </>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        side={variant === "sidebar" ? "top" : "bottom"}
        className="w-60 rounded-2xl border-foreground/[0.08] bg-white p-2 shadow-premium"
      >
        <DropdownMenuLabel className="px-2 py-1.5">
          <p className="truncate text-sm font-bold text-foreground">{email}</p>
          <p className="mt-0.5 text-xs font-medium text-muted-foreground">{t("auth.account")}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isAdmin && (
          <DropdownMenuItem asChild className="gap-2 rounded-xl px-2 py-2 text-sm font-semibold text-foreground focus:bg-muted">
            <NavLink to="/admin/announcements">
              <Megaphone className="h-4 w-4" aria-hidden="true" />
              {t("nav.admin")}
            </NavLink>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault();
            void signOut();
          }}
          className="gap-2 rounded-xl px-2 py-2 text-sm font-semibold text-danger focus:bg-muted focus:text-danger"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          {t("auth.signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
