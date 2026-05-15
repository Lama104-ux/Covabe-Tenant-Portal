export type PropertyType =
  | "residential"
  | "commercial"
  | "industrial"
  | "land"
  | "institutional"
  | "transport"
  | "special"
  | "mixed";

export type PropertyTypeMeta = {
  label: string;
  unitsLabel: string;
  unitsKey: string | null;
  occupantsLabel: string;
  unitPrefix: string | null;
};

export const PROPERTY_TYPE_META: Record<PropertyType, PropertyTypeMeta> = {
  residential:   { label: "Bostäder",           unitsLabel: "Lägenheter", unitsKey: "apartments", occupantsLabel: "Hyresgäster", unitPrefix: "Lgh"   },
  commercial:    { label: "Kommersiell",        unitsLabel: "Lokaler",    unitsKey: "units",      occupantsLabel: "Företag",     unitPrefix: "Lokal" },
  industrial:    { label: "Industriell",        unitsLabel: "Hallar",     unitsKey: "halls",      occupantsLabel: "Företag",     unitPrefix: "Hall"  },
  land:          { label: "Mark",               unitsLabel: "—",          unitsKey: null,         occupantsLabel: "Arrendator",  unitPrefix: null    },
  institutional: { label: "Institutionell",     unitsLabel: "—",          unitsKey: null,         occupantsLabel: "Verksamhet",  unitPrefix: null    },
  transport:     { label: "Transport",          unitsLabel: "Platser",    unitsKey: "spots",      occupantsLabel: "Hyresgäster", unitPrefix: "Plats" },
  special:       { label: "Speciell",           unitsLabel: "Enheter",    unitsKey: "units",      occupantsLabel: "Hyresgäster", unitPrefix: "Enhet" },
  mixed:         { label: "Blandad användning", unitsLabel: "Enheter",    unitsKey: "units",      occupantsLabel: "Hyresgäster", unitPrefix: "Enhet" },
};

export function propertyTypeFromInt(t: number | null | undefined): PropertyType {
  switch (t) {
    case 0: return "residential";
    case 1: return "commercial";
    case 2: return "industrial";
    case 3: return "land";
    case 4: return "institutional";
    case 5: return "transport";
    case 6: return "special";
    case 7: return "mixed";
    default: return "residential";
  }
}

export function statusPill(active: boolean) {
  return {
    label: active ? "Aktiv" : "Inaktiv",
    dotColor: active ? "#009700" : "#9CA3AF",
  };
}
