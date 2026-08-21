import { describe, expect, it } from "vitest";
import { CRISIS_INCIDENTS, filterIncidents, formatCoordinates, stageAmberAlert } from "../client/src/lib/crisis";

describe("crisis-board logic", () => {
  it("keeps every incident in the all-signals view", () => {
    expect(filterIncidents(CRISIS_INCIDENTS, "all")).toHaveLength(CRISIS_INCIDENTS.length);
  });

  it("returns only critical incidents when the alert filter is selected", () => {
    const results = filterIncidents(CRISIS_INCIDENTS, "critical");
    expect(results.length).toBeGreaterThan(0);
    expect(results.every(incident => incident.severity === "critical")).toBe(true);
  });

  it("formats precise coordinates with cardinal directions", () => {
    expect(formatCoordinates({ lat: -19.8436, lng: 34.8389 })).toBe("19.844°S, 34.839°E");
  });

  it("keeps an amber alert staged after repeat activation attempts", () => {
    expect(stageAmberAlert(false)).toBe(true);
    expect(stageAmberAlert(true)).toBe(true);
  });
});
