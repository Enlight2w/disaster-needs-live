export type IncidentCategory = "Water" | "Health" | "Shelter" | "Power" | "Transport" | "Language";
export type IncidentSeverity = "critical" | "watch" | "stable";

export type CrisisIncident = {
  id: string;
  place: string;
  country: string;
  type: string;
  summary: string;
  coordinates: { lat: number; lng: number };
  severity: IncidentSeverity;
  verifiedAt: string;
  peopleReached: string;
  needs: IncidentCategory[];
  priorityNeed: string;
  signal: string;
};

export const CRISIS_INCIDENTS: CrisisIncident[] = [
  {
    id: "beira",
    place: "Beira coast",
    country: "Mozambique",
    type: "Flooding scenario",
    summary: "Safe-water points and boat transport are the immediate coordination priorities.",
    coordinates: { lat: -19.8436, lng: 34.8389 },
    severity: "critical",
    verifiedAt: "12 min ago",
    peopleReached: "2,400",
    needs: ["Water", "Transport", "Shelter"],
    priorityNeed: "Safe water kits",
    signal: "Field location pin",
  },
  {
    id: "mamuju",
    place: "Mamuju district",
    country: "Indonesia",
    type: "Earthquake scenario",
    summary: "Community hubs have requested portable power, interpreters, and dry shelter supplies.",
    coordinates: { lat: -2.681, lng: 118.889 },
    severity: "critical",
    verifiedAt: "18 min ago",
    peopleReached: "1,180",
    needs: ["Power", "Language", "Shelter"],
    priorityNeed: "Portable generators",
    signal: "Field location pin",
  },
  {
    id: "cebu",
    place: "Cebu province",
    country: "Philippines",
    type: "Storm evacuation scenario",
    summary: "Transport to evacuation points and insulin continuity are flagged for local action.",
    coordinates: { lat: 10.3157, lng: 123.8854 },
    severity: "watch",
    verifiedAt: "31 min ago",
    peopleReached: "860",
    needs: ["Transport", "Health", "Water"],
    priorityNeed: "Cold-chain insulin",
    signal: "Field location pin",
  },
  {
    id: "peru",
    place: "Piura valley",
    country: "Peru",
    type: "Landslide scenario",
    summary: "A neighbourhood coordination point needs bridge transport, water purification, and radio repeaters.",
    coordinates: { lat: -5.1945, lng: -80.6328 },
    severity: "watch",
    verifiedAt: "46 min ago",
    peopleReached: "540",
    needs: ["Water", "Transport", "Power"],
    priorityNeed: "Water purification tablets",
    signal: "Field location pin",
  },
];

export const INCIDENT_FILTERS = ["all", "critical", "watch"] as const;
export type IncidentFilter = (typeof INCIDENT_FILTERS)[number];

export function filterIncidents(incidents: CrisisIncident[], filter: IncidentFilter) {
  return filter === "all" ? incidents : incidents.filter(incident => incident.severity === filter);
}

export function formatCoordinates(coordinates: CrisisIncident["coordinates"]) {
  const latitude = `${Math.abs(coordinates.lat).toFixed(3)}°${coordinates.lat >= 0 ? "N" : "S"}`;
  const longitude = `${Math.abs(coordinates.lng).toFixed(3)}°${coordinates.lng >= 0 ? "E" : "W"}`;
  return `${latitude}, ${longitude}`;
}

export function stageAmberAlert(_isActive: boolean) {
  return true;
}

export const RESPONSE_CATEGORY_OPTIONS = [
  "All",
  "Medical",
  "Shelter",
  "Food",
  "Water",
  "Power",
  "Transport",
  "Translation",
  "Other",
] as const;

export type ResponseCategoryFilter = (typeof RESPONSE_CATEGORY_OPTIONS)[number];
export type ResponseCategory = Exclude<ResponseCategoryFilter, "All">;
export type NeedStatus = "posted" | "in_progress" | "fulfilled";
export type NeedUrgency = "high" | "standard";

export const TRANSLATION_LANGUAGES = ["Arabic", "French", "Portuguese", "Spanish", "Swahili"] as const;
export type TranslationLanguage = (typeof TRANSLATION_LANGUAGES)[number];

export type ResponseNeed = {
  id: string;
  incidentId: CrisisIncident["id"];
  title: string;
  quantity: string;
  detail: string;
  category: ResponseCategory;
  status: NeedStatus;
  urgency: NeedUrgency;
  location: string;
  updatedAt: string;
};

export const RESPONSE_NEEDS: ResponseNeed[] = [
  {
    id: "beira-water",
    incidentId: "beira",
    title: "Safe water kits",
    quantity: "240 kits",
    detail: "Distribution point is open to families arriving by boat.",
    category: "Water",
    status: "in_progress",
    urgency: "high",
    location: "Beira coast, Mozambique",
    updatedAt: "2 min ago",
  },
  {
    id: "mamuju-shelter",
    incidentId: "mamuju",
    title: "Dry shelter packs",
    quantity: "85 family packs",
    detail: "Prioritize accessible kits for the community hub.",
    category: "Shelter",
    status: "posted",
    urgency: "high",
    location: "Mamuju district, Indonesia",
    updatedAt: "8 min ago",
  },
  {
    id: "cebu-medical",
    incidentId: "cebu",
    title: "Cold-chain insulin",
    quantity: "12 patient sets",
    detail: "Local clinic confirmed transfer and refrigerated storage.",
    category: "Medical",
    status: "fulfilled",
    urgency: "standard",
    location: "Cebu province, Philippines",
    updatedAt: "14 min ago",
  },
  {
    id: "piura-food",
    incidentId: "peru",
    title: "Family food parcels",
    quantity: "60 parcels",
    detail: "Road access is limited; compact dry goods are preferred.",
    category: "Food",
    status: "posted",
    urgency: "standard",
    location: "Piura valley, Peru",
    updatedAt: "19 min ago",
  },
];

