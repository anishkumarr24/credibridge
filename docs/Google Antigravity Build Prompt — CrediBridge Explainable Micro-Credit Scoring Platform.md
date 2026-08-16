# Build CrediBridge — Explainable Micro-Credit Scoring Platform for Gig & Informal Workers

You are an expert full-stack engineer, product designer, UX designer, data engineer, testing engineer, and technical architect.

Build a complete, polished, production-style web application called **CrediBridge** based on the following SIH 2026 fintech problem statement:

> **Explainable Micro-Credit Scoring Web Platform for Gig Workers and Informal-Sector Earners**

The application must solve the core problem:

Gig workers and informal-sector earners may have real and consistent financial behaviour but little or no traditional bureau credit history. The platform must use alternative financial signals such as gig earnings, utility payment history, rent/payment records, work/platform tenure and earnings trends to produce an **explainable creditworthiness score**.

The score must NOT be a black box.

Every major score contribution must be visible, understandable and supported by evidence.

The SIH problem statement explicitly requires:
- worker login
- connection/upload/manual entry of alternative financial signals
- CSV upload is acceptable for the demo
- no real banking API integration is required
- a creditworthiness score derived from alternative signals
- human-readable explanations of what improves or reduces the score
- a transparent rule-weighted scoring model
- score history
- realistic synthetic datasets
- a database
- optional lender-facing dashboard as a stretch goal
- consideration of gig-worker income volatility, fairness and bias

Do not replace this concept with a generic expense tracker, generic loan app, generic CIBIL clone or generic AI dashboard.

The differentiator MUST be:

**Explainability + alternative financial signals + gig/informal worker focus.**

---

# 1. PRODUCT VISION

Product name:

**CrediBridge**

Tagline:

**“Turning real financial behaviour into explainable credit access.”**

The website should look like a serious modern fintech startup rather than a college-project website.

Design references should be inspired by the quality and usability of modern fintech products such as Stripe, Razorpay, Revolut, Linear and modern banking dashboards, but DO NOT copy their exact layouts or branding.

The interface must feel:
- trustworthy
- modern
- premium
- accessible
- clean
- data-rich
- simple for first-time users
- impressive during a hackathon demonstration

Use polished animations but never sacrifice usability.

---

# 2. IMPORTANT EXECUTION RULE

Do NOT generate the entire application as one giant unverified implementation.

Build it **phase by phase**.

For every phase:

1. inspect the existing project
2. create an implementation plan
3. implement the phase
4. run the application
5. run tests
6. inspect the website in a browser
7. fix visual or functional problems
8. verify that existing functionality still works
9. only then continue to the next phase

Do not stop after generating code.

Do not leave placeholder buttons that do nothing.

Do not leave fake navigation links.

Every major visible interaction must work.

Use browser-based verification wherever possible.

At the end, perform a complete end-to-end test as if you were a hackathon judge.

---

# 3. RECOMMENDED TECH STACK

Use a modern TypeScript full-stack architecture.

Preferred stack:

Frontend:
- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui or an equivalent polished component system
- Lucide icons
- Recharts or another reliable chart library
- Framer Motion for meaningful animations

Backend:
- Next.js server routes/API routes OR a clean Node/Express backend if that gives a better architecture
- TypeScript

Database:
- PostgreSQL
- Prisma ORM

Authentication:
- secure email/password authentication
- role-based access
- worker role
- lender role
- demo/admin role

Validation:
- Zod

CSV:
- robust CSV parser
- validation
- clear error messages
- preview before import

Testing:
- unit tests
- API tests
- scoring-engine tests
- end-to-end tests
- browser verification

Deployment readiness:
- make the app suitable for Vercel + PostgreSQL/Neon/Supabase
- provide `.env.example`
- provide setup documentation

Do not introduce unnecessary technologies merely to make the stack look complex.

Prioritize reliability.

---

# 4. CORE USER JOURNEY

