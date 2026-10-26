export const STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia",
  "Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland",
  "Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey",
  "New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina",
  "South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming",
];

export const CONTRAINDICATIONS = [
  "Currently or possibly pregnant, or actively trying to become pregnant",
  "Breastfeeding or bottle-feeding with breastmilk",
  "End-stage kidney disease (on or about to be on dialysis)",
  "Type 1 diabetes",
  "Type 2 diabetes on insulin",
  "Current or prior eating disorder (anorexia/bulimia)",
  "Current suicidal thoughts and/or prior suicidal attempt",
  "Cancer (active, in treatment, or in remission < 5 years)",
  "History of organ transplant on anti-rejection medication",
  "Severe gastrointestinal condition (gastroparesis, blockage, IBD)",
  "Heart attack or stroke in the past 12 months",
  "Personal or family history of thyroid cancer or MEN2 syndrome",
  "History of or current pancreatitis",
  "Diabetic retinopathy (diabetic eye disease)",
];

export const FAQS: [string, string][] = [
  ["What is LegacyRX?", "LegacyRX is a telehealth platform connecting U.S. adults with licensed providers and state-licensed pharmacies for compounded GLP-1 weight-management programs. We are not a medical practice or pharmacy."],
  ["How much does it cost?", "Compounded Semaglutide + B12 is $506.70 for a 3-month supply (about $168.90/month). Compounded Tirzepatide + Glycine is $525 for a 3-month supply ($175/month). Your exact price is shown before you pay."],
  ["Is the medication FDA-approved?", "No. Our semaglutide (compounded with B12) and tirzepatide (compounded with glycine) are compounded medications and are not FDA-approved. They are not the same as Ozempic, Wegovy, Mounjaro or Zepbound. The FDA does not evaluate compounded medications for safety, effectiveness, or quality. They contain the same active ingredients as some FDA-approved branded products but are different products."],
  ["Who qualifies?", "U.S. adults 18+ in eligible states. Eligibility is determined solely by a licensed clinician based on your confidential medical-history assessment. Not everyone qualifies."],
  ["How fast does it ship?", "After clinical approval, your medication ships from a U.S.-licensed compounding pharmacy with free express, cold-chain shipping - typically within a few business days."],
  ["Can I change or stop my plan?", "Contact support@legacyrx.net to ask about changing or stopping a plan. Refund and cancellation requests are reviewed under our Returns & Refund policy and applicable law."],
  ["What are the most common side effects?", "Most common side effects of GLP-1 medications include nausea, vomiting, diarrhea, constipation, abdominal pain, indigestion, decreased appetite, fatigue, and injection-site reactions. These often lessen over time."],
  ["How does the consultation work?", "You complete a 2-minute online health assessment. A licensed clinician in your state reviews your information, usually within 1 day. In some states a brief video or live-chat consultation may be required."],
  ["Where is the medication compounded?", "All medication is prepared by U.S.-based, state-licensed compounding pharmacies that meet applicable federal and state regulatory standards."],
  ["Is my information private?", "Yes. LegacyRX is HIPAA compliant and uses industry-standard security to protect your information. See our Privacy Policy and HIPAA Notice for details."],
];

export type Plan = {
  id: "12" | "6" | "3" | "1";
  label: string;
  sub: string;
  mo: number;
  total: number;
  save: number;
  badge: "" | "best" | "pop";
  badgeText: string;
  /** Intro pricing: this plan's price is a first-month rate, then this monthly rate. */
  then?: number;
};
export type MedKey = "sema" | "tirz" | "trt_inj" | "trt_cream" | "enclo" | "estradiol" | "nad" | "sermorelin" | "skin_cream" | "sildenafil" | "tadalafil";
export const MED_KEYS = ["sema", "tirz", "trt_inj", "trt_cream", "enclo", "estradiol", "nad", "sermorelin", "skin_cream", "sildenafil", "tadalafil"] as const satisfies readonly MedKey[];

/** Product line: weight loss (GLP-1), men's testosterone (TRT) or women's hormones (HRT). */
export type Track = "glp1" | "trt" | "hrt" | "aa" | "sh";
export type ProgramTrack = Exclude<Track, "glp1">;
export const PROGRAM_TRACKS = ["trt", "hrt", "aa", "sh"] as const satisfies readonly ProgramTrack[];

type MedDef = { name: string; co: string; plans: Plan[] };
const hormonePlans = (one: number, threeMo: number): Plan[] => [
  { id: "3", label: "3 Month Plan", sub: "Most customers choose this", mo: threeMo, total: threeMo * 3, save: (one - threeMo) * 3, badge: "pop", badgeText: "POPULAR" },
  { id: "1", label: "Monthly Plan", sub: "Start with one month", mo: one, total: one, save: 0, badge: "", badgeText: "" },
];

const monthlyOnly = (one: number): Plan[] => [
  { id: "1", label: "Monthly Plan", sub: "Ships every month", mo: one, total: one, save: 0, badge: "pop", badgeText: "POPULAR" },
];

