export const COUNTRY_CODES = ["unitedstates", "uk", "canada", "luxembourg"] as const;
export type CountryCode = (typeof COUNTRY_CODES)[number];

export const COUNTRIES: Array<{ code: CountryCode; label: string }> = [
  { code: "unitedstates", label: "United States" },
  { code: "uk", label: "United Kingdom" },
  { code: "canada", label: "Canada" },
  { code: "luxembourg", label: "Luxembourg" }
];