Implement this complete flow:

Landing page
→ Sign up / Login
→ Worker onboarding
→ Profile
→ Connect/add data
→ Upload CSV or enter data manually
→ Data validation
→ Data preview
→ Score calculation
→ Explainable score dashboard
→ Factor details
→ Recommendations
→ Score history
→ Generate/share credit profile
→ Lender-facing view

The entire journey must be demonstrable using synthetic data without requiring any external bank integration.

---

# 5. LANDING PAGE

Create an outstanding landing page.

Hero section:

Headline:

**Your financial behaviour deserves to be seen.**

Subheadline:

**CrediBridge converts real earnings and payment behaviour into an explainable credit profile for gig and informal-sector workers.**

Primary CTA:

**Build My Credit Profile**

Secondary CTA:

**See How It Works**

Add a subtle animated visualization representing:

Financial signals
→ Scoring engine
→ Explainable score
→ Credit opportunity

Include sections:

### Problem

Explain why traditional bureau history can exclude workers who have real income but little formal credit history.

### How CrediBridge Works

Three/four steps:

1. Add your financial signals
2. Analyze your financial behaviour
3. Receive your explainable score
4. Share your credit profile

### Alternative Signals

Cards for:
- Gig earnings
- Utility payments
- Rent/payment records
- Work/platform tenure
- Earnings trends

### Explainability

Show an example:

**742 / 1000**

Positive:
- Stable earnings
- Consistent utility payments
- Long platform tenure

Negative:
- Recent earnings decline

Explain that users can see exactly why their score moved.

### For Workers

Explain benefits.

### For Lenders

Explain transparent evidence-based assessment.

### Fairness

Explain that the system is designed to avoid blindly penalizing normal gig-work volatility.

### Security & Privacy

Explain that users control their financial data and consent.

### CTA

**Create Your Explainable Credit Profile**

Footer:
- Product
- For Workers
- For Lenders
- Privacy
- Terms
- Contact
- Demo

---

# 6. AUTHENTICATION

Implement polished authentication screens.

Pages:
- Login
- Sign up
- Forgot password
- Reset password
- Role selection
- Demo login

Roles:

WORKER
LENDER
ADMIN/DEMO

The demo should allow judges to quickly enter the application.

Create clearly marked demo accounts or demo mode.

Do not require a real email delivery service to demonstrate the application.

---

# 7. WORKER ONBOARDING

Create a multi-step onboarding wizard.

Step 1:
Personal/profile information

Fields:
- name
- phone
- location
- occupation type
- primary platform
- platform tenure
- optional monthly expenses

Examples:
- delivery rider
- cab driver
- freelance designer
- domestic/service worker
- small vendor
- independent technician

Step 2:
Financial signal setup

Choose:
- Gig earnings
- Utility payments
- Rent payments
- Other recurring payments

Step 3:
Data source

Options:
- Upload CSV
- Enter manually
- Use synthetic demo data

Step 4:
Consent

Explain exactly what data will be used and why.

Include a clean consent interface.

---

# 8. WORKER DASHBOARD

Create a premium dashboard.

Top section:

Greeting:

**Good morning, Rahul**

Main score card:

**742 / 1000**

Label:

**Good Credit Potential**

Show:
- score
- score category
- score change from previous analysis
- last updated date
- confidence/data completeness indicator

Add CTA:

**Improve My Score**

and:

**Generate Credit Profile**

---

# 9. SCORE VISUALIZATION

Create a beautiful interactive score visualization.

Use a circular/radial score indicator.

Show ranges:

0–399
400–549
550–649
650–749
750–849
850–1000

Do not present these ranges as official banking regulatory thresholds.

Clearly label them as:

**CrediBridge internal demonstration score bands**

The score should be calculated dynamically.

---

# 10. EXPLAINABILITY PANEL

This is the most important section of the entire product.

Heading:

**Why your score is 742**

Display each scoring factor as a card.

