/**
 * Directory synchronisation.
 *
 * Pulls Mumbai restaurant/café records from the configured licensed
 * business-data provider and upserts them into `businesses` as
 * source = 'external_provider'. Nothing here invents data: when the provider is
 * not configured the run is recorded as "not_configured" and the app keeps
 * showing its empty state.
 *
 * Matching key is (source, source_place_id), so repeated runs update existing
 * records instead of creating duplicates. Every run is logged in
 * directory_sync_runs, which only admins can read.
 */
import { fetchProviderArea, providerConfig } from "@/lib/directory-provider.server";
import { MUMBAI_AREAS } from "@/lib/mumbai";

export type SyncResult = {
  status: "completed" | "not_configured" | "failed";
  provider: string;
  areas: string[];
  fetched: number;
  created: number;
  updated: number;
  skipped: number;
  error: string | null;
  run_id: string | null;
};

export type SyncOptions = {
  /** "manual" | "scheduled" | "initial-import" */
  trigger: string;
  /** Defaults to every supported Mumbai area. */
  areas?: string[];
  /** Ask the provider only for records changed since the last completed run. */
  incremental?: boolean;
};

/** Areas per run are capped so one call cannot fan out unbounded. */
const MAX_AREAS = 60;

export async function runDirectorySync(options: SyncOptions): Promise<SyncResult> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const config = providerConfig();

  const areas = (options.areas?.length ? options.areas : MUMBAI_AREAS)
    .map((area) => area.trim())
    .filter(Boolean)
    .slice(0, MAX_AREAS);

  const base = {
    trigger: options.trigger,
    provider: config.provider,
    areas,
    fetched: 0,
    created_count: 0,
    updated_count: 0,
    skipped_count: 0,
  };

  if (!config.configured) {
    const message =
      "Business data provider is not configured. Set BUSINESS_DATA_API_URL and BUSINESS_DATA_API_KEY to enable directory sync.";
    const { data } = await supabaseAdmin
      .from("directory_sync_runs")
      .insert({
        ...base,
        status: "not_configured",
        error_message: message,
        finished_at: new Date().toISOString(),
      })
      .select("id")
      .maybeSingle();

    return {
      status: "not_configured",
      provider: config.provider,
      areas,
      fetched: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      error: message,
      run_id: data?.id ?? null,
    };
  }

  const { data: run } = await supabaseAdmin
    .from("directory_sync_runs")
    .insert({ ...base, status: "running" })
    .select("id")
    .maybeSingle();
  const runId = run?.id ?? null;

  let updatedSince: string | null = null;
  if (options.incremental) {
    const { data: previous } = await supabaseAdmin
      .from("directory_sync_runs")
      .select("finished_at")
      .eq("status", "completed")
      .not("finished_at", "is", null)
      .order("finished_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    updatedSince = previous?.finished_at ?? null;
  }

  let fetched = 0;
  let created = 0;
  let updated = 0;
  let skipped = 0;

  try {
    for (const area of areas) {
      const records = await fetchProviderArea(area, updatedSince);
      fetched += records.length;

      for (const record of records) {
        if (!/mumbai/i.test(record.city)) {
          skipped += 1;
          continue;
        }

        const { data: existing } = await supabaseAdmin
          .from("businesses")
          .select("id, owner_id")
          .eq("source", "external_provider")
          .eq("source_place_id", record.source_place_id)
          .maybeSingle();

        const now = new Date().toISOString();

        if (existing) {
          // Never overwrite a Table Rush owner's own details with provider data.
          const patch = existing.owner_id
            ? {
                area: record.area,
                latitude: record.latitude,
                longitude: record.longitude,
                source_url: record.source_url,
                last_synced_at: now,
                updated_at: now,
              }
            : {
                business_type: record.business_type,
                business_name: record.business_name,
                description: record.description,
                address: record.address,
                area: record.area,
                city: record.city,
                state: record.state,
                pincode: record.pincode,
                latitude: record.latitude,
                longitude: record.longitude,
                phone: record.phone,
                website_url: record.website_url,
                cuisine: record.cuisine,
                cafe_type: record.cafe_type,
                business_category: record.business_category,
                opening_time: record.opening_time,
                closing_time: record.closing_time,
                cover_image_url: record.cover_image_url,
                source_url: record.source_url,
                last_synced_at: now,
                updated_at: now,
              };

          const { error } = await supabaseAdmin
            .from("businesses")
            .update(patch)
            .eq("id", existing.id);
          if (error) {
            skipped += 1;
            continue;
          }
          updated += 1;
          continue;
        }

        const { error } = await supabaseAdmin.from("businesses").insert({
          ...record,
          owner_id: null,
          status: "active",
          source: "external_provider",
          verified: false,
          table_rush_registered: false,
          last_synced_at: now,
        });

        if (error) {
          skipped += 1;
          continue;
        }
        created += 1;
      }
    }

    if (runId) {
      await supabaseAdmin
        .from("directory_sync_runs")
        .update({
          status: "completed",
          fetched,
          created_count: created,
          updated_count: updated,
          skipped_count: skipped,
          finished_at: new Date().toISOString(),
        })
        .eq("id", runId);
    }

    return {
      status: "completed",
      provider: config.provider,
      areas,
      fetched,
      created,
      updated,
      skipped,
      error: null,
      run_id: runId,
    };
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Directory sync failed";
    if (runId) {
      await supabaseAdmin
        .from("directory_sync_runs")
        .update({
          status: "failed",
          fetched,
          created_count: created,
          updated_count: updated,
          skipped_count: skipped,
          error_message: message.slice(0, 1000),
          finished_at: new Date().toISOString(),
        })
        .eq("id", runId);
    }

    return {
      status: "failed",
      provider: config.provider,
      areas,
      fetched,
      created,
      updated,
      skipped,
      error: message,
      run_id: runId,
    };
  }
}
