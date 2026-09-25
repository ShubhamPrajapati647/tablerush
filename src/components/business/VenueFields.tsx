import { ImagePlus, Loader2 } from "lucide-react";
import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CAFE_TYPES,
  CUISINES,
  type Errors,
  type VenueForm,
} from "@/lib/business-form";
import { uploadLogo, useLogoUrl } from "@/lib/logo";
import type { BusinessType } from "@/lib/roles";

export function FieldError({ message }: { message: string | undefined }) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}

function Field({
  id,
  label,
  error,
  children,
  full,
}: {
  id: string;
  label: string;
  error: string | undefined;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={`space-y-2 ${full ? "sm:col-span-2" : ""}`}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      <FieldError message={error} />
    </div>
  );
}

function LogoField({
  userId,
  value,
  onChange,
  label,
}: {
  userId: string | undefined;
  value: string;
  onChange: (path: string) => void;
  label: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: previewUrl } = useLogoUrl(value || null);

  async function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!userId) {
      setError("Create your account first, then add a logo from Settings.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Logo must be smaller than 2 MB.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      onChange(await uploadLogo(userId, file));
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    }
    setBusy(false);
  }

  return (
    <div className="space-y-2 sm:col-span-2">
      <Label htmlFor="logo">{label}</Label>
      <div className="flex items-center gap-4">
        <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted">
          {previewUrl ? (
            <img src={previewUrl} alt="Venue logo" className="size-full object-cover" />
          ) : busy ? (
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          ) : (
            <ImagePlus className="size-5 text-muted-foreground" />
          )}
        </span>
        <Input id="logo" type="file" accept="image/*" onChange={onFile} disabled={busy} />
      </div>
      <p className="text-xs text-muted-foreground">PNG or JPG, up to 2 MB.</p>
      <FieldError message={error ?? undefined} />
    </div>
  );
}

/** The venue detail fields shared by registration and the settings page. */
export function VenueFields({
  type,
  form,
  errors,
  onChange,
  userId,
}: {
  type: BusinessType;
  form: VenueForm;
  errors: Errors;
  onChange: (patch: Partial<VenueForm>) => void;
  userId?: string | undefined;
}) {
  const label = type === "restaurant" ? "Restaurant" : "Café";
  const set =
    (key: keyof VenueForm) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      onChange({ [key]: event.target.value } as Partial<VenueForm>);

  const selectClass =
    "flex h-9 w-full rounded-xl border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none";

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field id="business_name" label={`${label} name`} error={errors.business_name} full>
        <Input id="business_name" value={form.business_name} onChange={set("business_name")} />
      </Field>

      <Field id="owner_name" label="Owner name" error={errors.owner_name}>
        <Input id="owner_name" value={form.owner_name} onChange={set("owner_name")} />
      </Field>

      <Field id="phone" label="Mobile number" error={errors.phone}>
        <Input id="phone" type="tel" value={form.phone} onChange={set("phone")} />
      </Field>

      <Field id="address" label={`${label} address`} error={errors.address} full>
        <Input id="address" value={form.address} onChange={set("address")} />
      </Field>

      <Field id="city" label="City" error={errors.city}>
        <Input id="city" value={form.city} onChange={set("city")} />
      </Field>

      <Field id="state" label="State" error={errors.state}>
        <Input id="state" value={form.state} onChange={set("state")} />
      </Field>

      <Field id="pincode" label="Pincode" error={errors.pincode}>
        <Input id="pincode" inputMode="numeric" value={form.pincode} onChange={set("pincode")} />
      </Field>

      <Field id="location" label="Location / area or map link" error={errors.location}>
        <Input
          id="location"
          placeholder="e.g. Andheri West or a Google Maps link"
          value={form.location}
          onChange={set("location")}
        />
      </Field>

      {type === "restaurant" ? (
        <Field id="cuisine" label="Cuisine" error={errors.cuisine}>
          <select
            id="cuisine"
            className={selectClass}
            value={form.cuisine}
            onChange={set("cuisine")}
          >
            <option value="">Select cuisine</option>
            {CUISINES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </Field>
      ) : (
        <Field id="cafe_type" label="Café type" error={errors.cafe_type}>
          <select
            id="cafe_type"
            className={selectClass}
            value={form.cafe_type}
            onChange={set("cafe_type")}
          >
            <option value="">Select café type</option>
            {CAFE_TYPES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </Field>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Field id="opening_time" label="Opens" error={errors.opening_time}>
          <Input
            id="opening_time"
            type="time"
            value={form.opening_time}
            onChange={set("opening_time")}
          />
        </Field>
        <Field id="closing_time" label="Closes" error={errors.closing_time}>
          <Input
            id="closing_time"
            type="time"
            value={form.closing_time}
            onChange={set("closing_time")}
          />
        </Field>
      </div>

      <Field id="description" label="Description" error={errors.description} full>
        <Textarea
          id="description"
          rows={3}
          placeholder={`Tell guests what makes your ${label.toLowerCase()} special.`}
          value={form.description}
          onChange={set("description")}
        />
      </Field>

      <LogoField
        userId={userId}
        value={form.logo_url}
        onChange={(path) => onChange({ logo_url: path })}
        label={`${label} logo`}
      />
    </div>
  );
}
