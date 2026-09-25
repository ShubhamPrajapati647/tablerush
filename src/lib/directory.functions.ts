import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { SyncResult } from "@/lib/directory-sync.server";

export type DirectoryProviderState = {
  configured: boolean;
  provider: string;
  /** Env var names an admin must set; never the values. */
  required_env: string[];
};

/**
 * Whether a directory provider is configured. Returns booleans and env var
 * names only — provider keys never leave the server.
 */
export const directoryProviderState = createServerFn({ method: "GET" }).handler(
  async (): Promise<DirectoryProviderState> => {
    const { providerConfig } = await import("@/lib/directory-provider.server");
    const config = providerConfig();
    return {
      configured: config.configured,
      provider: config.provider,
      required_env: ["BUSINESS_DATA_API_URL", "BUSINESS_DATA_API_KEY", "BUSINESS_DATA_PROVIDER"],
    };
  },
);

type SyncInput = { areas?: string[]; incremental?: boolean };

/** Admin-triggered directory sync. */
export const syncDirectory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown): SyncInput => {
    const input = (data ?? {}) as { areas?: unknown; incremental?: unknown };
    const areas = Array.isArray(input.areas)
      ? input.areas.map((area) => String(area).slice(0, 80)).filter(Boolean)
      : undefined;
    return {
      ...(areas && areas.length ? { areas } : {}),
      incremental: input.incremental === true,
    };
  })
  .handler(async ({ data, context }): Promise<SyncResult> => {
    const { data: isAdmin, error } = await context.supabase.rpc("is_admin", {
      _user_id: context.userId,
    });
    if (error) throw new Error(error.message);
    if (!isAdmin) throw new Error("Only Table Rush admins can run a directory sync.");

    const { runDirectorySync } = await import("@/lib/directory-sync.server");
    return runDirectorySync({
      trigger: "manual",
      ...(data.areas ? { areas: data.areas } : {}),
      ...(data.incremental ? { incremental: true } : {}),
    });
  });
