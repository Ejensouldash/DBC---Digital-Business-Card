"use client";

import { Loader2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth/client";

import { emailSchema, otpSchema } from "../schemas";

import { GoogleButton } from "./google-button";

type Step = { name: "email" } | { name: "code"; email: string };

async function sendCode(email: string): Promise<boolean> {
  try {
    const { error } = await authClient.emailOtp.sendVerificationOtp({ email, type: "sign-in" });
    return !error;
  } catch {
    return false;
  }
}

async function verifyCode(email: string, otp: string): Promise<boolean> {
  try {
    const { error } = await authClient.signIn.emailOtp({ email, otp });
    return !error;
  } catch {
    return false;
  }
}

export function LoginForm({ next }: { next: string }) {
  const t = useTranslations("Login");
  const tv = useTranslations("Validation");
  const [step, setStep] = useState<Step>({ name: "email" });
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmitEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = emailSchema.safeParse({ email: new FormData(event.currentTarget).get("email") });
    if (!parsed.success) return setError(tv("invalidEmail"));

    setPending(true);
    setError(null);
    const sent = await sendCode(parsed.data.email);
    setPending(false);
    if (!sent) return setError(t("sendFailed"));
    setStep({ name: "code", email: parsed.data.email });
  }

  async function onSubmitCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step.name !== "code") return;
    const parsed = otpSchema.safeParse({ otp: new FormData(event.currentTarget).get("otp") });
    if (!parsed.success) return setError(tv("invalidOtp"));

    setPending(true);
    setError(null);
    const verified = await verifyCode(step.email, parsed.data.otp);
    if (!verified) {
      setPending(false);
      return setError(t("codeInvalid"));
    }
    // Full navigation so the proxy and server components see the new session cookie.
    window.location.assign(next);
  }

  if (step.name === "code") {
    return (
      <form onSubmit={onSubmitCode} noValidate>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="otp">{t("codeLabel")}</FieldLabel>
            <Input
              id="otp"
              name="otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={6}
              autoFocus
              required
              aria-invalid={error ? true : undefined}
            />
            <FieldDescription>{t("codeSent", { email: step.email })}</FieldDescription>
            <FieldError>{error}</FieldError>
          </Field>
          <Button type="submit" disabled={pending}>
            {pending ? <Loader2Icon className="animate-spin" aria-hidden /> : null}
            {t("verify")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setStep({ name: "email" });
              setError(null);
            }}
          >
            {t("useOtherEmail")}
          </Button>
        </FieldGroup>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={onSubmitEmail} noValidate>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="email">{t("emailLabel")}</FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder={t("emailPlaceholder")}
              required
              aria-invalid={error ? true : undefined}
            />
            <FieldError>{error}</FieldError>
          </Field>
          <Button type="submit" disabled={pending}>
            {pending ? <Loader2Icon className="animate-spin" aria-hidden /> : null}
            {t("sendCode")}
          </Button>
        </FieldGroup>
      </form>
      <div className="flex items-center gap-3 text-xs text-muted-foreground uppercase">
        <span className="h-px flex-1 bg-border" />
        {t("or")}
        <span className="h-px flex-1 bg-border" />
      </div>
      <GoogleButton next={next} label={t("google")} errorLabel={t("googleFailed")} />
    </div>
  );
}
