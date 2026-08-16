# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: browser-verification.spec.ts >> Browser Verification >> verify OBM for Worker (Worker View)
- Location: e2e\browser-verification.spec.ts:44:7

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /.*\/dashboard\/worker/
Received string:  "http://localhost:3000/login"
Timeout: 5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    13 × locator resolved to <html lang="en" class="light">…</html>
       - unexpected value "http://localhost:3000/login"

```

```yaml
- banner:
  - navigation:
    - link "CrediBridge":
      - /url: /
    - link "How It Works":
      - /url: /#how-it-works
    - link "For Workers":
      - /url: /#signals
    - link "For Lenders":
      - /url: /#lenders
    - link "Methodology":
      - /url: /#explainability
    - link "Fairness":
      - /url: /#explainability
    - button "Toggle theme"
    - link "Log in":
      - /url: /login
    - link "Get Started":
      - /url: /register
- main:
  - text: Welcome back Enter your email and password to access your account Email
  - textbox "Email":
    - /placeholder: name@example.com
  - text: Password
  - textbox "Password"
  - button "Sign in"
  - text: Don't have an account?
  - link "Sign up":
    - /url: /register
- contentinfo:
  - link "CrediBridge":
    - /url: /
  - paragraph: Turning real financial behaviour into explainable credit access for gig and informal-sector workers.
  - heading "Product" [level=3]
  - list:
    - listitem:
      - link "How It Works":
        - /url: /#how-it-works
    - listitem:
      - link "Methodology":
        - /url: /#explainability
    - listitem:
      - link "Fairness":
        - /url: /#explainability
    - listitem:
      - link "Demo":
        - /url: /login
  - heading "For Workers" [level=3]
  - list:
    - listitem:
      - link "Build Your Profile":
        - /url: /dashboard/worker
    - listitem:
      - link "Score Explainability":
        - /url: /#explainability
    - listitem:
      - link "Data Privacy":
        - /url: /#how-it-works
  - heading "For Lenders" [level=3]
  - list:
    - listitem:
      - link "Lender Dashboard":
        - /url: /dashboard/lender
    - listitem:
      - link "Evidence-Based Review":
        - /url: /#lenders
    - listitem:
      - link "Transparency":
        - /url: /#explainability
  - heading "Legal" [level=3]
  - list:
    - listitem:
      - link "Privacy Policy":
        - /url: "#"
    - listitem:
      - link "Terms of Service":
        - /url: "#"
    - listitem:
      - link "Contact":
        - /url: "#"
  - paragraph: CrediBridge is a hackathon demonstration platform. The displayed score is a synthetic, internally defined demonstration score and is not a CIBIL score, credit-bureau score, lending decision, or financial guarantee.
  - paragraph: © 2026 CrediBridge. Built for SIH 2026.
- alert
```

# Test source

```ts
  1  | import { test, expect, type Page } from '@playwright/test';
  2  | 
  3  | async function loginViaAPI(page: Page, email: string, password: string) {
  4  |   const base = 'http://localhost:3000';
  5  |   const csrfRes  = await page.request.get(`${base}/api/auth/csrf`);
  6  |   const { csrfToken } = await csrfRes.json() as { csrfToken: string };
  7  | 
  8  |   await page.request.post(`${base}/api/auth/callback/credentials`, {
  9  |     headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  10 |     data: new URLSearchParams({
  11 |       email,
  12 |       password,
  13 |       csrfToken,
  14 |       callbackUrl: `${base}/dashboard`,
  15 |       json: 'true',
  16 |     }).toString(),
  17 |   });
  18 |   await page.goto('/dashboard');
  19 | }
  20 | 
  21 | test.describe('Browser Verification', () => {
  22 |   test('verify OBM and Ceilings for Worker (Lender View)', async ({ page }) => {
  23 |     await loginViaAPI(page, 'lender@demo.credibridge.com', 'demo123');
  24 |     await expect(page).toHaveURL(/.*\/dashboard\/lender/);
  25 |     
  26 |     // Find an application and click (Assuming there is at least one application)
  27 |     // Wait for the recent applications list to load
  28 |     await page.waitForSelector('text=Recent Applications');
  29 |     
  30 |     // Since we don't know the exact name, let's just click the first application link
  31 |     const appLink = page.locator('a[href^="/dashboard/lender/applications/"]').first();
  32 |     await appLink.click();
  33 |     
  34 |     // Check 3 ceilings
  35 |     await expect(page.locator('text=Affordability Ceiling').first()).toBeVisible();
  36 |     await expect(page.locator('text=LTI Ceiling').first()).toBeVisible();
  37 |     await expect(page.locator('text=Expense-Adjusted Ceiling').first()).toBeVisible();
  38 |     await expect(page.locator('text=Binding Constraint').first()).toBeVisible();
  39 | 
  40 |     // Check OBM factor
  41 |     await expect(page.locator('text=Obligation Burden & Mgt').first()).toBeVisible();
  42 |   });
  43 | 
  44 |   test('verify OBM for Worker (Worker View)', async ({ page }) => {
  45 |     // We try to login with a worker email that exists in the demo set
  46 |     await loginViaAPI(page, 'stable@demo.credibridge.com', 'demo123');
  47 | 
> 48 |     await expect(page).toHaveURL(/.*\/dashboard\/worker/);
     |                        ^ Error: expect(page).toHaveURL(expected) failed
  49 | 
  50 |     // Check OBM factor in dashboard
  51 |     await expect(page.locator('text=Obligation Burden & Mgt').first()).toBeVisible();
  52 | 
  53 |     // Go to profile report
  54 |     await page.goto('/dashboard/worker/profile-report');
  55 |     await expect(page.locator('text=Obligation Burden & Mgt').first()).toBeVisible();
  56 |   });
  57 | });
  58 | 
```