Example:

### Income Consistency
82/100
**+246 points**

Explanation:

“Your earnings have remained relatively consistent over the last 6 months.”

Evidence:
- Average monthly earnings
- Median monthly earnings
- volatility
- number of observed months

### Payment Regularity
91/100
**+227 points**

Explanation:

“You made 11 of 12 recurring payments on time.”

Evidence:
- payments due
- payments completed
- on-time percentage
- late-payment count

### Earnings Trend
68/100
**+136 points**

Explanation:

“Your average earnings improved over the previous 3 months.”

Chart.

### Platform Tenure
85/100
**+128 points**

Explanation:

“You have been active on your primary platform for 18 months.”

### Resilience / Stability
70/100
**+70 points**

Explanation:
“Your earnings recovered after a temporary decline.”

Each factor must have:
- score
- contribution
- weight
- human-readable explanation
- evidence
- chart when appropriate

Also add:

**What is hurting your score?**

Example:

“Your income declined by 18% during the most recent month. Because this decline is currently short-term and shows signs of recovery, the system applies only a limited penalty.”

This is extremely important for addressing the gig-worker volatility issue.

---

# 11. SCORING ENGINE

Create a dedicated scoring-engine module.

Do NOT put scoring logic directly inside UI components.

Create a clean service such as:

`scoringEngine.ts`

It must accept normalized financial data and return:

- total score
- factor scores
- factor weights
- factor contributions
- positive explanations
- negative explanations
- evidence
- confidence/data completeness
- score metadata
- calculation timestamp
- model/scoring-engine version

Use a transparent rule-weighted model.

Recommended demonstration configuration:

Income consistency:
30%

Payment regularity:
25%

Earnings trend:
20%

Platform/work tenure:
15%

Income resilience/stability:
10%

Total:
100%

Start from a base scale of 0–1000.

Make all weights configurable in one clearly documented configuration file.

Do NOT hardcode scattered numbers throughout the project.

---

# 12. VOLATILITY-AWARE SCORING

This is a critical requirement.

Gig income naturally fluctuates.

The model must NOT simply calculate:

“income dropped = bad”

Instead distinguish between:

- temporary fluctuation
- seasonal variation
- isolated bad week/month
- sustained decline
- repeated instability
- recovery after decline

Implement transparent heuristic rules.

Example:

If income decreases temporarily for one period but subsequently recovers:
- small or no penalty

If income declines for multiple consecutive periods:
- larger penalty

If income is highly variable but the long-term median is stable:
- do not over-penalize

If the worker has too little data:
- lower confidence rather than arbitrarily giving a bad score

Every such decision must be visible in the explanation.

---

# 13. CONFIDENCE SCORE

Add a second metric:

**Data Confidence**

Example:

**87% confidence**

It should depend on:
- number of months of data
- number of transactions/payment observations
- number of signal categories
- completeness
- consistency of imported data

Important:

Do NOT pretend the confidence percentage represents statistical certainty.

Label it:

**Data completeness/confidence indicator**

This is a product-level transparency metric.

---

# 14. DATA UPLOAD

Create a dedicated page:

`/dashboard/data`

Sections:

### Data Sources

Cards:
- Gig earnings
- Utility payments
- Rent payments
- Other recurring payments

Each card displays:
- connected/not connected
- number of records
- latest data date
- data quality

### CSV Upload

Create a drag-and-drop upload interface.

Features:
- drag and drop
- file picker
- file validation
- CSV parsing
- preview
- column mapping
- duplicate detection
- malformed row detection
- import confirmation

Never silently discard bad records.

Show:

**42 records detected**
**39 valid**
**2 duplicates**
**1 invalid**

Then allow:

**Import 39 valid records**

---

# 15. CSV FORMAT SUPPORT

Support realistic CSV templates.

Example earnings columns:

date
platform
gross_earnings
incentives
working_hours
trips
net_earnings

