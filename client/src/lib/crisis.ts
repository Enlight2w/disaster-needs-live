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
