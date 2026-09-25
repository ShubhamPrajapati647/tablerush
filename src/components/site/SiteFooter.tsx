import { Link } from "@tanstack/react-router";
import { UtensilsCrossed } from "lucide-react";

const COLUMNS = [
  {
    title: "Discover",
    links: [
      { label: "Restaurants", to: "/restaurants" },
      { label: "Cafés", to: "/cafes" },
      { label: "How it works", to: "/how-it-works" },
      { label: "Table Rush game", to: "/game" },
    ],
  },
  {
    title: "For business",
    links: [
      { label: "For restaurants", to: "/for-restaurants" },
      { label: "For cafés", to: "/for-cafes" },
      { label: "Restaurant login", to: "/restaurant/login" },
      { label: "Café login", to: "/cafe/login" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Customer login", to: "/login" },
      { label: "Create account", to: "/signup" },
      { label: "My orders", to: "/customer/orders" },
      { label: "Contact", to: "/contact" },
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-ink text-ink-foreground">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <UtensilsCrossed className="size-5" />
            </span>
            <span className="font-display text-base font-semibold tracking-[0.18em] uppercase">
              Table Rush
            </span>
          </div>
          <p className="mt-4 text-sm text-ink-foreground/70">
            Turn Every Table Into an Experience. Discover. Order. Play. Enjoy.
          </p>
        </div>

        {COLUMNS.map((column) => (
          <div key={column.title}>
            <h3 className="text-sm font-semibold">{column.title}</h3>
            <ul className="mt-4 space-y-2.5">
              {column.links.map((link) => (
                <li key={link.to + link.label}>
                  <Link
                    to={link.to}
                    className="text-sm text-ink-foreground/70 transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-ink-foreground/10">
        <div className="mx-auto max-w-6xl px-4 py-6 text-xs text-ink-foreground/60 lg:px-8">
          © {new Date().getFullYear()} Table Rush. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
