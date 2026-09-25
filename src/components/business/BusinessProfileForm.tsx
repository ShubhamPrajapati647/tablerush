import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";

import { VenueFields } from "@/components/business/VenueFields";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  EMPTY_VENUE,
  validateVenue,
  venueRow,
  type Errors,
  type VenueForm,
} from "@/lib/business-form";
import type { BusinessType } from "@/lib/roles";
import type { Business } from "@/lib/useMyBusiness";

function toForm(business: Business | null, fallbackOwner: string, fallbackPhone: string): VenueForm {
  if (!business) return { ...EMPTY_VENUE, owner_name: fallbackOwner, phone: fallbackPhone };
  return {
    business_name: business.business_name ?? "",
    owner_name: business.owner_name ?? fallbackOwner,
    phone: business.phone ?? fallbackPhone,
    description: business.description ?? "",
    address: business.address ?? "",
    city: business.city ?? "",
    state: business.state ?? "",
    pincode: business.pincode ?? "",
    location: business.location ?? "",
    cuisine: business.cuisine ?? "",
    cafe_type: business.cafe_type ?? "",
    opening_time: (business.opening_time ?? "").slice(0, 5),
    closing_time: (business.closing_time ?? "").slice(0, 5),
    logo_url: business.logo_url ?? "",
  };
}

/** Create or edit the signed-in owner's venue profile. */
export function BusinessProfileForm({
  type,
  business,
}: {
  type: BusinessType;
  business: Business | null;
}) {
  const label = type === "restaurant" ? "Restaurant" : "Café";
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<VenueForm>(() =>
    toForm(business, profile?.full_name ?? "", profile?.phone ?? ""),
  );
  const [errors, setErrors] = useState<Errors>({});
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!user) return;
    setMessage(null);

    const nextErrors = validateVenue(form, type);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setMessage({ tone: "error", text: "Please fix the highlighted fields." });
      return;
    }

    setBusy(true);
    const payload = venueRow(form, type);

    const { error } = business
      ? await supabase.from("businesses").update(payload).eq("id", business.id)
      : await supabase
          .from("businesses")
          .insert({ ...payload, owner_id: user.id, business_type: type, email: user.email ?? null });

    if (error) {
      setMessage({ tone: "error", text: error.message });
      setBusy(false);
      return;
    }

    await queryClient.invalidateQueries({ queryKey: ["my-business", type, user.id] });
    setMessage({
      tone: "success",
      text: business ? "Your venue profile is saved." : `Your ${label.toLowerCase()} is registered.`,
    });
    setBusy(false);
  }

  return (
    <form onSubmit={onSubmit} className="surface-card space-y-5 p-6" noValidate>
      <div>
        <h2 className="text-lg font-semibold">
          {business ? `${label} profile` : `Set up your ${label.toLowerCase()}`}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {business
            ? "These details appear to guests once your venue is active."
            : "Add your venue details to finish setting up. It stays in review until approved."}
        </p>
      </div>

      {message ? (
        <p
          className={`rounded-xl px-3 py-2.5 text-sm ${
            message.tone === "error"
              ? "bg-destructive/10 text-destructive"
              : "bg-primary/15 text-foreground"
          }`}
        >
          {message.text}
        </p>
      ) : null}

      <VenueFields
        type={type}
        form={form}
        errors={errors}
        userId={user?.id}
        onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
      />

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : "Save changes"}
        </Button>
        {business ? (
          <span className="text-xs text-muted-foreground">
            Approval status is managed by Table Rush and can&apos;t be changed here.
          </span>
        ) : null}
      </div>
    </form>
  );
}