Example payment columns:

date
category
amount
due_date
paid_date
status

Provide downloadable sample templates.

Also provide:

**Download sample earnings CSV**

and:

**Download sample payments CSV**

---

# 16. MANUAL DATA ENTRY

Create polished forms for manual entry.

Earnings:
- date
- platform
- gross earnings
- incentives
- deductions
- net earnings
- working hours
- trips

Payments:
- type
- due date
- paid date
- amount
- status

Allow adding many records without leaving the screen.

Use tables with edit/delete functionality.

---

# 17. SYNTHETIC DATA GENERATOR

This is very important for the hackathon demo.

Create a realistic synthetic-data generator.

Presets:

### Stable delivery worker
- stable monthly income
- high payment regularity
- moderate weekly volatility

### Seasonal worker
- strong seasonal variations
- otherwise stable behaviour

### Growing worker
- increasing earnings

### Unstable worker
- irregular earnings
- missed payments

### Recovery worker
- previous decline
- recent recovery

### Freelance worker
- uneven project-based earnings

### Cab driver
- daily/weekly earning patterns

The generated data must look realistic.

Do not generate five identical rows.

Create at least 6–12 months of varied records.

Make the demo dataset deterministic when a seed is supplied so tests remain reproducible.

---

# 18. SCORE HISTORY

Create:

`/dashboard/history`

Show:

- previous scores
- score changes
- factor changes
- dates
- data updates

Interactive line chart.

Example:

January: 661
February: 678
March: 690
April: 704
May: 721
June: 742

Clicking a point should show:

**Why did your score change?**

Example:

“Payment regularity improved from 81% to 91%.”

“Recent earnings recovered.”

This is a strong storytelling feature for the hackathon.

---

# 19. IMPROVEMENT RECOMMENDATIONS

Create an:

**Improve Your Score**

section.

Do not give generic advice.

Generate recommendations from the actual score factors.

Examples:

“Your utility-payment consistency is currently 73%.”

“Three payments were recorded after the due date.”

“Maintaining on-time payments over the next few months could improve this factor.”

Another:

“Your earnings trend is currently stable but not strongly positive.”

“Your most recent 3-month median is 8% higher than your previous period.”

Recommendations must reference evidence.

Avoid promising that a certain action will definitely increase a future score.

---

# 20. CREDIT PROFILE

Create a polished shareable/downloadable credit profile.

Page:

`/dashboard/profile-report`

Show:
- worker profile
- CrediBridge score
- score category
- data confidence
- factor breakdown
- evidence summary
- score history
- scoring methodology
- timestamp
- model/scoring version
- data source summary

Add buttons:

**Download PDF**

**Share Secure Link**

For a hackathon demo, the secure link can be a generated simulated public profile URL.

Clearly label it as:

**CrediBridge demonstration credit profile**

Do not imply that it is an official credit bureau report.

---

# 21. LENDER DASHBOARD

Build the stretch-goal lender portal.

Route:

`/lender`

Dashboard metrics:

- applications
- average CrediBridge score
- high-potential profiles
- profiles needing review
- average data confidence

Application table:

- applicant
- occupation
- score
- confidence
- income trend
- payment regularity
- platform tenure
- status

Click an applicant.

---

# 22. LENDER APPLICANT DETAIL PAGE

Create an impressive lender review screen.

Top:

Applicant:
Rahul Kumar

Score:
742 / 1000

Data confidence:
87%

Status:
**Review**

Then:

### Score Breakdown

Show every factor.

### Evidence

- monthly income chart
- payment history
- tenure
- trend
- recent changes

### Explainable Decision Summary

Example:

“Primary strengths are consistent earnings, strong payment regularity and long platform tenure.”

“Primary weakness is a recent earnings decline that currently appears temporary.”

### Auditability

Show:

- scoring engine version
- calculation timestamp
- factors used
- datasets used
- rules triggered

Buttons:

**Request More Information**

