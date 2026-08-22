import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const { getCommitmentSummariesMock, getCommitmentSummaryMock, upsertResponderCommitmentMock } = vi.hoisted(() => ({
  getCommitmentSummariesMock: vi.fn(),
  getCommitmentSummaryMock: vi.fn(),
  upsertResponderCommitmentMock: vi.fn(),
}));

vi.mock("./db", () => ({
  getCommitmentSummaries: getCommitmentSummariesMock,
  getCommitmentSummary: getCommitmentSummaryMock,
  upsertResponderCommitment: upsertResponderCommitmentMock,
}));

import { appRouter } from "./routers";

function createAuthenticatedContext(): TrpcContext {
  return {
    user: {
      id: 42,
      openId: "responder-42",
      name: "Responder",
      email: "responder@example.com",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("needs.commit", () => {
  beforeEach(() => {
    getCommitmentSummariesMock.mockReset();
    getCommitmentSummaryMock.mockReset();
    upsertResponderCommitmentMock.mockReset();
  });
  afterEach(() => vi.restoreAllMocks());

  it("persists the authenticated responder commitment and returns its tracker state", async () => {
    upsertResponderCommitmentMock.mockResolvedValue(undefined);
    getCommitmentSummaryMock.mockResolvedValue({ committedCount: 1, currentResponderCommitted: true });

    const caller = appRouter.createCaller(createAuthenticatedContext());
    const result = await caller.needs.commit({
      needId: "beira-water",
      evidenceKey: "responder-evidence/42/beira-water/capacity.pdf",
      evidenceUrl: "/manus-storage/responder-evidence/42/beira-water/capacity.pdf",
    });

    expect(upsertResponderCommitmentMock).toHaveBeenCalledWith({
      needId: "beira-water",
      responderId: 42,
      evidenceKey: "responder-evidence/42/beira-water/capacity.pdf",
      evidenceUrl: "/manus-storage/responder-evidence/42/beira-water/capacity.pdf",
    });
    expect(result).toEqual({ committedCount: 1, currentResponderCommitted: true });
  });

  it("returns persisted commitment summaries for matching-card hydration", async () => {
    getCommitmentSummariesMock.mockResolvedValue([
      { needId: "beira-water", committedCount: 2, currentResponderCommitted: true },
      { needId: "mamuju-shelter", committedCount: 0, currentResponderCommitted: false },
    ]);

    const caller = appRouter.createCaller(createAuthenticatedContext());
    const result = await caller.needs.commitmentStatuses({ needIds: ["beira-water", "mamuju-shelter"] });

    expect(getCommitmentSummariesMock).toHaveBeenCalledWith(["beira-water", "mamuju-shelter"], 42);
    expect(result[0]).toEqual({ needId: "beira-water", committedCount: 2, currentResponderCommitted: true });
  });
});
