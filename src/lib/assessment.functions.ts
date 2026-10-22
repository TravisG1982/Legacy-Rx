import { createServerFn } from "@tanstack/react-start";
import {
  assessmentStep1Schema,
  assessmentStep2Schema,
  assessmentTrackSchema,
  passesAssessmentStep2,
} from "./assessment-rules";

export const getAssessmentProgress = createServerFn({ method: "POST" })
  .validator((data: unknown) => assessmentTrackSchema.parse(data))
  .handler(async ({ data }) => {
    const { assessmentProgress } = await import("./assessment.server");
    return { step: await assessmentProgress(data) };
  });

export const submitAssessmentStep1 = createServerFn({ method: "POST" })
  .validator((data: unknown) => assessmentStep1Schema.parse(data))
  .handler(async ({ data }) => {
    const { beginAssessment } = await import("./assessment.server");
    await beginAssessment(data.track, data.email);
    return { step: 2 as const };
  });

export const submitAssessmentStep2 = createServerFn({ method: "POST" })
  .validator((data: unknown) => assessmentStep2Schema.parse(data))
  .handler(async ({ data }) => {
    if (!passesAssessmentStep2(data))
      throw new Error("Complete the required screening questions first.");
    const { finishAssessment } = await import("./assessment.server");
    await finishAssessment(data.track);
    return { step: 3 as const };
  });

export const invalidateAssessment = createServerFn({ method: "POST" }).handler(async () => {
  const { clearAssessment } = await import("./assessment.server");
  await clearAssessment();
  return { ok: true as const };
});