**Mark for Review**

**Approve — Demo**

**Decline — Demo**

Make it very obvious these decisions are simulated hackathon workflows.

---

# 23. FAIRNESS / BIAS PAGE

Create a transparency page.

Explain:

### What we intentionally avoid

Do not use:
- religion
- caste
- gender
- unrelated sensitive personal attributes
- arbitrary demographic proxies

Do not allow platform identity alone to determine the score.

Show:

### Known limitations

For example:
- limited historical data
- platform-specific reporting differences
- synthetic dataset limitations
- regional income differences
- possible selection bias

Show:

**“We are aware of these limitations.”**

Then show possible mitigation strategies.

This directly addresses the judge-preparation section of the problem statement.

---

# 24. METHODOLOGY PAGE

Create:

`/methodology`

This page should be judge-friendly.

Explain:

### Signal 1 — Income Consistency

Why it matters.

How it is measured.

Maximum weight.

### Signal 2 — Payment Regularity

Why it matters.

How it is measured.

### Signal 3 — Earnings Trend

Why it matters.

### Signal 4 — Tenure

Why it matters.

### Signal 5 — Stability/Resilience

Why it matters.

Then display the exact scoring formula in a clean visual format.

Make the methodology understandable without technical knowledge.

---

# 25. ADMIN / DEMO CONSOLE

Create a lightweight admin dashboard.

Features:
- synthetic user list
- generated datasets
- score distribution
- average score
- factor distribution
- number of uploaded records
- data completeness
- simulation controls

Create demo scenarios:

**Stable Worker**

**Growing Worker**

**Seasonal Worker**

**Unstable Worker**

**Recovering Worker**

A judge should be able to click one and instantly demonstrate a different scoring outcome.

---

# 26. ANALYTICS

Create useful charts.

Worker dashboard:
- earnings over time
- payment regularity
- score history
- factor contribution

Lender dashboard:
- score distribution
- income trend distribution
- payment consistency
- applicant risk/strength categories

Admin:
- dataset coverage
- average data confidence
- score distribution
- factor impact

Do not use misleading charts.

Every chart needs a label and meaningful units.

---

# 27. DESIGN SYSTEM

Create a unified design system.

Style:
- premium fintech
- clean cards
- subtle gradients
- generous spacing
- rounded corners
- modern typography
- excellent mobile responsiveness

Avoid:
- excessive gradients
- too many floating cards
- cartoonish graphics
- unnecessary animation
- huge empty spaces
- generic bootstrap appearance

Use:
- subtle hover effects
- animated score counters
- smooth progress bars
- skeleton loaders
- tasteful page transitions
- tooltips
- empty states
- success states
- validation states

Create both:
- light theme
- dark theme

Remember accessibility:
- keyboard navigation
- readable contrast
- clear labels
- focus states
- reduced-motion support

---

# 28. MOBILE RESPONSIVENESS

The website must work properly on:

- desktop
- laptop
- tablet
- mobile

Do not merely shrink desktop elements.

Reorganize layouts intelligently on small screens.

---

# 29. NOTIFICATIONS

Create an in-app notification center.

Examples:
- score recalculated
- new data imported
- data quality issue
- score improved
- lender profile requested
- report generated

Use demo/mock notifications.

---

# 30. PRIVACY / CONSENT

Create:

`/privacy`

and data-consent components.

Explain:
- what data is collected
- why it is used
- what score factors use it
- what is not collected
- user control
- demo/synthetic-data limitations

Provide:

**Delete my uploaded data**

for the demo.

Deletion should actually remove the associated data in the database.

---

# 31. DATABASE DESIGN

Create a clean Prisma schema.

Suggested entities:

User
WorkerProfile
LenderProfile
FinancialSource
EarningRecord
PaymentRecord
Score
ScoreFactor
ScoreHistory
Recommendation
CreditProfile
ConsentRecord
Application
Notification
AuditLog
SyntheticDataset

