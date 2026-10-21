import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

const MODEL = "gpt-5-mini";

const SYSTEM = `You are the LegacyRx order helper. Customers tell you where they are stuck while ordering a treatment online.
How ordering works: 1) Take the short assessment on legacyrx.net (Get started). 2) Pick a treatment. 3) You are taken to FuseHealth's secure form, where you answer health questions and pay. FuseHealth is the merchant of record and handles payment, refunds and cancellations. 4) A licensed provider usually reviews within about 1 day. 5) If approved, the pharmacy ships the medication. Order status can be checked on the account page after signing up with the same email.
Common fixes: refresh the page or start again from Get started (secure form links expire after about 30 minutes); allow pop-ups and turn off private browsing or content blockers; try another browser or device; check card details, billing ZIP, and card limits; Buy Now Pay Later is available at FuseHealth checkout, HSA/FSA is not; check spam for emails.
Rules: Give clear, numbered, practical next steps (max 5), plain words, under 150 words. Plain text only, no markdown or asterisks. Never give medical advice, dosing, eligibility, side-effect or drug-interaction guidance; for any health question say a licensed provider will answer it during review, and for urgent symptoms tell them to call 911. Never promise approval, refunds or delivery dates. Never invent prices, phone numbers or emails. If unresolved, suggest using the Contact page on legacyrx.net.`;

export async function getOrderHelp(problem: string, step: string): Promise<string> {
  const apiKey = process.env["OPENAI_API_KEY"];
  if (!apiKey) throw new Error("Help is not available right now.");
  const provider = createOpenAI({ apiKey });
  const result = streamText({
    model: provider.responses(MODEL),
    system: SYSTEM,
    messages: [{ role: "user", content: `Where I am: ${step}\nWhat's happening: ${problem}` }],
    providerOptions: {
      openai: {
        store: false,
        reasoningEffort: "low",
      },
    },
  });
  const text = (await result.text).replace(/\*\*|__|^#+\s*/gm, "").trim();
  if (!text) throw new Error("No guidance came back. Please try again.");
  return text;
}
