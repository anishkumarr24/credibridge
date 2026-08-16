import { test, expect, type Page } from '@playwright/test';

/**
 * E2E tests for CrediBridge normal user flows.
 *
 * Authentication uses Playwright's page.request (API-level) rather than
 * the browser form. This avoids the NextAuth v5 CSRF cookie timing issue
 * that occurs when the React signIn() function runs in a headless browser:
 *   1. page.request.get('/api/auth/csrf')  → gets csrfToken + sets _csrf cookie
 *   2. page.request.post('/api/auth/callback/credentials', body with csrfToken)
 *                                         → authenticates, sets session cookie
 *   3. page.goto('/dashboard')            → middleware reads session cookie,
 *                                           redirects to role-specific dashboard
 *
 * page.request shares the browser context's cookie jar, so cookies set by
 * API requests are available in subsequent page navigations.
 */

const DEMO_LENDER_EMAIL = 'lender@demo.credibridge.com';
const DEMO_ADMIN_EMAIL  = 'admin@demo.credibridge.com';
const DEMO_PASSWORD     = 'demo123';

/**
 * Authenticate via the NextAuth API directly (bypasses React form + CSRF race).
 * After this call, the browser context has a valid session cookie.
 */
async function loginViaAPI(page: Page, email: string, password: string) {
  const base = 'http://localhost:3000';

  // 1. Fetch CSRF token – this also sets the _csrf cookie in the browser context
  const csrfRes  = await page.request.get(`${base}/api/auth/csrf`);
  const { csrfToken } = await csrfRes.json() as { csrfToken: string };

  // 2. POST credentials with the CSRF token in the body
  await page.request.post(`${base}/api/auth/callback/credentials`, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    data: new URLSearchParams({
      email,
      password,
      csrfToken,
      callbackUrl: `${base}/dashboard`,
      json: 'true',
    }).toString(),
  });

  // 3. Navigate – the middleware reads the session cookie and redirects
  await page.goto('/dashboard');
}

test.describe('CrediBridge E2E - Normal User Flows', () => {

  test('landing page loads successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1').first()).toContainText('Your financial behaviour');
  });

  test('unauthorized users are redirected to login when accessing dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('login page shows only the standard login form (no Demo panel)', async ({ page }) => {
    await page.goto('/login');
    // Standard form inputs are present
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    // Demo preset buttons must NOT appear in the normal product
    await expect(page.getByRole('button', { name: /Stable Worker/i })).not.toBeVisible();
    await expect(page.getByRole('button', { name: /Demo Lender/i })).not.toBeVisible();
    await expect(page.getByRole('button', { name: /Demo Admin/i })).not.toBeVisible();
  });

  test('lender login leads to lender dashboard', async ({ page }) => {
    await loginViaAPI(page, DEMO_LENDER_EMAIL, DEMO_PASSWORD);
    // Middleware should redirect /dashboard → /dashboard/lender for LENDER role
    await expect(page).toHaveURL(/.*\/dashboard\/lender/, { timeout: 15000 });
    await expect(page.getByText('Lender Dashboard').first()).toBeVisible({ timeout: 10000 });
  });

  test('admin login leads to admin dashboard', async ({ page }) => {
    await loginViaAPI(page, DEMO_ADMIN_EMAIL, DEMO_PASSWORD);
    // Middleware should redirect /dashboard → /dashboard/admin for ADMIN role
    await expect(page).toHaveURL(/.*\/dashboard\/admin/, { timeout: 15000 });
    await expect(page.getByText('Admin Overview').first()).toBeVisible({ timeout: 10000 });
  });

  test('lender session cannot access worker dashboard (role boundary enforced)', async ({ page }) => {
    await loginViaAPI(page, DEMO_LENDER_EMAIL, DEMO_PASSWORD);
    await expect(page).toHaveURL(/.*\/dashboard\/lender/, { timeout: 15000 });

    // Attempt to navigate to the worker-only page
    await page.goto('/dashboard/worker');
    // Middleware redirects non-workers away from /dashboard/worker
    await expect(page).not.toHaveURL(/.*\/dashboard\/worker/);
  });

  test('register page pre-selects Lender role when ?role=lender', async ({ page }) => {
    await page.goto('/register?role=lender');
    // shadcn Select renders as a combobox trigger — verify it shows "Lender"
    const trigger = page.locator('[role="combobox"]').first();
    await expect(trigger).toBeVisible();
    await expect(trigger).toContainText(/Lender/i);
  });

});
