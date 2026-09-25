import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, BadgeCheck, Copy, Loader2, RefreshCw, Search, Store } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { directoryProviderState } from "@/lib/directory.functions";
import { MUMBAI_AREA_GROUPS } from "@/lib/mumbai";
import {
  ADMIN_PAGE_SIZE,
  useAdminDirectory,
  useDirectoryDuplicates,
  useDirectoryMutations,
  useSyncRuns,
  type AdminDirectoryFilters,
} from "@/lib/useDirectoryAdmin";

const SELECT_CLASS =
  "h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring";

const TABS = ["listings", "sync", "duplicates"] as const;
type Tab = (typeof TABS)[number];

function dateTime(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

/** Admin control room for the Mumbai discovery directory. */
export function AdminDirectoryPanel() {
  const [tab, setTab] = useState<Tab>("listings");
  const [filters, setFilters] = useState<AdminDirectoryFilters>({
    term: "",
    type: "all",
    area: "",
    source: "all",
    page: 1,
  });

  const { data, isLoading, isError } = useAdminDirectory(filters);
  const { data: runs } = useSyncRuns();
  const { data: duplicates } = useDirectoryDuplicates();
  const { setStatus, setVerified, sync } = useDirectoryMutations();

  const providerFn = useServerFn(directoryProviderState);
  const { data: provider } = useQuery({
    queryKey: ["directory-provider-state"],
    queryFn: () => providerFn(),
    staleTime: 60_000,
  });

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));

  function patch(update: Partial<AdminDirectoryFilters>) {
    setFilters((prev) => ({ ...prev, ...update, page: update.page ?? 1 }));
  }

  async function runSync(incremental: boolean) {
    try {
      const result = await sync.mutateAsync({ incremental });
      if (result.status === "not_configured") {
        toast.error("Directory provider is not configured yet.");
      } else if (result.status === "failed") {
        toast.error(result.error ?? "Sync failed.");
      } else {
        toast.success(
          `Sync complete — ${result.created} added, ${result.updated} updated, ${result.skipped} skipped.`,
        );
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sync failed.");
    }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Business directory</h1>
        <p className="text-sm text-muted-foreground">
          Mumbai discovery listings imported from the business-data provider, plus every Table Rush
          registered venue.
        </p>
      </header>

      <div
        className={`surface-card p-5 ${provider?.configured ? "" : "border-primary/40"}`}
        role="status"
      >
        {provider?.configured ? (
          <p className="text-sm">
            Provider connected: <strong>{provider.provider}</strong>. Sync pulls Mumbai restaurants
            and cafés and updates existing records; it is not real-time.
          </p>
        ) : (
          <div className="space-y-2 text-sm">
            <p className="font-medium">Business directory provider is not connected yet.</p>
            <p className="text-muted-foreground">
              Add these server-side settings to enable imports. Keys stay on the server and are never
              sent to the browser.
            </p>
            <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
              <li>
                <code>BUSINESS_DATA_API_URL</code> — provider search endpoint (required)
              </li>
              <li>
                <code>BUSINESS_DATA_API_KEY</code> — provider API key (required)
              </li>
              <li>
                <code>BUSINESS_DATA_PROVIDER</code> — provider label shown here (optional)
              </li>
            </ul>
            <p className="text-muted-foreground">
              Until then, customer discovery shows an empty state instead of invented listings.
            </p>
          </div>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" onClick={() => void runSync(false)} disabled={sync.isPending}>
            {sync.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            Run full import
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => void runSync(true)}
            disabled={sync.isPending}
          >
            Incremental sync
          </Button>
        </div>
      </div>

      <div className="flex gap-1 rounded-xl bg-muted p-1" role="tablist">
        {TABS.map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium capitalize transition-colors ${
              tab === value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            {value === "sync" ? "Sync history" : value}
          </button>
        ))}
      </div>

      {tab === "listings" ? (
        <>
          <div className="surface-card grid gap-3 p-4 lg:grid-cols-4">
            <label className="space-y-1.5 lg:col-span-2">
              <span className="text-xs font-medium text-muted-foreground">Search by name</span>
              <div className="relative">
                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={filters.term}
                  onChange={(event) => patch({ term: event.target.value })}
                  placeholder="Business name"
                  className="pl-9"
                />
              </div>
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">Type</span>
              <select
                className={SELECT_CLASS}
                value={filters.type}
                onChange={(event) =>
                  patch({ type: event.target.value as AdminDirectoryFilters["type"] })
                }
              >
                <option value="all">All</option>
                <option value="restaurant">Restaurants</option>
                <option value="cafe">Cafés</option>
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">Area</span>
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
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">Source</span>
              <select
                className={SELECT_CLASS}
                value={filters.source}
                onChange={(event) =>
                  patch({ source: event.target.value as AdminDirectoryFilters["source"] })
                }
              >
                <option value="all">All sources</option>
                <option value="table_rush">Table Rush registered</option>
                <option value="external_provider">Discovery (provider)</option>
              </select>
            </label>
          </div>

          {isLoading ? (
            <div className="flex min-h-40 items-center justify-center">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : isError ? (
            <EmptyState
              icon={Store}
              title="We couldn't load the directory"
              description="Please refresh and try again."
            />
          ) : rows.length === 0 ? (
            <EmptyState
              icon={Store}
              title="No listings yet"
              description={
                provider?.configured
                  ? "Run an import to pull Mumbai restaurants and cafés from the provider."
                  : "Connect the business directory provider to import Mumbai listings."
              }
            />
          ) : (
            <>
              <p className="text-sm text-muted-foreground">{total} records</p>
              <div className="space-y-3">
                {rows.map((row) => (
                  <article key={row.id} className="surface-card p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="font-semibold break-words">{row.business_name}</h2>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {row.business_type === "cafe" ? "Café" : "Restaurant"} ·{" "}
                          {row.area ?? "Area unknown"} · {row.city ?? "Mumbai"}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Source: {row.source === "table_rush" ? "Table Rush" : "Provider"}
                          {row.source_place_id ? ` · ID ${row.source_place_id}` : ""} · Updated{" "}
                          {dateTime(row.updated_at)}
                          {row.last_synced_at ? ` · Synced ${dateTime(row.last_synced_at)}` : ""}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold tracking-[0.14em] uppercase">
                        <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
                          {row.status}
                        </span>
                        {row.table_rush_registered ? (
                          <span className="rounded-full bg-ink px-2.5 py-1 text-primary">
                            Registered
                          </span>
                        ) : (
                          <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
                            Listing only
                          </span>
                        )}
                        {row.verified ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-emerald-700">
                            <BadgeCheck className="size-3" /> Verified
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {row.status === "active" ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={setStatus.isPending}
                          onClick={() =>
                            setStatus.mutate(
                              { id: row.id, status: "inactive" },
                              { onError: (e) => toast.error(e.message) },
                            )
                          }
                        >
                          Deactivate
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          disabled={setStatus.isPending}
                          onClick={() =>
                            setStatus.mutate(
                              { id: row.id, status: "active" },
                              { onError: (e) => toast.error(e.message) },
                            )
                          }
                        >
                          Activate
                        </Button>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={setVerified.isPending}
                        onClick={() =>
                          setVerified.mutate(
                            { id: row.id, verified: !row.verified },
                            { onError: (e) => toast.error(e.message) },
                          )
                        }
                      >
                        {row.verified ? "Remove verified mark" : "Mark verified"}
                      </Button>
                    </div>
                  </article>
                ))}
              </div>

              {pages > 1 ? (
                <nav className="flex items-center justify-between gap-3" aria-label="Pagination">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={filters.page <= 1}
                    onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}
                  >
                    Previous
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
                    Next
                  </Button>
                </nav>
              ) : null}
            </>
          )}
        </>
      ) : null}

      {tab === "sync" ? (
        (runs ?? []).length === 0 ? (
          <EmptyState
            icon={RefreshCw}
            title="No sync runs yet"
            description="Every import — including failures and unconfigured attempts — is recorded here."
          />
        ) : (
          <div className="space-y-3">
            {(runs ?? []).map((run) => (
              <article key={run.id} className="surface-card p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium capitalize">
                    {run.trigger} · {run.status.replace("_", " ")}
                  </p>
                  <p className="text-xs text-muted-foreground">{dateTime(run.started_at)}</p>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {run.fetched} fetched · {run.created_count} added · {run.updated_count} updated ·{" "}
                  {run.skipped_count} skipped · {run.areas.length} areas
                </p>
                {run.error_message ? (
                  <p className="mt-2 flex items-start gap-2 rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive">
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                    {run.error_message}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        )
      ) : null}

      {tab === "duplicates" ? (
        (duplicates ?? []).length === 0 ? (
          <EmptyState
            icon={Copy}
            title="No duplicate listings found"
            description="Records sharing a name and area would be grouped here for review."
          />
        ) : (
          <div className="space-y-3">
            {(duplicates ?? []).map((group) => (
              <article key={group.key} className="surface-card p-4 text-sm">
                <p className="font-medium">{group.rows[0]?.business_name}</p>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {group.rows.map((row) => (
                    <li key={row.id}>
                      {row.source === "table_rush" ? "Table Rush" : "Provider"} ·{" "}
                      {row.area ?? "Area unknown"} · {row.status}
                      {row.source_place_id ? ` · ID ${row.source_place_id}` : ""}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        )
      ) : null}
    </div>
  );
}