Add proper relationships.

Use timestamps.

Use indexes where appropriate.

Keep the schema maintainable.

---

# 32. API DESIGN

Create a clean API layer.

Examples:

POST /api/auth/...

GET /api/worker/profile

PUT /api/worker/profile

POST /api/data/earnings/import

POST /api/data/payments/import

POST /api/data/manual

GET /api/data

POST /api/score/calculate

GET /api/score/current

GET /api/score/history

GET /api/score/explanations

GET /api/recommendations

GET /api/credit-profile

GET /api/lender/applications

GET /api/lender/applications/:id

POST /api/lender/applications/:id/status

POST /api/demo/generate-data

Use validation for every request.

Return clean error responses.

---

# 33. SECURITY

For a hackathon implementation, include sensible security practices:

- password hashing
- protected routes
- role-based authorization
- input validation
- safe CSV parsing
- file-size limits
- server-side validation
- no secret keys in frontend
- environment variables
- sanitized user content
- audit logging for important score changes

Do not expose database credentials.

Create `.env.example`.

---

# 34. ERROR HANDLING

Every major flow needs good errors.

Examples:

Invalid CSV:
“Your file contains 3 invalid rows. Review them before importing.”

No data:
“We don't have enough information to calculate a reliable score yet.”

Insufficient history:
“You currently have only 1 month of data. Add more history to improve data confidence.”

Server error:
“Something went wrong. Your existing data has not been changed.”

Do not show raw stack traces to users.

---

# 35. EMPTY STATES

Every dashboard section needs a useful empty state.

Example:

No earnings data:

**Add your earnings history**

“Upload a CSV or enter your earnings manually.”

Button:

**Add earnings**

No score:

**Your score is ready when your data is ready.**

Button:

**Add financial data**

---

# 36. DEMO EXPERIENCE

Optimize the product for an SIH judge demonstration.

Create a demo flow that takes roughly 2–3 minutes.

Demo path:

Landing page
→ Demo Worker Login
→ Stable Worker
→ Dashboard
→ Score 742
→ Explain score
→ Show income chart
→ Show payment regularity
→ Show score history
→ Show improvement recommendation
→ Open lender view
→ Same worker's evidence shown to lender

Then show:

**Seasonal Worker**

and demonstrate that the model does NOT aggressively punish normal temporary volatility.

Then show:

**Unstable Worker**

and demonstrate a lower score with understandable reasons.

This will make the project much more defensible.

---

# 37. JUDGE MODE

Create a hidden or visible:

**Judge Demo Mode**

Include shortcuts to:

- Stable Worker
- Seasonal Worker
- Growing Worker
- Unstable Worker
- Recovery Worker
- Lender Dashboard
- Methodology
- Fairness

The judge should be able to navigate the entire concept quickly.

---

# 38. SCORE EXPLANATION GENERATION

Do NOT make the score explanation depend on an opaque LLM.

The primary explanations must come directly from deterministic scoring rules.

Optional AI can be used ONLY to turn already-calculated structured facts into more natural language.

The actual score must always remain deterministic and auditable.

Store:

rule_id
factor
condition
impact
explanation

Example:

RULE_INCOME_RECOVERY_01

Factor:
Income Resilience

Condition:
recent_income < previous_income AND recovery_detected = true

Impact:
-2

Explanation:
“Recent earnings declined, but subsequent recovery reduces the penalty because the decline appears temporary.”

---

# 39. OPTIONAL GEMINI INTEGRATION

If useful, add an optional Gemini integration for:

- natural-language financial insights
- user-friendly summaries
- lender summary generation
- data anomaly explanation

But AI must NEVER secretly decide the credit score.

The application must work without Gemini.

The deterministic scoring engine is the source of truth.

Keep the Gemini feature clearly labelled.

---

# 40. SCORE AUDIT TRAIL

Every score calculation should create an audit record containing:

