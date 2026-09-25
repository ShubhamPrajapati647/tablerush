import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
  Search,
  SlidersHorizontal,
  Store,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/components/EmptyState";
import { DirectoryCard } from "@/components/directory/DirectoryCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CAFE_TYPES, CUISINES } from "@/lib/business-form";
import {
  DIRECTORY_EMPTY_MESSAGE,
  EMPTY_QUERY,
  PAGE_SIZE,
  useDirectoryAreas,
  useDirectorySearch,
  useOptionalLocation,
  type DirectoryQuery,
  type DirectorySort,
} from "@/lib/directory";
import { directoryProviderState } from "@/lib/directory.functions";
import { MUMBAI_AREA_GROUPS } from "@/lib/mumbai";
import type { BusinessType } from "@/lib/roles";

const SELECT_CLASS =
  "h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring";

function useDebounced(value: string, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

/**
 * Mumbai restaurant & café discovery. All filtering, sorting, distance maths and
 * pagination happen in the database, so the browser only ever holds one page.
 */
export function DirectoryBrowser({ fixedType }: { fixedType?: BusinessType }) {
  const [term, setTerm] = useState("");
  const [filters, setFilters] = useState<DirectoryQuery>({
    ...EMPTY_QUERY,
    type: fixedType ?? "all",
  });
  const [showFilters, setShowFilters] = useState(false);
  const debouncedTerm = useDebounced(term);
  const location = useOptionalLocation();

  const query: DirectoryQuery = useMemo(
    () => ({ ...filters, term: debouncedTerm, type: fixedType ?? filters.type }),
    [filters, debouncedTerm, fixedType],
  );

  const { data, isLoading, isError, isFetching } = useDirectorySearch(
    query,
    query.sort === "distance" ? location.coords : location.coords,
  );
  const { data: areas } = useDirectoryAreas(fixedType ?? filters.type);
  const providerFn = useServerFn(directoryProviderState);
  const { data: provider } = useQuery({
    queryKey: ["directory-provider-state"],
    queryFn: () => providerFn(),
    staleTime: 5 * 60_000,
  });

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const categoryOptions = (fixedType ?? filters.type) === "cafe" ? CAFE_TYPES : CUISINES;

  function patch(update: Partial<DirectoryQuery>) {
    setFilters((prev) => ({ ...prev, ...update, page: update.page ?? 1 }));
  }

  const areaNames = new Set((areas ?? []).map((row) => row.area));

  return (
    <div className="space-y-6">
      <div className="surface-card space-y-4 p-4 sm:p-5">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Search by name, area, locality or cuisine"
            aria-label="Search restaurants and cafés in Mumbai"
            className="h-12 pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          {!fixedType ? (
            <div className="flex flex-1 gap-1 rounded-xl bg-muted p-1" role="tablist">
              {(
                [
                  { value: "all", label: "All" },
                  { value: "restaurant", label: "Restaurants" },
                  { value: "cafe", label: "Cafés" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  role="tab"
                  aria-selected={filters.type === tab.value}
                  onClick={() => patch({ type: tab.value })}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    filters.type === tab.value
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          ) : (
            <span className="flex-1 text-sm text-muted-foreground">
              {total} {total === 1 ? "listing" : "listings"} in Mumbai
            </span>
          )}
          <Button
            type="button"
            variant="outline"
            className="shrink-0 lg:hidden"
            aria-expanded={showFilters}
            onClick={() => setShowFilters((open) => !open)}
          >
            <SlidersHorizontal className="size-4" />
            Filters
          </Button>
        </div>

        <div className={`${showFilters ? "grid" : "hidden"} gap-3 lg:grid lg:grid-cols-4`}>
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">Mumbai area</span>
            <select
              className={SELECT_CLASS}
              value={filters.area}
              onChange={(event) => patch({ area: event.target.value })}
            >
              <option value="">All areas</option>
              {MUMBAI_AREA_GROUPS.map((group) => (
                <optgroup key={group.zone} label={group.zone}>
                  {group.areas.map((area) => (
                    <option key={area} value={area}>
                      {area}
                      {areaNames.has(area) ? "" : " —"}
                    </option>
                  ))}
                </optgroup>
              ))}
              {(areas ?? [])
                .filter(
                  (row) => !MUMBAI_AREA_GROUPS.some((group) => group.areas.includes(row.area)),
                )
                .map((row) => (
                  <option key={row.area} value={row.area}>
                    {row.area} ({row.venue_count})
                  </option>
                ))}
            </select>
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              {(fixedType ?? filters.type) === "cafe" ? "Café type" : "Cuisine"}
            </span>
            <select
              className={SELECT_CLASS}
              value={filters.cuisine}
              onChange={(event) => patch({ cuisine: event.target.value })}
            >
              <option value="">All</option>
              {categoryOptions.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">Sort by</span>
            <select
              className={SELECT_CLASS}
              value={filters.sort}
              onChange={(event) => patch({ sort: event.target.value as DirectorySort })}
            >
              <option value="name">Name</option>
              <option value="recent">Recently added</option>
              <option value="distance" disabled={!location.coords}>
                Distance {location.coords ? "" : "(needs location)"}
              </option>
            </select>
          </label>

          <div className="space-y-2 pt-1">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-4 rounded border-input"
                checked={filters.openNow}
                onChange={(event) => patch({ openNow: event.target.checked })}
              />
              <span>Open now</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-4 rounded border-input"
                checked={filters.tableRushOnly}
                onChange={(event) => patch({ tableRushOnly: event.target.checked })}
              />
              <span>Table Rush ordering available</span>
            </label>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-border pt-3 text-sm">
          {location.state === "granted" ? (
            <span className="inline-flex items-center gap-2 text-muted-foreground">
              <MapPin className="size-4" /> Using your location for distances
              <button type="button" className="underline" onClick={location.clear}>
                turn off
              </button>
            </span>
          ) : location.state === "denied" ? (
            <span className="text-muted-foreground">
              Location is off — searching by area and name instead.
            </span>
          ) : (
            <button
              type="button"
              onClick={location.request}
              className="inline-flex items-center gap-2 text-muted-foreground underline"
            >
              <MapPin className="size-4" /> Use my location for distances (optional)
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex min-h-48 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <EmptyState
          icon={Store}
          title="We couldn't load listings"
          description="Something went wrong while loading this page. Please refresh and try again."
        />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Store}
          title="No restaurants or cafés found."
          description={
            provider && !provider.configured
              ? DIRECTORY_EMPTY_MESSAGE
              : "Try a different search term, area or clear the filters."
          }
        />
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {total} {total === 1 ? "listing" : "listings"}
            {isFetching ? " · updating…" : ""}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {rows.map((row) => (
              <DirectoryCard key={row.id} row={row} />
            ))}
          </div>

          {pages > 1 ? (
            <nav className="flex items-center justify-between gap-3 pt-2" aria-label="Pagination">
              <Button
                type="button"
                variant="outline"
                disabled={filters.page <= 1}
                onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}
              >
                <ChevronLeft className="size-4" /> Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {filters.page} of {pages}
              </span>
              <Button
                type="button"
                variant="outline"
                disabled={filters.page >= pages}
                onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
              >
                Next <ChevronRight className="size-4" />
              </Button>
            </nav>
          ) : null}
        </>
      )}
    </div>
  );
}
