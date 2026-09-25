import QRCode from "qrcode";

/** The public URL a table's QR code points at. */
export function scanUrl(token: string): string {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return `${origin}/order/${token}`;
}

export async function qrDataUrl(token: string, size = 512): Promise<string> {
  return QRCode.toDataURL(scanUrl(token), {
    width: size,
    margin: 2,
    errorCorrectionLevel: "M",
    color: { dark: "#111111", light: "#ffffff" },
  });
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "table";
}

export async function downloadQr(token: string, tableNumber: string, venue: string) {
  const dataUrl = await qrDataUrl(token, 1024);
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = `${slug(venue)}-table-${slug(tableNumber)}.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
}
