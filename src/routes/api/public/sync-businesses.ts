import { createFileRoute } from "@tanstack/react-router";

/**
 * Scheduled directory sync endpoint.
 *
 * Callers must present the scheduler bearer secret; there is no public access.
 * Provider credentials stay server-side, and when they are missing the run is
 * recorded as "not configured" instead of inventing listings.
 *
 * POST body (optional): { "areas": ["Bandra West"], "incremental": true }
 */
export const Route = createFileRoute("/api/public/sync-businesses")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { authenticateCronRequest } = await import("@/integrations/supabase/cron-auth");
        const denied = await authenticateCronRequest(request);
        if (denied) return denied;

        let body: { areas?: unknown; incremental?: unknown } = {};
        try {
          const text = await request.text();
          if (text.trim()) body = JSON.parse(text) as typeof body;
        } catch {
          return new Response("Invalid payload", { status: 400 });
        }

        const areas = Array.isArray(body.areas)
          ? body.areas.map((area) => String(area).slice(0, 80)).filter(Boolean)
          : undefined;

        const { runDirectorySync } = await import("@/lib/directory-sync.server");
        const result = await runDirectorySync({
          trigger: "scheduled",
          ...(areas && areas.length ? { areas } : {}),
          incremental: body.incremental !== false,
        });

        return new Response(JSON.stringify(result), {
          status: result.status === "failed" ? 502 : 200,
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});
