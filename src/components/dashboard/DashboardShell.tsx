import { useNavigate } from "@tanstack/react-router";
import { LogOut, Menu, UtensilsCrossed, X } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export function DashboardShell({
  workspace,
  subtitle,
  nav,
  children,
}: {
  workspace: string;
  subtitle: string;
  nav: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    void navigate({ to: "/", replace: true });
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground lg:static lg:flex ${
          open ? "flex" : "hidden"
        }`}
      >
        <div className="flex items-center gap-2 px-5 py-5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
            <UtensilsCrossed className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-semibold">{workspace}</p>
            <p className="truncate text-xs text-sidebar-foreground/60">{subtitle}</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-6" onClick={() => setOpen(false)}>
          {nav}
        </nav>
        <div className="border-t border-sidebar-border px-4 py-4">
          <p className="truncate text-xs text-sidebar-foreground/60">
            {profile?.full_name || user?.email}
          </p>
          <button
            type="button"
            onClick={handleSignOut}
            className="mt-2 inline-flex items-center gap-2 text-sm text-sidebar-foreground/80 hover:text-sidebar-primary"
          >
            <LogOut className="size-4" /> Log out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-3 border-b border-border px-4 lg:hidden">
          <Button variant="outline" size="icon" onClick={() => setOpen((v) => !v)}>
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
          <span className="font-display text-sm font-semibold">{workspace}</span>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 lg:px-8 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}

export function DashboardHeading({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold sm:text-3xl">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}
