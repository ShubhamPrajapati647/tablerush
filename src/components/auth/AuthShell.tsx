import { Link } from "@tanstack/react-router";
import { UtensilsCrossed } from "lucide-react";
import type { ReactNode } from "react";

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-ink text-primary">
            <UtensilsCrossed className="size-5" />
          </span>
          <span className="font-display text-sm font-semibold tracking-[0.18em] uppercase">
            Table Rush
          </span>
        </Link>
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
          Back to site
        </Link>
      </header>

      <main className="flex flex-1 items-start justify-center px-4 pt-4 pb-16">
        <div className="w-full max-w-md">
          <div className="surface-card p-7">
            <p className="eyebrow">{eyebrow}</p>
            <h1 className="mt-2 text-2xl font-semibold">{title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
            <div className="mt-6">{children}</div>
          </div>
          {footer ? <div className="mt-5 text-center text-sm">{footer}</div> : null}
        </div>
      </main>
    </div>
  );
}
