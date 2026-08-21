import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { invokeLLM } from "./_core/llm";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { RESPONSE_CATEGORY_OPTIONS, getHeuristicCategory } from "../client/src/lib/crisis";

const aiCategoryOptions = RESPONSE_CATEGORY_OPTIONS.filter(option => option !== "All");
const aiCategorySchema = z.object({
  category: z.enum(aiCategoryOptions as [string, ...string[]]),
  confidence: z.enum(["high", "medium", "low"]),
});

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  needs: router({
    categorize: publicProcedure
      .input(z.object({ description: z.string().trim().min(8).max(1200) }))
      .mutation(async ({ input }) => {
        try {
          const response = await invokeLLM({
            model: "gpt-5-mini",
            messages: [
              {
                role: "system",
                content: "Classify a humanitarian need into exactly one category. Use the request text only. Never claim verification, safety, severity, or fulfillment. Return JSON only.",
              },
              { role: "user", content: input.description },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "need_category",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    category: { type: "string", enum: aiCategoryOptions },
                    confidence: { type: "string", enum: ["high", "medium", "low"] },
                  },
                  required: ["category", "confidence"],
                  additionalProperties: false,
                },
              },
            },
          });
          const content = response.choices[0]?.message.content;
          if (typeof content !== "string") throw new Error("AI response did not include text content");
          const suggestion = aiCategorySchema.parse(JSON.parse(content));
          return { ...suggestion, source: "ai" as const };
        } catch (error) {
          console.warn("[Needs] AI categorization unavailable; using local keyword fallback.", error);
          return { category: getHeuristicCategory(input.description), confidence: "low" as const, source: "fallback" as const };
        }
      }),
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
