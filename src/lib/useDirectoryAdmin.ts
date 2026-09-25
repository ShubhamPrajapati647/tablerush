import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { syncDirectory } from "@/lib/directory.functions";

export type AdminDirectoryRow = {
  id: string;
  business_name: string;
  business_type: Database["public"]["Enums"]["business_type"];
  status: Database["public"]["Enums"]["business_status"];
  area: string | null;
  city: string | null;
  source: Database["public"]["Enums"]["business_source"];
  source_place_id: string | null;
  normalized_name: string | null;
  verified: boolean;
  table_rush_registered: boolean;
  last_synced_at: string | null;
  updated_at: string;
};

const COLUMNS =
  "id, business_name, business_type, status, area, city, source, source_place_id, normalized_name, verified, table_rush_registered, last_synced_at, updated_at";

export const ADMIN_PAGE_SIZE = 20;

export type AdminDirectoryFilters = {
  term: string;
  type: "all" | Database["public"]["Enums"]["business_type"];
  area: string;
  source: "all" | Database["public"]["Enums"]["business_source"];
  page: number;
};

/** Admin-side listing straight from the businesses table (admins pass RLS). */
export function useAdminDirectory(filters: AdminDirectoryFilters) {
  return useQuery({
    queryKey: ["admin-directory", filters],
    queryFn: async (): Promise<{ rows: AdminDirectoryRow[]; total: number }> => {
      let query = supabase
        .from("businesses")
        .select(COLUMNS, { count: "exact" })
        .order("updated_at", { ascending: false })
        .range((filters.page - 1) * ADMIN_PAGE_SIZE, filters.page * ADMIN_PAGE_SIZE - 1);

      const term = filters.term.trim();
      if (term) query = query.ilike("business_name", `%${term}%`);
      if (filters.type !== "all") query = query.eq("business_type", filters.type);
      if (filters.area) query = query.eq("area", filters.area);
      if (filters.source !== "all") query = query.eq("source", filters.source);

      const { data, error, count } = await query;
      if (error) throw error;
      return { rows: (data ?? []) as AdminDirectoryRow[], total: count ?? 0 };
    },
  });
}

export type SyncRun = Database["public"]["Tables"]["directory_sync_runs"]["Row"];

/** Sync history, including failures and "not configured" runs. */
export function useSyncRuns() {
  return useQuery({
    queryKey: ["directory-sync-runs"],
    queryFn: async (): Promise<SyncRun[]> => {
      const { data, error } = await supabase
        .from("directory_sync_runs")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(15);
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Listings that share a normalised name and area — possible duplicates. */
export function useDirectoryDuplicates() {
  return useQuery({
    queryKey: ["directory-duplicates"],
    queryFn: async (): Promise<{ key: string; rows: AdminDirectoryRow[] }[]> => {
      const { data, error } = await supabase
        .from("businesses")
        .select(COLUMNS)
        .order("normalized_name")
        .limit(1000);
      if (error) throw error;

      const groups = new Map<string, AdminDirectoryRow[]>();
      for (const row of (data ?? []) as AdminDirectoryRow[]) {
        const key = `${row.normalized_name ?? row.business_name.toLowerCase()}|${(row.area ?? "").toLowerCase()}`;
        groups.set(key, [...(groups.get(key) ?? []), row]);
      }
      return Array.from(groups.entries())
        .filter(([, rows]) => rows.length > 1)
        .map(([key, rows]) => ({ key, rows }));
    },
  });
}

export function useDirectoryMutations() {
  const client = useQueryClient();
  const runSync = useServerFn(syncDirectory);

  const invalidate = () => {
    void client.invalidateQueries({ queryKey: ["admin-directory"] });
    void client.invalidateQueries({ queryKey: ["directory-sync-runs"] });
    void client.invalidateQueries({ queryKey: ["directory-duplicates"] });
    void client.invalidateQueries({ queryKey: ["directory-search"] });
  };

  const setStatus = useMutation({
    mutationFn: async (input: {
      id: string;
      status: Database["public"]["Enums"]["business_status"];
    }) => {
      const { error } = await supabase
        .from("businesses")
        .update({ status: input.status })
        .eq("id", input.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });

  const setVerified = useMutation({
    mutationFn: async (input: { id: string; verified: boolean }) => {
      const { error } = await supabase
        .from("businesses")
        .update({ verified: input.verified })
        .eq("id", input.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });

  const sync = useMutation({
    mutationFn: async (input: { areas?: string[]; incremental?: boolean }) =>
      runSync({ data: input }),
    onSuccess: invalidate,
  });

  return { setStatus, setVerified, sync };
}
