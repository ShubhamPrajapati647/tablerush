import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { homePathForRoles, type AppRole } from "@/lib/roles";

function Message({ tone, children }: { tone: "error" | "success"; children: string }) {
  return (
    <p
      className={`rounded-xl px-3 py-2.5 text-sm ${
        tone === "error"
          ? "bg-destructive/10 text-destructive"
          : "bg-primary/15 text-primary-foreground"
      }`}
    >
      {children}
    </p>
  );
}

/** Email + password sign in. Redirect target comes from the account's roles. */
export function LoginForm({ expectedRoles }: { expectedRoles?: AppRole[] }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { refresh } = useAuth();

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError || !data.user) {
      setError(signInError?.message ?? "Could not sign in.");
      setBusy(false);
      return;
    }

    const { data: roleRows } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id);
    const roles = (roleRows ?? []).map((row) => row.role as AppRole);

    if (expectedRoles && !roles.some((role) => expectedRoles.includes(role))) {
      await supabase.auth.signOut();
      setError("This account can't sign in here. Use the sign-in page for your account type.");
      setBusy(false);
      return;
    }

    await refresh();
    void navigate({ to: homePathForRoles(roles), replace: true });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error ? <Message tone="error">{error}</Message> : null}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : "Sign in"}
      </Button>
    </form>
  );
}

/**
 * Sign up for customers and business owners. The role is stored in the auth
 * user's metadata and validated server-side by a database trigger, so an
 * admin role can never be requested from a public form.
 */
export function SignupForm({
  role,
  businessLabel,
}: {
  role: Extract<AppRole, "customer" | "restaurant_owner" | "cafe_owner">;
  businessLabel?: string;
}) {
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { refresh } = useAuth();

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          full_name: fullName.trim(),
          phone: phone.trim(),
          role,
          business_name: businessName.trim() || null,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setBusy(false);
      return;
    }

    if (!data.session) {
      setNotice("Check your email to confirm your account, then sign in.");
      setBusy(false);
      return;
    }

    await refresh();
    void navigate({ to: homePathForRoles([role]), replace: true });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error ? <Message tone="error">{error}</Message> : null}
      {notice ? <Message tone="success">{notice}</Message> : null}

      <div className="space-y-2">
        <Label htmlFor="fullName">{businessLabel ? "Owner name" : "Full name"}</Label>
        <Input
          id="fullName"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
      </div>

      {businessLabel ? (
        <div className="space-y-2">
          <Label htmlFor="businessName">{businessLabel}</Label>
          <Input
            id="businessName"
            required
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
          />
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="signupEmail">Email</Label>
        <Input
          id="signupEmail"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          type="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="signupPassword">Password</Label>
        <Input
          id="signupPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : "Create account"}
      </Button>
    </form>
  );
}
