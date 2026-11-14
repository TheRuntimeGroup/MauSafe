import { supabase } from "@/integrations/supabase/client";

export type OtpErrorCode =
  | "INVALID_EMAIL"
  | "INVALID_CODE"
  | "EXPIRED_CODE"
  | "PASSWORD_TOO_SHORT"
  | "EMAIL_NOT_VERIFIED"
  | "EMAIL_TAKEN"
  | "ACCOUNT_NOT_FOUND"
  | "USERNAME_TAKEN"
  | "INVALID_USERNAME"
  | "RATE_LIMITED"
  | "EMAIL_NOT_CONFIGURED"
  | "UNKNOWN";

async function invoke<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body });

  if (error) {
    throw new Error("UNKNOWN");
  }

  const payload = data as { error?: string; ok?: boolean } | null;
  if (payload && payload.error) {
    throw new Error(payload.error);
  }

  return data as T;
}

export function sendOtp(email: string) {
  return invoke<{ ok: true; expiresAt: string }>("send-otp", { email });
}

export function sendLoginOtp(email: string) {
  return invoke<{ ok: true; expiresAt: string }>("send-otp", { email, purpose: "login" });
}

export function verifyLoginOtp(input: { email: string; code: string }) {
  return invoke<{ ok: true; email: string; tempPassword: string }>("verify-login", input);
}

export function verifyEmailCode(input: { email: string; code: string }) {
  return invoke<{ ok: true }>("verify-signup", input);
}

export function createVerifiedAccount(input: { email: string; password: string; fullName: string; username: string }) {
  return invoke<{ ok: true; userId: string | null }>("verify-signup", input);
}
