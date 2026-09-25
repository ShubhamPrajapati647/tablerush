import { Loader2, Search, Store } from "lucide-react";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/EmptyState";
import { BusinessCard } from "@/components/site/BusinessCard";
import { Input } from "@/components/ui/input";
import {
  categoryOptions,
  isOpenNow,
  uniqueSorted,
  useActiveBusinesses,
} from "@/lib/discovery";
import type { BusinessType } from "@/lib/roles";
import type { Business } from "@/lib/useMyBusiness";

const SELECT_CLASS =
  "h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring";

function matches(business: Business, term: string): boolean {
  if (!term) return true;
  const haystack = [
    business.business_name,
    business.city,
    business.state,
    business.location,
    business.address,
    business.cuisine,
    business.cafe_type,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(term);
}

/**
 * Customer-facing discovery: live search plus city, type, category and
 * open-now filters over active venues loaded from the database.
 */
export function DiscoveryBrowser({ fixedType }: { fixedType?: BusinessType }) {
  const { data, isLoading, isError } = useActiveBusinesses(fixedType);
  const [term, setTerm] = useState("");
  const [city, setCity] = useState("all");
  const [type, setType] = useState<BusinessType | "all">("all");
  const [category, setCategory] = useState("all");
  const [openOnly, setOpenOnly] = useState(false);

  const businesses = data ?? [];
  const cities = useMemo(() => uniqueSorted(businesses.map((b) => b.city)), [businesses]);
  const categories = useMemo(() => categoryOptions(businesses), [businesses]);

  const results = useMemo(() => {
    const needle = term.trim().toLowerCase();
    return businesses.filter((business) => {
      if (!matches(business, needle)) return false;
      if (city !== "all" && business.city !== city) return false;
      if (!fixedType && type !== "all" && business.business_type !== type) return false;
      if (category !== "all") {
        const raw =
          business.business_type === "restaurant" ? business.cuisine : business.cafe_type;
        const tokens = (raw ?? "").split(/[,/|]/).map((part) => part.trim());
        if (!tokens.includes(category)) return false;
      }
      if (openOnly && isOpenNow(business) !== true) return false;
      return true;
    });
  }, [businesses, term, city, type, category, openOnly, fixedType]);

  return (
    <div className="space-y-8">
      <div className="surface-card p-5">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Search by name, city, location or cuisine"
            aria-label="Search restaurants and cafés"
            className="h-11 pl-9"
          />
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">Location</span>
            <select
              className={SELECT_CLASS}
              value={city}
              onChange={(event) => setCity(event.target.value)}
            >
              <option value="all">All cities</option>
              {cities.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          {!fixedType ? (
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">Business type</span>
              <select
                className={SELECT_CLASS}
                value={type}
                onChange={(event) => setType(event.target.value as BusinessType | "all")}
              >
                <option value="all">Restaurants & cafés</option>
                <option value="restaurant">Restaurants</option>
                <option value="cafe">Cafés</option>
              </select>
            </label>
          ) : null}

          <label className="space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              {fixedType === "cafe" ? "Café type" : "Cuisine"}
            </span>
            <select
              className={SELECT_CLASS}
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="all">All</option>
              {categories.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-end gap-2 pb-1 text-sm">
            <input
              type="checkbox"
              className="size-4 rounded border-input"
              checked={openOnly}
              onChange={(event) => setOpenOnly(event.target.checked)}
            />
            <span>Open now only</span>
          </label>
        </div>
      </div>

      {isLoading ? (
        <div className="flex min-h-48 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <EmptyState
          icon={Store}
          title="We couldn't load venues"
          description="Something went wrong while loading the list. Please refresh and try again."
        />
      ) : results.length === 0 ? (
        <EmptyState
          icon={Store}
          title="No restaurants or cafés found."
          description={
            businesses.length === 0
              ? "Approved restaurants and cafés appear here as soon as they join Table Rush."
              : "Try a different search term or clear the filters."
          }
        />
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {results.length} {results.length === 1 ? "venue" : "venues"}
          </p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((business) => (
              <BusinessCard key={business.id} business={business} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
