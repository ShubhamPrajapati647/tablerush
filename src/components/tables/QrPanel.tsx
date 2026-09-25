import { Download, Loader2, QrCode } from "lucide-react";
import { useEffect, useState } from "react";

import { EmptyState } from "@/components/EmptyState";
import { VenueRequired } from "@/components/business/VenueRequired";
import { DashboardHeading } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { downloadQr, qrDataUrl, scanUrl } from "@/lib/qr";
import type { BusinessType } from "@/lib/roles";
import { useTables, type VenueTable } from "@/lib/tables";
import type { Business } from "@/lib/useMyBusiness";

function QrRow({ business, table }: { business: Business; table: VenueTable }) {
  const [image, setImage] = useState<string | null>(null);
  const [shown, setShown] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!shown || image) return;
    let active = true;
    void qrDataUrl(table.qr_token).then((url) => {
      if (active) setImage(url);
    });
    return () => {
      active = false;
    };
  }, [shown, image, table.qr_token]);

  return (
    <div className="surface-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-display text-lg font-semibold">Table {table.table_number}</p>
          <p className="mt-1 text-xs text-muted-foreground">Seats {table.capacity}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShown((value) => !value)}>
            <QrCode className="size-3.5" /> {shown ? "Hide QR" : "View QR"}
          </Button>
          <Button
            size="sm"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              await downloadQr(table.qr_token, table.table_number, business.business_name);
              setBusy(false);
            }}
          >
            {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
            Download QR
          </Button>
        </div>
      </div>

      {shown ? (
        <div className="mt-5 flex flex-col items-center gap-3 border-t border-border pt-5">
          {image ? (
            <img
              src={image}
              alt={`QR code for table ${table.table_number}`}
              className="size-48 rounded-xl border border-border bg-white p-2"
            />
          ) : (
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          )}
          <p className="max-w-full truncate text-xs text-muted-foreground">
            {scanUrl(table.qr_token)}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function QrBody({ business }: { business: Business }) {
  const { data: tables, isLoading, isError } = useTables(business.id);
  const [downloadingAll, setDownloadingAll] = useState(false);

  async function downloadAll() {
    setDownloadingAll(true);
    for (const table of tables ?? []) {
      await downloadQr(table.qr_token, table.table_number, business.business_name);
    }
    setDownloadingAll(false);
  }

  return (
    <>
      <DashboardHeading
        title="QR codes"
        description="Each table has its own private code. Print it and place it on the table — guests scan and the right table is recognised automatically."
        action={
          (tables ?? []).length > 0 ? (
            <Button variant="outline" onClick={downloadAll} disabled={downloadingAll}>
              {downloadingAll ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Download className="size-4" />
              )}
              Download all
            </Button>
          ) : undefined
        }
      />

      {isLoading ? (
        <div className="flex min-h-40 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <EmptyState
          icon={QrCode}
          title="We couldn't load your QR codes"
          description="Something went wrong. Please refresh and try again."
        />
      ) : (tables ?? []).length === 0 ? (
        <EmptyState
          icon={QrCode}
          title="No QR codes yet"
          description="Add tables first — each new table gets its own QR code automatically."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {tables!.map((table) => (
            <QrRow key={table.id} business={business} table={table} />
          ))}
        </div>
      )}
    </>
  );
}

export function QrPanel({ type }: { type: BusinessType }) {
  return <VenueRequired type={type}>{(business) => <QrBody business={business} />}</VenueRequired>;
}
