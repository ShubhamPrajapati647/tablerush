import { Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect, type ReactNode } from "react";

import { useAuth } from "@/lib/auth";
import { homePathForRoles, type AppRole } from "@/lib/roles";

/**
 * Client-side gate for private areas. The real protection lives in the
 * database (Row Level Security) — this only controls what the UI shows.
 */
export function RoleGuard({
  allow,
  loginPath,
  children,
}: {
  allow: AppRole[];
  loginPath: string;
  children: ReactNode;
}) {
  const { loading, user, roles } = useAuth();
  const navigate = useNavigate();
  const permitted = roles.some((role) => allow.includes(role));

  useEffect(() => {
    if (!loading && !user) {
      void navigate({ to: loginPath, replace: true });
    }
  }, [loading, user, loginPath, navigate]);

  if (loading || (!user && typeof window !== "undefined")) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!permitted) {
    const ownHome = homePathForRoles(roles);
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="surface-card max-w-md p-8 text-center">
          <h1 className="text-xl font-semibold">This area isn't available for your account</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account doesn't have access to this workspace. Go to your own workspace, or sign in
            with the right account.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to={ownHome}
              className="inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              Go to my workspace
            </Link>
            <Link
              to={loginPath}
              className="inline-flex rounded-full border border-input px-5 py-2.5 text-sm font-semibold"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
