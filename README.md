# CrediBridge

**“Turning real financial behaviour into explainable credit access.”**

CrediBridge is an Explainable Micro-Credit Scoring Web Platform for Gig Workers and Informal-Sector Earners. It provides an alternative credit-scoring mechanism based on financial behaviour like gig earnings, utility payments, and work tenure, completely bypassing the traditional black-box bureau scoring.

Built for SIH 2026.

## Problem Statement

Gig workers and informal-sector earners often have real, consistent financial behaviour but little to no traditional bureau credit history. CrediBridge uses alternative financial signals to produce an **explainable creditworthiness score**.

The score is NOT a black box. Every major score contribution is visible, understandable, and supported by evidence.

## Architecture & Tech Stack

- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, Framer Motion, Recharts
- **Backend:** Next.js Server Actions / API Routes
- **Database:** PostgreSQL via Prisma ORM
- **Validation:** Zod

## Setup Instructions

1. **Clone the repository.**
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Environment Setup:**
   Copy `.env.example` to `.env` and configure your `DATABASE_URL` and `AUTH_SECRET`.
   ```bash
   cp .env.example .env
   ```
4. **Database Migration:**
   ```bash
   npx prisma migrate dev
   ```
5. **Run the development server:**
   ```bash
   npm run dev
   ```
6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Limitations & Fairness

- The displayed score is a synthetic, internally defined demonstration score and is not a CIBIL score.
- The scoring engine intentionally excludes attributes like religion, caste, gender, and arbitrary demographic proxies.
- The system incorporates volatility-aware logic to avoid over-penalizing normal gig-work income fluctuations.

## Documentation

- `docs/SCORING_METHODOLOGY.md` - Details the scoring logic and weights.
- `docs/ARCHITECTURE.md` - System design and technical choices.
- `docs/DEMO_GUIDE.md` - How to run the SIH 2026 demonstration.
