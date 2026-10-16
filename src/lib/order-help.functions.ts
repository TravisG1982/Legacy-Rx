import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const askOrderHelp = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ problem: z.string().trim().min(5).max(1000), step: z.string().trim().max(80) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { getOrderHelp } = await import("./order-help.server");
    try {
      return { ok: true as const, answer: await getOrderHelp(data.problem, data.step || "Not sure") };
    } catch (e) {
      const msg = (e as Error).message ?? "";
      const busy = /429|rate/i.test(msg);
      const credits = /402|credit/i.test(msg);
      return {
        ok: false as const,
        error: busy
          ? "Lots of people are asking right now. Please wait a minute and try again."
          : credits
            ? "The helper is temporarily unavailable. Please use the Contact page and we'll help you."
            : "We couldn't get guidance right now. Please try again or use the Contact page.",
      };
    }
  });