export const MEDS: Record<MedKey, MedDef> = {
  sema: {
    name: "Semaglutide",
    co: "Semaglutide + B12",
    plans: [
      { id: "3", label: "3 Month Plan", sub: "3-month supply", mo: 168.9, total: 506.7, save: 0, badge: "pop", badgeText: "POPULAR" },
    ],
  },
  tirz: {
    name: "Tirzepatide",
    co: "Tirzepatide + Glycine",
    plans: [
      { id: "3", label: "3 Month Plan", sub: "3-month supply", mo: 175, total: 525, save: 0, badge: "pop", badgeText: "POPULAR" },
    ],
  },
  trt_inj: { name: "Testosterone Injection", co: "Testosterone Cypionate Injection", plans: [{ id: "3", label: "3 Month Plan", sub: "3-month supply", mo: 97.32, total: 291.95, save: 0, badge: "pop", badgeText: "POPULAR" }, { id: "1", label: "Monthly Plan", sub: "Start with one month", mo: 204, total: 204, save: 0, badge: "", badgeText: "" }] },
  trt_cream: { name: "Testosterone Cream", co: "Testosterone Cream (Daily Pump)", plans: hormonePlans(129, 109) },
  enclo: { name: "Enclomiphene", co: "Enclomiphene Citrate", plans: [{ id: "3", label: "3 Month Plan", sub: "3-month supply", mo: 121.16, total: 363.49, save: 0, badge: "pop", badgeText: "POPULAR" }, { id: "1", label: "Monthly Plan", sub: "Start with one month", mo: 216.5, total: 216.5, save: 0, badge: "", badgeText: "" }] },
  estradiol: { name: "Estradiol Cream", co: "Estradiol Cream", plans: hormonePlans(99, 79) },
  nad: { name: "NAD+ Injection", co: "NAD+ Injection", plans: monthlyOnly(172.8) },
  sermorelin: { name: "Sermorelin", co: "Sermorelin Injection", plans: hormonePlans(179, 149) },
  skin_cream: { name: "Anti-Aging Skin Cream", co: "Estriol / Tretinoin Cream", plans: hormonePlans(99, 69) },
  sildenafil: { name: "Sildenafil", co: "Sildenafil 100mg Tablets", plans: monthlyOnly(253.64) },
  tadalafil: { name: "Daily Tadalafil", co: "Tadalafil 5mg Daily Tablets", plans: monthlyOnly(254.9) },
};

/** Per-product details beyond pricing: product line and copy. */
export const MED_INFO: Record<MedKey, { track: Track; blurb: string; labs?: boolean }> = {
  sema: { track: "glp1", blurb: "Weekly GLP-1 injection for weight loss" },
  tirz: { track: "glp1", blurb: "Dual-action GLP-1/GIP weight-loss injection" },
  trt_inj: { track: "trt", blurb: "Weekly injection - the most proven way to restore testosterone", labs: true },
  trt_cream: { track: "trt", blurb: "Daily pump cream - no needles" },
  enclo: { track: "trt", blurb: "Daily pill that helps your body make more of its own testosterone" },
  estradiol: { track: "hrt", blurb: "Bioidentical estrogen cream for menopause symptoms" },
  nad: { track: "aa", blurb: "Cellular energy support for focus, recovery and healthy aging" },
  sermorelin: { track: "aa", blurb: "Supports your body's natural growth hormone for sleep, recovery and body composition" },
  skin_cream: { track: "aa", blurb: "Prescription cream to smooth fine lines and firm skin" },
  sildenafil: { track: "sh", blurb: "Take as needed, about an hour before - works for 4-6 hours" },
  tadalafil: { track: "sh", blurb: "One small pill a day - always ready" },
};

export const medsForTrack = (t: Track): MedKey[] => MED_KEYS.filter((k) => MED_INFO[k].track === t && Boolean(FUSE_PROGRAM_IDS[k]));
export const isMedKey = (v: unknown): v is MedKey => typeof v === "string" && (MED_KEYS as readonly string[]).includes(v);

/** Screening questions for hormone programs; any "yes" means not eligible online. */
export const HORMONE_CONTRAINDICATIONS: Record<ProgramTrack, string[]> = {
  trt: [
    "Prostate or breast cancer (current or past)",
    "Heart attack or stroke in the past 12 months",
    "Blood clot (DVT or pulmonary embolism) in the past",
    "Untreated severe sleep apnea",
    "Trying to conceive a child in the next 12 months",
    "Hematocrit / red blood cell count known to be high",
  ],
  hrt: [
    "Currently or possibly pregnant, or breastfeeding",
    "Breast, uterine or ovarian cancer (current or past)",
    "Blood clot (DVT or pulmonary embolism) or stroke in the past",
    "Unexplained vaginal bleeding",
    "Active liver disease",
    "Heart attack in the past 12 months",
  ],
  aa: [
    "Currently or possibly pregnant, or breastfeeding",
    "Active cancer or cancer treatment in the past 5 years",
    "Active liver or kidney disease",
    "Uncontrolled thyroid disease",
    "Heart attack or stroke in the past 12 months",
  ],
  sh: [
    "Take nitrate medication (nitroglycerin, isosorbide) or use \"poppers\"",
    "Heart attack, stroke or serious heart rhythm problem in the past 6 months",
    "Very low blood pressure or uncontrolled high blood pressure",
    "Chest pain during sex or exercise",
    "Severe liver or kidney disease",
    "Take riociguat (Adempas)",
  ],
};

