import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

const BUCKET = "business-logos";

/** Uploads a logo into the owner's own folder and returns its storage path. */
export async function uploadLogo(userId: string, file: File): Promise<string> {
  const extension = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `${userId}/logo-${Date.now()}.${extension}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true });
  if (error) throw error;
  return path;
}

/** A temporary viewable URL for a stored logo path. */
export function useLogoUrl(path: string | null | undefined) {
  return useQuery({
    queryKey: ["logo-url", path],
    enabled: Boolean(path),
    staleTime: 1000 * 60 * 30,
    queryFn: async (): Promise<string | null> => {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(path!, 60 * 60 * 24);
      if (error) return null;
      return data?.signedUrl ?? null;
    },
  });
}
