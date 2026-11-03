"use client";

import { Loader2Icon, NfcIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth/client";

import { emailSchema, otpSchema } from "../schemas";
import { checkCanSignInWithEmail, verifyCardCodeForActivation } from "../server/actions";

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
  const router = useRouter();
  const [step, setStep] = useState<Step>({ name: "email" });
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // Physical card activation code state
  const [cardCode, setCardCode] = useState("");
  const [activating, setActivating] = useState(false);
  const [activateError, setActivateError] = useState<string | null>(null);

  async function onSubmitEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = emailSchema.safeParse({ email: new FormData(event.currentTarget).get("email") });
    if (!parsed.success) return setError(tv("invalidEmail"));

    setPending(true);
    setError(null);

    // Enforce paid customer check / card code gate
    const check = await checkCanSignInWithEmail(parsed.data.email, next);
    if (!check.allowed) {
      setPending(false);
      return setError(check.message);
    }

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

  async function onActivateCard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cardCode.trim()) return;

    setActivating(true);
    setActivateError(null);

    try {
      const result = await verifyCardCodeForActivation(cardCode);
      if (!result.ok) {
        setActivateError(result.error);
        return;
      }
      router.push(result.redirectUrl);
    } catch {
      setActivateError("An error occurred while validating your card code. Please try again.");
    } finally {
      setActivating(false);
    }
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
          <Button type="submit" disabled={pending} className="w-full">
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
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? <Loader2Icon className="animate-spin" aria-hidden /> : null}
            {t("sendCode")}
          </Button>
        </FieldGroup>
      </form>

      {/* Card Activation Section for paying customers */}
      <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary/20 text-primary ring-1 ring-primary/30">
            <NfcIcon className="size-4" aria-hidden />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-foreground">Have a new physical card?</span>
            <span className="text-[11px] text-muted-foreground">
              Enter your 8-character card code to activate
            </span>
          </div>
        </div>

        <form onSubmit={onActivateCard} className="flex gap-2">
          <Input
            name="cardCode"
            placeholder="e.g. 23456789"
            maxLength={8}
            value={cardCode}
            onChange={(e) => setCardCode(e.target.value.toUpperCase())}
            className="h-9 font-mono text-xs tracking-wider uppercase"
            disabled={activating}
            aria-label="Card activation code"
          />
          <Button
            type="submit"
            size="sm"
            disabled={activating || !cardCode.trim()}
            className="h-9 shrink-0 text-xs"
          >
            {activating ? (
              <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
            ) : (
              "Activate"
            )}
          </Button>
        </form>

        {activateError && <p className="text-xs text-destructive">{activateError}</p>}
      </div>
    </div>
  );
}
