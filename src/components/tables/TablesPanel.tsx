import { Loader2, Pencil, Plus, Table2, Trash2, Users, X } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/EmptyState";
import { VenueRequired } from "@/components/business/VenueRequired";
import { DashboardHeading } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BusinessType } from "@/lib/roles";
import {
  TABLE_STATUSES,
  statusMeta,
  tableErrorMessage,
  useTableMutations,
  useTables,
  type TableStatus,
  type VenueTable,
} from "@/lib/tables";
import type { Business } from "@/lib/useMyBusiness";

const selectClass =
  "flex h-9 w-full rounded-xl border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none";

export function StatusBadge({ status }: { status: TableStatus }) {
  const meta = statusMeta(status);
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}

function TableForm({
  business,
  table,
  onDone,
}: {
  business: Business;
  table?: VenueTable;
  onDone: () => void;
}) {
  const { create, update } = useTableMutations(business.id);
  const [tableNumber, setTableNumber] = useState(table?.table_number ?? "");
  const [capacity, setCapacity] = useState(String(table?.capacity ?? 2));
  const [error, setError] = useState<string | null>(null);
  const saving = create.isPending || update.isPending;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const number = tableNumber.trim();
    if (!number) {
      setError("Enter a table number.");
      return;
    }
    const seats = Number(capacity);
    if (!Number.isInteger(seats) || seats < 1 || seats > 50) {
      setError("Capacity must be between 1 and 50.");
      return;
    }
    try {
      if (table) {
        await update.mutateAsync({ id: table.id, table_number: number, capacity: seats });
      } else {
        await create.mutateAsync({ table_number: number, capacity: seats });
      }
      onDone();
    } catch (mutationError) {
      setError(tableErrorMessage(mutationError));
    }
  }

  return (
    <form onSubmit={submit} className="surface-card space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{table ? `Edit table ${table.table_number}` : "Add a table"}</h2>
        <Button type="button" variant="ghost" size="icon" onClick={onDone}>
          <X className="size-4" />
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="table_number">Table number</Label>
          <Input
            id="table_number"
            placeholder="01"
            value={tableNumber}
            onChange={(event) => setTableNumber(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="capacity">Seats</Label>
          <Input
            id="capacity"
            inputMode="numeric"
            value={capacity}
            onChange={(event) => setCapacity(event.target.value)}
          />
        </div>
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <Button type="submit" disabled={saving}>
        {saving ? <Loader2 className="size-4 animate-spin" /> : null}
        {table ? "Save changes" : "Add table"}
      </Button>
    </form>
  );
}

function TableCard({ business, table }: { business: Business; table: VenueTable }) {
  const { update, remove } = useTableMutations(business.id);
  const [editing, setEditing] = useState(false);

  if (editing) return <TableForm business={business} table={table} onDone={() => setEditing(false)} />;

  return (
    <div className="surface-card space-y-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-lg font-semibold">Table {table.table_number}</p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="size-3.5" /> Seats {table.capacity}
          </p>
        </div>
        <StatusBadge status={table.status} />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`status-${table.id}`} className="text-xs text-muted-foreground">
          Status
        </Label>
        <select
          id={`status-${table.id}`}
          className={selectClass}
          value={table.status}
          onChange={(event) =>
            update.mutate({ id: table.id, status: event.target.value as TableStatus })
          }
        >
          {TABLE_STATUSES.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
          <Pencil className="size-3.5" /> Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (window.confirm(`Delete table ${table.table_number}? Its QR code stops working.`)) {
              remove.mutate(table.id);
            }
          }}
        >
          <Trash2 className="size-3.5" /> Delete
        </Button>
      </div>
    </div>
  );
}

function TablesBody({ business }: { business: Business }) {
  const { data: tables, isLoading, isError } = useTables(business.id);
  const [adding, setAdding] = useState(false);

  return (
    <>
      <DashboardHeading
        title="Tables"
        description="Add your seating, keep each table's status up to date and generate its QR code."
        action={
          !adding ? (
            <Button onClick={() => setAdding(true)}>
              <Plus className="size-4" /> Add table
            </Button>
          ) : undefined
        }
      />

      {adding ? (
        <div className="mb-6">
          <TableForm business={business} onDone={() => setAdding(false)} />
        </div>
      ) : null}

      {isLoading ? (
        <div className="flex min-h-40 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <EmptyState
          icon={Table2}
          title="We couldn't load your tables"
          description="Something went wrong. Please refresh and try again."
        />
      ) : (tables ?? []).length === 0 ? (
        <EmptyState
          icon={Table2}
          title="No tables added yet"
          description="Add your tables to generate the QR codes guests scan to order."
          action={<Button onClick={() => setAdding(true)}>Add your first table</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {tables!.map((table) => (
            <TableCard key={table.id} business={business} table={table} />
          ))}
        </div>
      )}
    </>
  );
}

export function TablesPanel({ type }: { type: BusinessType }) {
  return (
    <VenueRequired type={type}>{(business) => <TablesBody business={business} />}</VenueRequired>
  );
}
