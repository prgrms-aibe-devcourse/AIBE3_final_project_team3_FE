export interface CountryOption {
  value: string;
  label: string;
}

export const COUNTRY_OPTIONS: CountryOption[] = [
  { value: "KR", label: "South Korea" },
  { value: "JP", label: "Japan" },
  { value: "CN", label: "China" },
  { value: "US", label: "United States" },
  { value: "GB", label: "United Kingdom" },
  { value: "CA", label: "Canada" },
  { value: "AU", label: "Australia" },
  { value: "ZZ", label: "Other" },
];

export const COUNTRY_LABELS: Record<string, string> = COUNTRY_OPTIONS.reduce(
  (acc, option) => {
    acc[option.value] = option.label;
    return acc;
  },
  {} as Record<string, string>
);

export const COUNTRY_NAME_TO_CODE: Record<string, string> = {
  "SOUTH KOREA": "KR",
  KOREA: "KR",
  "REPUBLIC OF KOREA": "KR",
  "KOREA (REPUBLIC OF)": "KR",
  JAPAN: "JP",
  "UNITED STATES": "US",
  USA: "US",
  "UNITED STATES OF AMERICA": "US",
  "UNITED KINGDOM": "GB",
  UK: "GB",
  BRITAIN: "GB",
  ENGLAND: "GB",
  CHINA: "CN",
  "PEOPLE'S REPUBLIC OF CHINA": "CN",
  CANADA: "CA",
  AUSTRALIA: "AU",
  OTHER: "ZZ",
  "NOT SPECIFIED": "ZZ",
  "N/A": "ZZ",
  ZZ: "ZZ",
};

export const KNOWN_COUNTRY_CODES = new Set(Object.keys(COUNTRY_LABELS));

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

  if (KNOWN_COUNTRY_CODES.has(upperCode)) {
    return {
      code: upperCode,
      name: COUNTRY_LABELS[upperCode] ?? trimmedName ?? trimmedCode,
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

  if (KNOWN_COUNTRY_CODES.has(upperName)) {
    return {
      code: upperName,
      name: COUNTRY_LABELS[upperName] ?? trimmedName,
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
  return COUNTRY_LABELS[normalisedCode] ?? normalisedCode;
};
