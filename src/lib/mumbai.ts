/**
 * Mumbai localities the directory supports out of the box. The provider may
 * return other suburbs too — those are stored and searchable as well, and the
 * area selector is always built from the areas actually present in the database.
 */
export const MUMBAI_AREA_GROUPS: { zone: string; areas: string[] }[] = [
  {
    zone: "South Mumbai",
    areas: [
      "Colaba",
      "Fort",
      "Churchgate",
      "Marine Lines",
      "Girgaon",
      "Charni Road",
      "Malabar Hill",
      "Tardeo",
      "Mahalaxmi",
      "Lower Parel",
    ],
  },
  {
    zone: "Central Mumbai",
    areas: ["Dadar", "Parel", "Prabhadevi", "Matunga", "Sion", "Wadala", "Byculla"],
  },
  {
    zone: "Western Suburbs",
    areas: [
      "Bandra",
      "Bandra West",
      "Bandra East",
      "Khar",
      "Santacruz",
      "Vile Parle",
      "Andheri",
      "Andheri West",
      "Andheri East",
      "Jogeshwari",
      "Goregaon",
      "Goregaon West",
      "Goregaon East",
      "Malad",
      "Malad West",
      "Malad East",
      "Kandivali",
      "Kandivali West",
      "Kandivali East",
      "Borivali",
      "Borivali West",
      "Borivali East",
      "Dahisar",
    ],
  },
  {
    zone: "Eastern Suburbs",
    areas: [
      "Kurla",
      "Ghatkopar",
      "Vikhroli",
      "Powai",
      "Bhandup",
      "Mulund",
      "Chembur",
      "Govandi",
      "Kanjurmarg",
    ],
  },
];

export const MUMBAI_AREAS: string[] = MUMBAI_AREA_GROUPS.flatMap((group) => group.areas);

/** Best-effort area detection from a provider address string. */
export function areaFromAddress(address: string | null | undefined): string | null {
  if (!address) return null;
  const haystack = address.toLowerCase();
  const matches = MUMBAI_AREAS.filter((area) => haystack.includes(area.toLowerCase()));
  if (matches.length === 0) return null;
  // Prefer the most specific match ("Andheri West" over "Andheri").
  return matches.sort((a, b) => b.length - a.length)[0]!;
}
