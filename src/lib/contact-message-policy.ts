/**
 * A conservative first-pass guard for the general support form. This catches
 * common health disclosures before storage or forwarding, but free text cannot
 * be classified perfectly. The form must also tell people what not to send.
 */
const MEDICAL_DETAILS = [
  /\b(?:symptoms?|diagnos(?:is|ed|es)|medical history|side effects?|adverse reactions?|allerg(?:y|ies|ic)|pregnan(?:t|cy)|breastfeed(?:ing)?)\b/i,
  /\b(?:dos(?:e|age|ing)|\d+(?:\.\d+)?\s?(?:mg|mcg|ml)|lab results?|blood tests?|blood pressure|blood sugar|test results?)\b/i,
  /\b(?:diabetes|cancer|thyroid|pancreatitis|depression|suicid(?:al|e)|nausea|vomit(?:ing)?|bleed(?:ing)?|infection|chest pain)\b/i,
  /\b(?:medications?|medicines?|prescriptions?|semaglutide|tirzepatide|testosterone|estradiol|enclomiphene|sermorelin|sildenafil|tadalafil|tretinoin)\b/i,
  /\b(?:feel|feeling)\s+(?:sick|dizzy|faint|nauseous|unwell)\b/i,
];

export function containsLikelyMedicalDetails(message: string): boolean {
  return MEDICAL_DETAILS.some((pattern) => pattern.test(message));
}
