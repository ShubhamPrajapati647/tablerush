import { UtensilsCrossed } from "lucide-react";

import { useLogoUrl } from "@/lib/logo";

export function ItemImage({
  path,
  alt,
  className = "",
}: {
  path: string | null | undefined;
  alt: string;
  className?: string;
}) {
  const { data: url } = useLogoUrl(path);
  return (
    <span
      className={`flex items-center justify-center overflow-hidden rounded-2xl border border-border bg-cream ${className}`}
    >
      {url ? (
        <img src={url} alt={alt} className="size-full object-cover" />
      ) : (
        <UtensilsCrossed className="size-6 text-muted-foreground" />
      )}
    </span>
  );
}
