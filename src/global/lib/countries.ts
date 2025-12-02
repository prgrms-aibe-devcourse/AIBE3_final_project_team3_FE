import type { components } from "../backend/schema";

export type CountryCode = components["schemas"]["SignUpReq"]["country"];

export interface CountryOption {
  value: CountryCode;
  label: string;
}

export const COUNTRY_OPTIONS = [
  { value: "KR", label: "South Korea" },
  { value: "US", label: "United States" },
  { value: "CA", label: "Canada" },
  { value: "UK", label: "United Kingdom" },
  { value: "AU", label: "Australia" },
  { value: "DE", label: "Germany" },
  { value: "FR", label: "France" },
  { value: "JP", label: "Japan" },
  { value: "CN", label: "China" },
  { value: "IN", label: "India" },
  { value: "BR", label: "Brazil" },
  { value: "MX", label: "Mexico" },
  { value: "RU", label: "Russia" },
  { value: "IT", label: "Italy" },
  { value: "ES", label: "Spain" },
  { value: "SE", label: "Sweden" },
  { value: "NL", label: "Netherlands" },
  { value: "CH", label: "Switzerland" },
  { value: "SG", label: "Singapore" },
  { value: "AE", label: "United Arab Emirates" },
] as const satisfies CountryOption[];

export const COUNTRY_LABELS: Record<CountryCode, string> = COUNTRY_OPTIONS.reduce(
  (acc, option) => {
    acc[option.value] = option.label;
    return acc;
  },
  {} as Record<CountryCode, string>
);

export const COUNTRY_NAME_TO_CODE: Record<string, CountryCode> = {
  "SOUTH KOREA": "KR",
  KOREA: "KR",
  "REPUBLIC OF KOREA": "KR",
  "KOREA (REPUBLIC OF)": "KR",
  JAPAN: "JP",
  "UNITED STATES": "US",
  USA: "US",
  "UNITED STATES OF AMERICA": "US",
  "UNITED KINGDOM": "UK",
  UK: "UK",
  BRITAIN: "UK",
  ENGLAND: "UK",
  CHINA: "CN",
  "PEOPLE'S REPUBLIC OF CHINA": "CN",
  CANADA: "CA",
  AUSTRALIA: "AU",
  GERMANY: "DE",
  FRANCE: "FR",
  INDIA: "IN",
  BRAZIL: "BR",
  MEXICO: "MX",
  RUSSIA: "RU",
  ITALY: "IT",
  SPAIN: "ES",
  SWEDEN: "SE",
  NETHERLANDS: "NL",
  HOLLAND: "NL",
  SWITZERLAND: "CH",
  SINGAPORE: "SG",
  "UNITED ARAB EMIRATES": "AE",
  UAE: "AE",
  EMIRATES: "AE",
};

export const KNOWN_COUNTRY_CODES = new Set<CountryCode>(
  COUNTRY_OPTIONS.map((option) => option.value)
);

export const isSupportedCountryCode = (value: string): value is CountryCode =>
  KNOWN_COUNTRY_CODES.has(value as CountryCode);

type CountryNormalisationResult = {
  code: string;
  name: string;
};

const normaliseCountryStrings = (
  codeCandidate: string,
  nameCandidate: string
): CountryNormalisationResult => {
  const trimmedCode = codeCandidate.trim();
  const trimmedName = nameCandidate.trim();
  const upperCode = trimmedCode.toUpperCase();
  const upperName = trimmedName.toUpperCase();

  if (KNOWN_COUNTRY_CODES.has(upperCode as CountryCode)) {
    return {
      code: upperCode,
      name: COUNTRY_LABELS[upperCode as CountryCode] ?? trimmedName ?? trimmedCode,
    };
  }

  const mappedFromCode = COUNTRY_NAME_TO_CODE[upperCode];
  if (mappedFromCode) {
    return {
      code: mappedFromCode,
      name: COUNTRY_LABELS[mappedFromCode] ?? trimmedCode,
    };
  }

  const mappedFromName = COUNTRY_NAME_TO_CODE[upperName];
  if (mappedFromName) {
    return {
      code: mappedFromName,
      name: COUNTRY_LABELS[mappedFromName] ?? trimmedName,
    };
  }

  if (KNOWN_COUNTRY_CODES.has(upperName as CountryCode)) {
    return {
      code: upperName,
      name: COUNTRY_LABELS[upperName as CountryCode] ?? trimmedName,
    };
  }

  const fallback = trimmedCode || trimmedName;

  return {
    code: fallback,
    name: trimmedName || trimmedCode,
  };
};

export const normaliseCountryValue = (country: unknown): CountryNormalisationResult => {
  if (!country) {
    return { code: "", name: "" };
  }

  if (typeof country === "string") {
    return normaliseCountryStrings(country, country);
  }

  if (typeof country === "object") {
    const countryRecord = country as Record<string, unknown>;
    const fromCode = typeof countryRecord.code === "string"
      ? countryRecord.code
      : typeof countryRecord.isoCode === "string"
        ? countryRecord.isoCode
        : typeof countryRecord.countryCode === "string"
          ? countryRecord.countryCode
          : "";

    const fromName = typeof countryRecord.name === "string"
      ? countryRecord.name
      : typeof countryRecord.label === "string"
        ? countryRecord.label
        : typeof countryRecord.displayName === "string"
          ? countryRecord.displayName
          : typeof countryRecord.fullName === "string"
            ? countryRecord.fullName
            : "";

    return normaliseCountryStrings(fromCode, fromName);
  }

  const serialised = String(country);
  return normaliseCountryStrings(serialised, serialised);
};

export const getCountryLabel = (code: string): string => {
  if (!code) {
    return "";
  }

  const normalisedCode = code.trim().toUpperCase();
  return COUNTRY_LABELS[normalisedCode as CountryCode] ?? normalisedCode;
};

const convertToFlag = (alpha2: string): string => {
  const base = 0x1f1e6 - "A".charCodeAt(0);
  const codePoints = Array.from(alpha2).map((char) => char.charCodeAt(0) + base);
  return String.fromCodePoint(...codePoints);
};

export const getCountryFlagEmoji = (value: string | null | undefined): string => {
  if (!value) {
    return "";
  }

  const trimmed = value.trim().toUpperCase();
  const directCandidate = /^[A-Z]{2}$/.test(trimmed) ? trimmed : COUNTRY_NAME_TO_CODE[trimmed];

  if (!directCandidate) {
    return "";
  }

  return convertToFlag(directCandidate);
};
