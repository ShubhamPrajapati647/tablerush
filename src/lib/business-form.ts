import type { BusinessType } from "@/lib/roles";

/** Editable venue fields, shared by registration and the settings page. */
export type VenueForm = {
  business_name: string;
  owner_name: string;
  phone: string;
  description: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  location: string;
  cuisine: string;
  cafe_type: string;
  opening_time: string;
  closing_time: string;
  logo_url: string;
};

export const EMPTY_VENUE: VenueForm = {
  business_name: "",
  owner_name: "",
  phone: "",
  description: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  location: "",
  cuisine: "",
  cafe_type: "",
  opening_time: "",
  closing_time: "",
  logo_url: "",
};

export const CUISINES = [
  "North Indian",
  "South Indian",
  "Chinese",
  "Italian",
  "Continental",
  "Mughlai",
  "Fast food",
  "Seafood",
  "Multi-cuisine",
  "Vegetarian",
  "Other",
];

export const CAFE_TYPES = [
  "Coffee shop",
  "Bakery café",
  "Dessert café",
  "Tea house",
  "Books & café",
  "Pet-friendly café",
  "Study café",
  "Other",
];

export type FieldKey = keyof VenueForm | "email" | "password" | "confirm";
export type Errors = Partial<Record<FieldKey, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateVenue(form: VenueForm, type: BusinessType): Errors {
  const errors: Errors = {};
  const label = type === "restaurant" ? "Restaurant" : "Café";

  if (form.business_name.trim().length < 2) errors.business_name = `${label} name is required.`;
  if (form.owner_name.trim().length < 2) errors.owner_name = "Owner name is required.";
  if (!/^[0-9+\s-]{10,15}$/.test(form.phone.trim()))
    errors.phone = "Enter a valid mobile number (10–15 digits).";
  if (form.address.trim().length < 5) errors.address = "Enter the full street address.";
  if (!form.city.trim()) errors.city = "City is required.";
  if (!form.state.trim()) errors.state = "State is required.";
  if (!/^[0-9]{4,10}$/.test(form.pincode.trim())) errors.pincode = "Enter a valid pincode.";
  if (form.description.trim().length > 0 && form.description.trim().length < 20)
    errors.description = "Add at least 20 characters, or leave it empty for now.";
  if (type === "restaurant" && !form.cuisine) errors.cuisine = "Pick your main cuisine.";
  if (type === "cafe" && !form.cafe_type) errors.cafe_type = "Pick your café type.";
  if (!form.opening_time) errors.opening_time = "Opening time is required.";
  if (!form.closing_time) errors.closing_time = "Closing time is required.";

  return errors;
}

export function validateAccount(
  values: { email: string; password: string; confirm: string },
  existing: Errors = {},
): Errors {
  const errors: Errors = { ...existing };
  if (!EMAIL.test(values.email.trim())) errors.email = "Enter a valid email address.";
  if (values.password.length < 8) errors.password = "Use at least 8 characters.";
  if (values.password !== values.confirm) errors.confirm = "Passwords do not match.";
  return errors;
}

/** Database payload for a venue row (status is set server-side). */
export function venueRow(form: VenueForm, type: BusinessType) {
  const trimmed = (value: string) => value.trim() || null;
  return {
    business_name: form.business_name.trim(),
    owner_name: trimmed(form.owner_name),
    phone: trimmed(form.phone),
    description: trimmed(form.description),
    address: trimmed(form.address),
    city: trimmed(form.city),
    state: trimmed(form.state),
    pincode: trimmed(form.pincode),
    location: trimmed(form.location),
    cuisine: type === "restaurant" ? trimmed(form.cuisine) : null,
    cafe_type: type === "cafe" ? trimmed(form.cafe_type) : null,
    opening_time: form.opening_time || null,
    closing_time: form.closing_time || null,
    logo_url: trimmed(form.logo_url),
  };
}