- score
- score factors
- weights
- contributions
- input dataset IDs
- triggered rules
- scoring version
- calculation date
- confidence value

This is important for transparency.

---

# 41. SCORE COMPARISON

Allow workers to compare:

**Current score vs previous score**

Display:

Score:
742
Previous:
721
Change:
+21

Then explain:

“Your payment regularity improved from 83% to 91%.”

“Your earnings trend improved.”

“Your platform tenure increased.”

This should make score movement understandable.

---

# 42. DATA QUALITY SYSTEM

Every imported dataset should receive:

Data Quality:
Excellent / Good / Needs Attention

Check:
- missing dates
- impossible amounts
- duplicate rows
- invalid dates
- missing payment dates
- inconsistent values

Show exactly what needs correction.

---

# 43. REALISTIC SYNTHETIC DATA

Seed the database with realistic worker profiles.

Generate at least:

10–20 synthetic workers

Across different occupations and patterns.

Do not generate identical records.

Each worker should have:
- 6–12 months earnings
- payment history
- work/platform tenure
- varied income
- different score profiles

Use fixed seeds for deterministic testing.

---

# 44. LANDING PAGE STORYTELLING

The landing page should tell the story in this order:

Problem
→ Invisible financial behaviour
→ Alternative signals
→ Transparent scoring
→ Explainability
→ Worker empowerment
→ Lender trust
→ Fairness
→ Call to action

Make this visually engaging.

---

# 45. FOOTER DISCLOSURE

Add a clear disclaimer:

**CrediBridge is a hackathon demonstration platform. The displayed score is a synthetic, internally defined demonstration score and is not a CIBIL score, credit-bureau score, lending decision, or financial guarantee.**

This is important.

---

# 46. DOCUMENTATION

Create:

README.md

Include:

- product overview
- problem statement
- architecture
- tech stack
- setup instructions
- environment variables
- database migration
- seed command
- demo credentials
- scoring methodology
- API structure
- testing
- deployment
- limitations
- fairness considerations

Also create:

`docs/SCORING_METHODOLOGY.md`

`docs/ARCHITECTURE.md`

`docs/DEMO_GUIDE.md`

---

# 47. TESTING

Write tests for the scoring engine.

At minimum:

Test stable earnings.

Test declining earnings.

Test recovering earnings.

Test high payment regularity.

Test missed payments.

Test limited data.

Test seasonal volatility.

Test duplicate CSV rows.

Test invalid data.

Test score boundaries.

Test weight totals equal 100%.

Test explanation generation.

Also test complete worker flow.

Then run:

lint
typecheck
unit tests
integration tests
build

Fix every error.

---

# 48. FINAL QUALITY CHECK

Before declaring the application complete, inspect every major route.

Verify:

- no broken links
- no console errors
- no broken images
- no fake buttons
- no horizontal scrolling
- responsive mobile layout
- dark mode works
- authentication works
- data import works
- manual entry works
- score calculation works
- explanation works
- history works
- recommendations work
- credit report works
- lender dashboard works
- synthetic scenarios work
- database persists data
- error states work

Use browser automation to inspect actual rendered pages, not just source code.

---

# 49. CODE QUALITY

Use:
- TypeScript strict mode
- reusable components
- meaningful names
- modular services
- no duplicated scoring logic
- no giant components
- no random magic numbers
- no unnecessary dependencies
- proper loading states
- proper error handling

Keep business logic separate from presentation.

---

# 50. IMPLEMENTATION PHASES

Build in exactly this general sequence.

## PHASE 1 — Architecture & scaffold

Create:
- Next.js project
- TypeScript
- Tailwind
- component system
- Prisma
- PostgreSQL configuration
- base layout
- routing
- theme
- initial README

Then run the application.

---

## PHASE 2 — Design system & landing page

Build:
- navbar
- hero
- problem section
- how-it-works
- alternative-signal section
- explainability section
- lender section
- fairness section
- CTA
- footer
- responsive layout
- animations

