# Tables, Menu & QR codes

Adds the three management areas venues need before ordering can start, plus the scan entry point guests land on.

## Tables

New "Tables" page in both the restaurant and café dashboards:

- Add a table with a number and how many people it seats.
- Edit or delete a table.
- Change its state: Available, Occupied, Order pending, Preparing, Ready — shown as colour-coded badges on a card grid.
- Each table gets its own private scan code the moment it is created.
- Table numbers must be unique inside one venue.

## Menu

New "Menu" page, split in two parts:

- Categories (Starters, Main Course, Beverages...): create, rename, reorder by name, delete. Deleting a category removes its items.
- Items: name, description, price, photo, category, vegetarian or non-vegetarian, preparation time in minutes, plus an on/off switch for availability.
- Optional extras per item (extra cheese, extra sauce...) with their own price, added and removed inline.
- Photos upload to secure storage in the venue's own folder.

## QR codes

New "QR Codes" page listing every table with View QR and Download QR (PNG, print-ready), plus a Download all option.

Codes point at `/order/<token>` where the token is a random secret stored on the table row — the table number alone is never trusted, so a guest cannot reach another table or venue by editing the link.

## Guest scan page

Scanning opens `/order/<token>`, which resolves the venue and table server-side and shows the venue header, the table it recognised ("Table 04"), and the live public menu grouped by category with prices, veg markers, prep times and extras. Unavailable items and non-active venues are not shown. Placing the order comes in the next stage; the page ends with a clearly disabled "Start your order" step.

## Security

- Owners and staff read and write only their own venue's tables, categories, items and extras; cross-venue access is blocked in the database.
- Guests can read categories, items and extras of active venues only, and can resolve a table only through its secret token via a server function — the token itself is never exposed in public listings.

## Technical notes

- Migration: `tables` (business_id, table_number, capacity, status, qr_token, created_at), `menu_categories` (name, sort_order), `menu_items` (category_id, price numeric, is_vegetarian, is_available, prep_minutes, image_url), `menu_item_addons` (name, price). Enum `table_status`. GRANTs + RLS on every table, reusing `has_business_access` and `is_admin`.
- Token lookup runs through a server function using the admin client, so the token column stays unreadable to `anon`.
- QR images render client-side with the `qrcode` package; no external image service.
- New files under `src/components/tables`, `src/components/menu`, `src/lib/tables.ts`, `src/lib/menu.ts`, routes `order.$token.tsx` and the existing `$section` dashboard routes wired to the new panels.
