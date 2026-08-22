import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const { storagePutMock } = vi.hoisted(() => ({ storagePutMock: vi.fn() }));

vi.mock("./storage", () => ({
  storagePut: storagePutMock,
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

describe("needs.uploadEvidence", () => {
  beforeEach(() => storagePutMock.mockReset());
  afterEach(() => vi.restoreAllMocks());

  it("stores a permitted evidence file under the signed-in responder namespace", async () => {
    storagePutMock.mockResolvedValue({ key: "responder-evidence/42/beira-water/capacity_1234.pdf", url: "/manus-storage/responder-evidence/42/beira-water/capacity_1234.pdf" });

    const caller = appRouter.createCaller(createAuthenticatedContext());
    const result = await caller.needs.uploadEvidence({
      needId: "beira-water",
      fileName: "capacity.pdf",
      contentType: "application/pdf",
      base64: Buffer.from("credential-file").toString("base64"),
    });

    expect(storagePutMock).toHaveBeenCalledWith(
      "responder-evidence/42/beira-water/capacity.pdf",
      expect.any(Buffer),
      "application/pdf",
    );
    expect(result).toMatchObject({ fileName: "capacity.pdf", contentType: "application/pdf", size: 15 });
  });

  it("rejects a disallowed evidence mime type before storage is called", async () => {
    const caller = appRouter.createCaller(createAuthenticatedContext());
    await expect(caller.needs.uploadEvidence({
      needId: "beira-water",
      fileName: "unsafe.exe",
      contentType: "application/x-msdownload" as never,
      base64: Buffer.from("unsafe-file").toString("base64"),
    })).rejects.toThrow();
    expect(storagePutMock).not.toHaveBeenCalled();
  });
});
