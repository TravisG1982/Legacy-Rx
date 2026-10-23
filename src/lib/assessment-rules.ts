import { z } from "zod";
import {
  CONTRAINDICATIONS,
  HORMONE_CONTRAINDICATIONS,
  PROGRAM_TRACKS,
  STATES,
} from "./legacyrx-data";

export const assessmentTrackSchema = z.enum(["glp1", ...PROGRAM_TRACKS]);

export const assessmentStep1Schema = z.object({
  track: assessmentTrackSchema,
  state: z.string().refine((value) => STATES.includes(value), "Select a valid state."),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  phone: z
    .string()
    .refine((value) => value.replace(/\D/g, "").length === 10, "Enter a valid US phone number."),
  age18: z.literal("yes"),
  onGlp1: z.enum(["yes", "no"]),
  emailConsent: z.literal(true),
  emailMarketingConsent: z.boolean(),
  smsConsent: z.boolean(),
});

export const assessmentStep2Schema = z.object({
  track: assessmentTrackSchema,
  none: z.boolean(),
  conditions: z.array(z.number().int().nonnegative()).max(CONTRAINDICATIONS.length),
  labs: z.enum(["yes", "no"]).nullish(),
});

export function passesAssessmentStep2(input: z.infer<typeof assessmentStep2Schema>): boolean {
  const count =
    input.track === "glp1"
      ? CONTRAINDICATIONS.length
      : HORMONE_CONTRAINDICATIONS[input.track].length;
  return (
    input.none &&
    input.conditions.length === 0 &&
    (input.track === "glp1" ||
      input.track === "sh" ||
      input.labs === "yes" ||
      input.labs === "no") &&
    input.conditions.every((index) => index < count)
  );
}