export function filterResponseNeeds(needs: ResponseNeed[], category: ResponseCategoryFilter) {
  return category === "All" ? needs : needs.filter(need => need.category === category);
}

/**
 * Return incident IDs directly from the response needs selected by the category filter.
 * This keeps the map and matching cards in exact agreement, including zero-pin states.
 */
export function incidentIdsForCategory(
  incidents: CrisisIncident[],
  category: ResponseCategoryFilter,
): Set<string> {
  if (category === "All") return new Set(incidents.map(incident => incident.id));
  const validIncidentIds = new Set(incidents.map(incident => incident.id));
  return new Set(
    RESPONSE_NEEDS
      .filter(need => need.category === category && validIncidentIds.has(need.incidentId))
      .map(need => need.incidentId),
  );
}

/** Build a concise, platform-neutral share message for a single response need. */
export function buildShareMessage(need: ResponseNeed): string {
  return `🚨 Urgent need: ${need.title} (${need.quantity}) · ${need.location} · Category: ${need.category} · Disaster Needs Live`;
}

export type CoordinationPathway = {
  id: "ifrc-local" | "ifrc-global" | "st-john" | "insarag";
  label: string;
  detail: string;
  href: string;
  kind: "directory" | "contact" | "phone";
};

const IFRC_NATIONAL_SOCIETIES_DIRECTORY = "https://www.ifrc.org/national-societies-directory";
const IFRC_CONTACT_PAGE = "https://www.ifrc.org/contact";
const ST_JOHN_GLOBAL_PHONE = "tel:+442045830202";
const INSARAG_USAR_DIRECTORY = "https://insarag.org/directory/usar-directory/";

/** Prepare an auditable, request-specific coordination message without personal contact data. */
export function buildQuickReplyMessage(need: ResponseNeed): string {
  return `Hello — I’m coordinating a possible response to “${need.title}” (${need.quantity}) in ${need.location}. We can discuss safe handover details, timing, and any access constraints through the verified coordination route. Please confirm the request status and a safe next step.`;
}

/**
 * Return institutional coordination pathways rather than claiming real-time rescue-team availability.
 * The caller presents these as links to official directories or global offices, never as dispatch endpoints.
 */
export function coordinationPathwaysForNeed(need: ResponseNeed): CoordinationPathway[] {
  const incident = CRISIS_INCIDENTS.find(item => item.id === need.incidentId);
  const country = incident?.country ?? "the affected country";
  return [
    {
      id: "ifrc-local",
      label: `Find the ${country} Red Cross / Red Crescent`,
      detail: "Official National Societies Directory · country-level routing",
      href: IFRC_NATIONAL_SOCIETIES_DIRECTORY,
      kind: "directory",
    },
    {
      id: "ifrc-global",
      label: "IFRC global contact",
      detail: "Institutional contact route · not emergency dispatch",
      href: IFRC_CONTACT_PAGE,
      kind: "contact",
    },
    {
      id: "st-john",
      label: "Call St John International",
      detail: "+44 20 4583 0202 · global office · not emergency dispatch",
      href: ST_JOHN_GLOBAL_PHONE,
      kind: "phone",
    },
    {
      id: "insarag",
      label: "Browse INSARAG USAR teams",
      detail: "Search-and-rescue directory · availability must be confirmed",
      href: INSARAG_USAR_DIRECTORY,
      kind: "directory",
    },
  ];
}

export function nextNeedStatus(status: NeedStatus): NeedStatus {
  if (status === "posted") return "in_progress";
  if (status === "in_progress") return "fulfilled";
  return "fulfilled";
}

/** Return incident IDs with unresolved high-urgency requests for the pulse treatment. */
export function urgentIncidentIds(needs: ResponseNeed[] = RESPONSE_NEEDS): Set<string> {
  return new Set(
    needs
      .filter(need => need.urgency === "high" && need.status !== "fulfilled")
      .map(need => need.incidentId),
  );
}

export function getHeuristicCategory(description: string): ResponseCategory {
  const normalized = description.toLowerCase();
  if (/(insulin|medicine|medical|clinic|prescription|bandage|oxygen|doctor)/.test(normalized)) return "Medical";
  if (/(shelter|tent|tarpaulin|blanket|mattress|housing)/.test(normalized)) return "Shelter";
  if (/(food|meal|rice|nutrition|bread|parcel|groceries)/.test(normalized)) return "Food";
  if (/(water|hydration|purification|jerrycan)/.test(normalized)) return "Water";
  if (/(generator|battery|power|electricity|solar)/.test(normalized)) return "Power";
  if (/(transport|vehicle|boat|driver|fuel|evacuation)/.test(normalized)) return "Transport";
  if (/(translator|translation|interpreter|language)/.test(normalized)) return "Translation";
  return "Other";
}
