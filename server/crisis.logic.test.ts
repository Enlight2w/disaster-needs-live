import { describe, expect, it } from "vitest";
import {
  CRISIS_INCIDENTS,
  RESPONSE_NEEDS,
  filterIncidents,
  filterResponseNeeds,
  formatCoordinates,
  getHeuristicCategory,
  nextNeedStatus,
  stageAmberAlert,
} from "../client/src/lib/crisis";

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

  it("filters matching requests by a responder category", () => {
    const medicalRequests = filterResponseNeeds(RESPONSE_NEEDS, "Medical");
    expect(medicalRequests).toHaveLength(1);
    expect(medicalRequests[0]?.title).toBe("Cold-chain insulin");
  });

  it("advances a request from posted to in-progress to fulfilled", () => {
    expect(nextNeedStatus("posted")).toBe("in_progress");
    expect(nextNeedStatus("in_progress")).toBe("fulfilled");
    expect(nextNeedStatus("fulfilled")).toBe("fulfilled");
  });

  it("uses medical keywords as a safe fallback when AI is unavailable", () => {
    expect(getHeuristicCategory("Insulin and cold storage are urgently needed at the clinic.")).toBe("Medical");
  });
});