// Centralized mapping: medication + plan -> internal product ID.
export const CHECKOUT_PRODUCT_IDS: Record<MedKey, Partial<Record<Plan["id"], string>>> = {
  sema: { "1": "487", "3": "515", "6": "574", "12": "606" },
  tirz: { "1": "488", "3": "516", "6": "575", "12": "607" },
  trt_inj: { "1": "trt_inj_1", "3": "trt_inj_3" },
  trt_cream: { "1": "trt_cream_1", "3": "trt_cream_3" },
  enclo: { "1": "enclo_1", "3": "enclo_3" },
  estradiol: { "1": "estradiol_1", "3": "estradiol_3" },
  nad: { "1": "nad_1", "3": "nad_3" },
  sermorelin: { "1": "sermorelin_1", "3": "sermorelin_3" },
  skin_cream: { "1": "skin_cream_1", "3": "skin_cream_3" },
  sildenafil: { "1": "sildenafil_1" },
  tadalafil: { "1": "tadalafil_1" },
};


export type CheckoutProduct = {
  productId: string;
  name: string;
  months: number;
  monthly: number;
  total: number;
  planLabel: string;
};

/** Resolves the catalog product (name + LegacyRx product ID + price) for a plan. */
export function productFor(med: MedKey, planId: Plan["id"]): CheckoutProduct {
  const meds = MEDS[med];
  const plan = meds.plans.find((p) => p.id === planId) ?? meds.plans[0]!;
  const months = Number(plan.id);
  return {
    productId: CHECKOUT_PRODUCT_IDS[med][plan.id] ?? `${med}_${plan.id}`,
    name: `${meds.co} - ${plan.label}`,
    months,
    monthly: plan.mo,
    total: plan.total,
    planLabel: plan.label,
  };
}


/** USPS two-letter codes for the states we ship to. */
export const STATE_CODES: Record<string, string> = {
  Alabama: "AL", Alaska: "AK", Arizona: "AZ", Arkansas: "AR", California: "CA", Colorado: "CO",
  Connecticut: "CT", Delaware: "DE", Florida: "FL", Georgia: "GA", Hawaii: "HI", Idaho: "ID",
  Illinois: "IL", Indiana: "IN", Iowa: "IA", Kansas: "KS", Kentucky: "KY", Louisiana: "LA",
  Maine: "ME", Maryland: "MD", Massachusetts: "MA", Michigan: "MI", Minnesota: "MN",
  Mississippi: "MS", Missouri: "MO", Montana: "MT", Nebraska: "NE", Nevada: "NV",
  "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY",
  "North Carolina": "NC", "North Dakota": "ND", Ohio: "OH", Oklahoma: "OK", Oregon: "OR",
  Pennsylvania: "PA", "Rhode Island": "RI", "South Carolina": "SC", "South Dakota": "SD",
  Tennessee: "TN", Texas: "TX", Utah: "UT", Vermont: "VT", Virginia: "VA", Washington: "WA",
  "West Virginia": "WV", Wisconsin: "WI", Wyoming: "WY",
};

/** FuseHealth Brand API program per product (1-month bundles). Products without one are hidden. */
export const FUSE_PROGRAM_IDS: Partial<Record<MedKey, string>> = {
  sema: "8848120a-ba87-444c-b143-4ff3af5a393c", // Semaglutide 1 Month Bundle - All Strengths
  tirz: "2de2ca0f-67ef-4dba-942a-cbca0093cd94", // Tirzepatide/Glycine 1.5mg alternative (3 month)
  trt_inj: "d1fbe2e4-52a7-4174-827e-08ad8bb2b7ba", // Testosterone — Injectable
  enclo: "3ee7293b-47b7-4939-89ca-15349ae6be38", // Enclomiphene Questionnaire Program
  sildenafil: "76127921-a47a-4c71-a614-5ef0133fb931", // Mens Sexual Health Questionnaire Program
  tadalafil: "76127921-a47a-4c71-a614-5ef0133fb931",
  nad: "24ad9d9c-0d4d-4c24-b38a-b6d8411f8bbc", // NAD+ 1-Mo Supply (1)10ml
};
export const hasFuseProgram = (k: MedKey): boolean => Boolean(FUSE_PROGRAM_IDS[k]);
