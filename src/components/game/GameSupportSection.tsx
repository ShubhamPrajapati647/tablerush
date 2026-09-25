import { DashboardHeading } from "@/components/dashboard/DashboardShell";
import { GameSupportContent } from "@/components/game/GameSupportContent";

/** Game support inside a dashboard (business or admin). */
export function GameSupportSection({ audience }: { audience: "business" | "admin" }) {
  return (
    <>
      <DashboardHeading
        title="Game support"
        description="How the Table Rush game works, and what you'll be able to control."
      />
      <GameSupportContent audience={audience} />
    </>
  );
}
