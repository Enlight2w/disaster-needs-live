import { describe, expect, it } from "vitest";
import { CRISIS_INCIDENTS, filterIncidents, formatCoordinates, stageAmberAlert } from "./crisis";

describe("crisis incident helpers", () => {
  it("keeps every incident when the all filter is selected", () => {
    expect(filterIncidents(CRISIS_INCIDENTS, "all")).toHaveLength(CRISIS_INCIDENTS.length);
  });

  it("returns only critical incidents for the critical alert view", () => {
    const results = filterIncidents(CRISIS_INCIDENTS, "critical");
    expect(results.length).toBeGreaterThan(0);
    expect(results.every(incident => incident.severity === "critical")).toBe(true);
  });

  it("formats precise coordinates with cardinal directions", () => {
    expect(formatCoordinates({ lat: -19.8436, lng: 34.8389 })).toBe("19.844°S, 34.839°E");
  });

  it("keeps the amber alert staged after repeated activation attempts", () => {
    expect(stageAmberAlert(false)).toBe(true);
    expect(stageAmberAlert(true)).toBe(true);
  });
});
