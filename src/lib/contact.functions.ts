import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  submissionId: z.string().uuid(),
  name: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .regex(/^[\p{L}][\p{L}\p{M}\s'.-]*$/u),
  email: z.string().trim().email().max(255),
  phone: z
    .string()
    .trim()
    .max(40)
    .refine((value) => {
      const digits = value.replace(/\D/g, "");
      return digits.length === 10 || (digits.length === 11 && digits.startsWith("1"));
    }),
  message: z.string().trim().min(10).max(4000),
  transactionalConsent: z.boolean(),
  marketingConsent: z.boolean(),
});

export const submitContactMessage = createServerFn({ method: "POST" })
  .validator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    const { processContactSubmission } = await import("./contact-submission.server");
    return processContactSubmission(data);
  });
