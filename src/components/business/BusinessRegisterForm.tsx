import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { useState } from "react";

import { FieldError, VenueFields } from "@/components/business/VenueFields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  EMPTY_VENUE,
  validateAccount,
  validateVenue,
  venueRow,
  type Errors,
  type VenueForm,
} from "@/lib/business-form";
import { claimOrCreateBusiness } from "@/lib/business-claim.functions";
import type { BusinessType } from "@/lib/roles";

/**
 * Registers a venue owner in one step: auth account (profile and role come from
 * the database trigger) and the venue record, which starts in review.
 */
export function BusinessRegisterForm({ type }: { type: BusinessType }) {
  const label = type === "restaurant" ? "Restaurant" : "Café";
  const role = type === "restaurant" ? "restaurant_owner" : "cafe_owner";
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const claim = useServerFn(claimOrCreateBusiness);

  const [venue, setVenue] = useState<VenueForm>(EMPTY_VENUE);
  const [account, setAccount] = useState({ email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);

    const nextErrors = validateAccount(account, validateVenue(venue, type));
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setFormError("Please fix the highlighted fields.");
      return;
    }

    setBusy(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: account.email.trim(),
      password: account.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          full_name: venue.owner_name.trim(),
          phone: venue.phone.trim(),
          role,
          business_name: venue.business_name.trim(),
        },
      },
    });

    if (signUpError || !data.user) {
      setFormError(signUpError?.message ?? "Could not create your account.");
      setBusy(false);
      return;
    }

    if (!data.session) {
      setFormError("Account created. Confirm your email, then sign in to finish your venue setup.");
      setBusy(false);
      return;
    }

    // Links the account to an existing Mumbai directory listing when one matches,
    // so a registered venue never becomes a duplicate record.
    try {
      await claim({
        data: {
          business_type: type,
          email: account.email.trim(),
          venue: venueRow(venue, type) as unknown as Record<string, unknown>,
        },
      });
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Unknown error";
      setFormError(
        `Your account was created, but the ${label.toLowerCase()} details could not be saved: ${message}. Sign in and try again from Settings.`,
      );
      setBusy(false);
      return;
    }

    await refresh();
    void navigate({
      to: type === "restaurant" ? "/restaurant/dashboard" : "/cafe/dashboard",
      replace: true,
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8" noValidate>
      {formError ? (
        <p className="rounded-xl bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
          {formError}
        </p>
      ) : null}

      <section className="surface-card space-y-5 p-6">
        <div>
          <h2 className="text-lg font-semibold">{label} details</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Guests see this once Table Rush approves your venue.
          </p>
        </div>
        <VenueFields
          type={type}
          form={venue}
          errors={errors}
          onChange={(patch) => setVenue((prev) => ({ ...prev, ...patch }))}
        />
      </section>

      <section className="surface-card space-y-5 p-6">
        <div>
          <h2 className="text-lg font-semibold">Owner sign-in</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            You&apos;ll use these to sign in to your {label.toLowerCase()} dashboard.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={account.email}
              onChange={(e) => setAccount((p) => ({ ...p, email: e.target.value }))}
            />
            <FieldError message={errors.email} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              value={account.password}
              onChange={(e) => setAccount((p) => ({ ...p, password: e.target.value }))}
            />
            <FieldError message={errors.password} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm password</Label>
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              value={account.confirm}
              onChange={(e) => setAccount((p) => ({ ...p, confirm: e.target.value }))}
            />
            <FieldError message={errors.confirm} />
          </div>
        </div>
      </section>

      <Button type="submit" size="lg" disabled={busy}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : `Register ${label.toLowerCase()}`}
      </Button>
      <p className="text-xs text-muted-foreground">
        New venues stay in review until Table Rush approves them. You can manage everything from
        your dashboard in the meantime.
      </p>
    </form>
  );
}
