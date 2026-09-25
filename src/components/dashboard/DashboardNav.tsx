import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";

import { SECTIONS } from "@/lib/dashboard-sections";

const linkClass =
  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";
const activeClass = "bg-sidebar-accent text-sidebar-primary";

function NavRow({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <>
      <Icon className="size-4 shrink-0" />
      {label}
    </>
  );
}

const BUSINESS_SECTIONS = [
  "orders",
  "tables",
  "qr-codes",
  "menu",
  "payments",
  "customers",
  "reports",
  "game-support",
  "contact",
  "settings",
] as const;

const ADMIN_SECTIONS = [
  "restaurants",
  "cafes",
  "business-directory",
  "orders",
  "customers",
  "payments",
  "reports",
  "game-support",
  "contact",
  "settings",
] as const;

export function RestaurantNav() {
  const home = SECTIONS["home"]!;
  return (
    <>
      <Link
        to="/restaurant/dashboard"
        className={linkClass}
        activeOptions={{ exact: true }}
        activeProps={{ className: `${linkClass} ${activeClass}` }}
      >
        <NavRow icon={home.icon} label="Home" />
      </Link>
      {BUSINESS_SECTIONS.map((slug) => {
        const section = SECTIONS[slug]!;
        return (
          <Link
            key={slug}
            to="/restaurant/dashboard/$section"
            params={{ section: slug }}
            className={linkClass}
            activeProps={{ className: `${linkClass} ${activeClass}` }}
          >
            <NavRow icon={section.icon} label={section.label} />
          </Link>
        );
      })}
    </>
  );
}

export function CafeNav() {
  const home = SECTIONS["home"]!;
  return (
    <>
      <Link
        to="/cafe/dashboard"
        className={linkClass}
        activeOptions={{ exact: true }}
        activeProps={{ className: `${linkClass} ${activeClass}` }}
      >
        <NavRow icon={home.icon} label="Home" />
      </Link>
      {BUSINESS_SECTIONS.map((slug) => {
        const section = SECTIONS[slug]!;
        return (
          <Link
            key={slug}
            to="/cafe/dashboard/$section"
            params={{ section: slug }}
            className={linkClass}
            activeProps={{ className: `${linkClass} ${activeClass}` }}
          >
            <NavRow icon={section.icon} label={section.label} />
          </Link>
        );
      })}
    </>
  );
}

export function AdminNav() {
  const home = SECTIONS["home"]!;
  return (
    <>
      <Link
        to="/admin/dashboard"
        className={linkClass}
        activeOptions={{ exact: true }}
        activeProps={{ className: `${linkClass} ${activeClass}` }}
      >
        <NavRow icon={home.icon} label="Home" />
      </Link>
      {ADMIN_SECTIONS.map((slug) => {
        const section = SECTIONS[slug]!;
        return (
          <Link
            key={slug}
            to="/admin/dashboard/$section"
            params={{ section: slug }}
            className={linkClass}
            activeProps={{ className: `${linkClass} ${activeClass}` }}
          >
            <NavRow icon={section.icon} label={section.label} />
          </Link>
        );
      })}
    </>
  );
}