Verify visually in browser.

---

## PHASE 3 — Authentication

Build:
- login
- signup
- demo mode
- roles
- protected routes
- session handling

Test authentication.

---

## PHASE 4 — Database

Implement Prisma schema.

Run migrations.

Create seed data.

Verify persistence.

---

## PHASE 5 — Worker onboarding

Build the complete onboarding wizard.

Test form validation.

---

## PHASE 6 — Financial data ingestion

Build:
- CSV upload
- CSV preview
- validation
- column mapping
- duplicate detection
- manual entry
- synthetic-data generation

Test with malformed data too.

---

## PHASE 7 — Scoring engine

Build the deterministic scoring engine.

Write tests BEFORE integrating deeply into the UI.

Document all rules.

---

## PHASE 8 — Worker dashboard

Build:
- score visualization
- score breakdown
- factor cards
- charts
- confidence
- explanations
- data summary

Verify calculations visually.

---

## PHASE 9 — Score history & recommendations

Build:
- score history
- score comparison
- factor changes
- improvement recommendations

---

## PHASE 10 — Credit profile

Build:
- report
- printable layout
- PDF generation if reliable
- shareable demo profile

---

## PHASE 11 — Lender dashboard

Build:
- lender metrics
- applicant table
- applicant details
- evidence
- audit trail
- demo decision workflow

---

## PHASE 12 — Fairness & methodology

Build:
- methodology page
- fairness page
- limitations
- transparent scoring documentation

---

## PHASE 13 — Demo mode

Build:
- stable worker
- seasonal worker
- growing worker
- unstable worker
- recovery worker

Make switching scenarios extremely fast.

---

## PHASE 14 — Polish

Perform complete UI/UX pass.

Fix:
- spacing
- responsive issues
- typography
- empty states
- error states
- loading states
- animations
- accessibility
- dark mode

---

## PHASE 15 — Testing & verification

Run:
- lint
- typecheck
- unit tests
- integration tests
- E2E tests
- production build

Open the application in a real browser and inspect the complete journey.

Fix every issue you find.

---

# 51. IMPORTANT PRODUCT PRINCIPLES

Never violate these:

1. **Explainability over complexity**
2. **Deterministic scoring over black-box scoring**
3. **Evidence over claims**
4. **Alternative signals over traditional bureau assumptions**
5. **Volatility-aware scoring**
6. **Data confidence rather than pretending certainty**
7. **Transparent limitations**
8. **Synthetic data clearly labelled**
9. **No fake bank integration**
10. **No misleading claim that the score is an official credit score**

---

# 52. VISUAL QUALITY BAR

The finished website should look good enough that a judge could mistake it for an early-stage fintech startup product.

Pay special attention to:
- dashboard hierarchy
- typography
- score visualization
- explanatory cards
- charts
- micro-interactions
- empty states
- mobile responsiveness
- consistency of iconography
- consistent spacing
- polished onboarding
- clean financial tables

Do not make the dashboard visually overloaded.

The score must remain the visual focal point.

---

# 53. FINAL DELIVERABLE

When all phases are complete, provide:

1. working application
2. complete source code
3. database schema
4. seed data
5. synthetic-data generator
6. scoring engine
7. tests
8. README
9. scoring methodology
10. architecture documentation
11. demo guide
12. `.env.example`
13. production build verification

Then provide me with:

### A. Architecture summary

### B. How the scoring algorithm works

### C. Demo credentials

### D. Commands to run the project

### E. Deployment instructions

### F. Recommended 3-minute SIH judge demo flow

### G. Top 10 questions judges may ask

### H. Strong answers based on the actual implementation

Do not claim that something is implemented unless you actually implemented and verified it.

The final application must be functional, coherent, visually polished and demonstrable end-to-end.

START WITH PHASE 1.

Do not merely tell me what you would build.

Actually build it.