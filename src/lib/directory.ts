import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { BusinessType } from "@/lib/roles";

export type DirectoryRow = Database["public"]["Functions"]["search_directory"]["Returns"][number];

export type DirectorySort = "name" | "distance" | "recent";

export type DirectoryQuery = {
  term: string;
  type: BusinessType | "all";
  area: string;
  cuisine: string;
  openNow: boolean;
  tableRushOnly: boolean;
  sort: DirectorySort;
  page: number;
};

export const PAGE_SIZE = 12;

export const EMPTY_QUERY: DirectoryQuery = {
  term: "",
  type: "all",
  area: "",
  cuisine: "",
  openNow: false,
  tableRushOnly: false,
  sort: "name",
  page: 1,
};

export const DIRECTORY_EMPTY_MESSAGE =
  "Restaurant and café discovery data will appear here once the business directory provider is connected.";

export type Coords = { lat: number; lng: number };

/** Drops undefined keys so exactOptionalPropertyTypes-safe RPC args are produced. */
function rpcArgs<T extends object>(args: Record<string, unknown>): T {
  return Object.fromEntries(
    Object.entries(args).filter(([, value]) => value !== undefined),
  ) as unknown as T;
}

type SearchArgs = Database["public"]["Functions"]["search_directory"]["Args"];
type AreasArgs = Database["public"]["Functions"]["directory_areas"]["Args"];

/**
 * Server-side search: the database does the filtering, sorting, distance maths
 * and pagination, so the browser never loads every Mumbai business.
 */
export function useDirectorySearch(query: DirectoryQuery, coords: Coords | null) {
  return useQuery({
    queryKey: ["directory-search", query, coords],
    queryFn: async (): Promise<{ rows: DirectoryRow[]; total: number }> => {
      const { data, error } = await supabase.rpc(
        "search_directory",
        rpcArgs<SearchArgs>({
          _term: query.term.trim() || undefined,
          _type: query.type === "all" ? undefined : query.type,
          _area: query.area || undefined,
          _cuisine: query.cuisine || undefined,
          _open_now: query.openNow,
          _table_rush: query.tableRushOnly,
          _sort: query.sort,
          _lat: coords?.lat,
          _lng: coords?.lng,
          _limit: PAGE_SIZE,
          _offset: (query.page - 1) * PAGE_SIZE,
        }),
      );
      if (error) throw error;
      const rows = (data ?? []) as DirectoryRow[];
      return { rows, total: Number(rows[0]?.total_count ?? 0) };
    },
  });
}

/** Areas that actually have listings, for the Mumbai area selector. */
export function useDirectoryAreas(type: BusinessType | "all") {
  return useQuery({
    queryKey: ["directory-areas", type],
    queryFn: async (): Promise<{ area: string; venue_count: number }[]> => {
      const { data, error } = await supabase.rpc(
        "directory_areas",
        rpcArgs<AreasArgs>({ _type: type === "all" ? undefined : type }),
      );
      if (error) throw error;
      return (data ?? []).map((row) => ({
        area: row.area ?? "",
        venue_count: Number(row.venue_count ?? 0),
      }));
    },
  });
}

export type DirectoryBusiness = Database["public"]["Views"]["public_directory"]["Row"];

/** One listing for the public business details page. */
export function useDirectoryBusiness(id: string) {
  return useQuery({
    queryKey: ["directory-business", id],
    queryFn: async (): Promise<DirectoryBusiness | null> => {
      const { data, error } = await supabase
        .from("public_directory")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data ?? null;
    },
  });
}

export function formatDistance(km: number | null): string | null {
  if (km === null || Number.isNaN(km)) return null;
  if (km < 1) return `${Math.round(km * 1000)} m away`;
  return `${km.toFixed(km < 10 ? 1 : 0)} km away`;
}

/** Optional geolocation: never requested until the customer asks for it. */
export function useOptionalLocation() {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [state, setState] = useState<"idle" | "asking" | "granted" | "denied">("idle");

  useEffect(() => {
    if (state !== "asking") return;
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState("denied");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        setState("granted");
      },
      () => setState("denied"),
      { timeout: 10_000 },
    );
  }, [state]);

  return {
    coords,
    state,
    request: () => setState("asking"),
    clear: () => {
      setCoords(null);
      setState("idle");
    },
  };
}
