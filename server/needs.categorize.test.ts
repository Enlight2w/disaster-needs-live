import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const { invokeLLMMock } = vi.hoisted(() => ({ invokeLLMMock: vi.fn() }));

vi.mock("./_core/llm", () => ({
  invokeLLM: invokeLLMMock,
}));

import { appRouter } from "./routers";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("needs.categorize", () => {
  beforeEach(() => {
    invokeLLMMock.mockReset();
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => vi.restoreAllMocks());

  it("returns a structured AI category suggestion", async () => {
    invokeLLMMock.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({ category: "Medical", confidence: "high" }) } }],
    });

    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.needs.categorize({ description: "Insulin and ice packs are needed at the clinic." });

    expect(result).toEqual({ category: "Medical", confidence: "high", source: "ai" });
    expect(invokeLLMMock).toHaveBeenCalledWith(expect.objectContaining({ model: "gpt-5-mini" }));
  });

  it("returns a safe local keyword fallback when the AI request fails", async () => {
    invokeLLMMock.mockRejectedValue(new Error("temporary upstream failure"));

    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.needs.categorize({ description: "Need emergency shelter tents and blankets for families." });

    expect(result).toEqual({ category: "Shelter", confidence: "low", source: "fallback" });
  });

  it("returns structured translated request text from the AI", async () => {
    invokeLLMMock.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({ title: "Kits de agua potable", detail: "El punto de distribución está abierto para las familias." }) } }],
    });

    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.needs.translate({ title: "Safe water kits", detail: "The distribution point is open for families.", targetLanguage: "Spanish" });

    expect(result).toEqual({ title: "Kits de agua potable", detail: "El punto de distribución está abierto para las familias.", targetLanguage: "Spanish", source: "ai" });
  });

  it("retains original request text when translation is unavailable", async () => {
    invokeLLMMock.mockRejectedValue(new Error("temporary upstream failure"));

    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.needs.translate({ title: "Safe water kits", detail: "The distribution point is open for families.", targetLanguage: "French" });

    expect(result).toEqual({ title: "Safe water kits", detail: "The distribution point is open for families.", targetLanguage: "French", source: "fallback" });
  });
});
