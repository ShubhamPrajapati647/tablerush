import { FileQuestion } from "lucide-react";

import { DashboardHeading } from "@/components/dashboard/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { getSection } from "@/lib/dashboard-sections";

/** Renders a dashboard section with its empty state. No placeholder data. */
export function SectionPage({ slug }: { slug: string }) {
  const section = getSection(slug);

  if (!section) {
    return (
      <>
        <DashboardHeading title="Section not found" description="This page doesn't exist yet." />
        <EmptyState
          icon={FileQuestion}
          title="Nothing here"
          description="Pick a section from the menu on the left."
        />
      </>
    );
  }

  return (
    <>
      <DashboardHeading title={section.title} description={section.description} />
      <EmptyState
        icon={section.icon}
        title={section.emptyTitle}
        description={section.emptyDescription}
      />
    </>
  );
}
