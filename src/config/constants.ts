// CrediBridge — Application-wide constants

export const APP_NAME = "CrediBridge";
export const APP_TAGLINE = "Turning real financial behaviour into explainable credit access.";
export const APP_DESCRIPTION =
  "CrediBridge converts real earnings and payment behaviour into an explainable credit profile for gig and informal-sector workers.";

export const DISCLAIMER =
  "CrediBridge is a hackathon demonstration platform. The displayed score is a synthetic, internally defined demonstration score and is not a CIBIL score, credit-bureau score, lending decision, or financial guarantee.";

/** User roles */
export const ROLES = {
  WORKER: "WORKER",
  LENDER: "LENDER",
  ADMIN: "ADMIN",
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

/** Occupation presets */
export const OCCUPATION_TYPES = [
  "Delivery Rider",
  "Cab Driver",
  "Freelance Designer",
  "Domestic / Service Worker",
  "Small Vendor",
  "Independent Technician",
  "Content Creator",
  "Tutoring / Education",
  "Other",
] as const;

/** Data source categories */
export const DATA_CATEGORIES = [
  "gig_earnings",
  "utility_payments",
  "rent_payments",
  "other_recurring",
] as const;

export type DataCategory = (typeof DATA_CATEGORIES)[number];

/** Navigation routes */
export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  SIGNUP: "/signup",
  FORGOT_PASSWORD: "/forgot-password",
  DASHBOARD: "/dashboard",
  DASHBOARD_DATA: "/dashboard/data",
  DASHBOARD_HISTORY: "/dashboard/history",
  DASHBOARD_PROFILE_REPORT: "/dashboard/profile-report",
  DASHBOARD_RECOMMENDATIONS: "/dashboard/recommendations",
  ONBOARDING: "/onboarding",
  LENDER: "/lender",
  METHODOLOGY: "/methodology",
  FAIRNESS: "/fairness",
  PRIVACY: "/privacy",
  DEMO: "/demo",
} as const;
