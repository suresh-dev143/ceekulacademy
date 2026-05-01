import { test, expect, Page } from '@playwright/test';

// Selector helpers — all tied to data-cb-id attributes
const sel = (id: string) => `[data-cb-id="${id}"]`;

const REGISTER_URL = '/register';

const VALID_USER = {
  mobileNo: '9876543210',
  dateOfBirth: '1995-06-15',
  placeOfBirth: 'Mumbai',
  identity: 'homo_sapiens',
  gender: 'female',
  bplCategory: 'no',
  underprivilegedCategory: 'no',
  password: 'SecurePass1',
};

async function fillForm(page: Page, overrides: Partial<typeof VALID_USER> = {}) {
  const data = { ...VALID_USER, ...overrides };

  await page.fill(sel('register-mobile-input'), data.mobileNo);
  await page.fill(sel('register-dob-input'), data.dateOfBirth);
  await page.fill(sel('register-place-of-birth-input'), data.placeOfBirth);
  await page.selectOption(sel('register-identity-select'), data.identity);
  await page.selectOption(sel('register-gender-select'), data.gender);
  await page.selectOption(sel('register-bpl-select'), data.bplCategory);
  await page.selectOption(sel('register-underprivileged-select'), data.underprivilegedCategory);
  await page.fill(sel('register-password-input'), data.password);
  await page.check(sel('register-agree-checkbox'));
}

test.describe('Registration Page', () => {

  test.beforeEach(async ({ page }) => {
    // Stub the backend ID generation so tests don't need a live server
    await page.route('**/users/ceebrain-id', (route) =>
      route.fulfill({ status: 200, body: JSON.stringify({ status: true, ceebrainId: '123456789012' }) })
    );
    await page.goto(REGISTER_URL);
    await page.waitForSelector(sel('register-form'));
  });

  // ── Page load ─────────────────────────────────────────────────────────────

  test('renders the registration form', async ({ page }) => {
    await expect(page.locator(sel('register-page'))).toBeVisible();
    await expect(page.locator(sel('register-mobile-input'))).toBeVisible();
    await expect(page.locator(sel('register-dob-input'))).toBeVisible();
    await expect(page.locator(sel('register-place-of-birth-input'))).toBeVisible();
    await expect(page.locator(sel('register-identity-select'))).toBeVisible();
    await expect(page.locator(sel('register-gender-select'))).toBeVisible();
    await expect(page.locator(sel('register-bpl-select'))).toBeVisible();
    await expect(page.locator(sel('register-underprivileged-select'))).toBeVisible();
    await expect(page.locator(sel('register-password-input'))).toBeVisible();
    await expect(page.locator(sel('register-agree-checkbox'))).toBeVisible();
    await expect(page.locator(sel('register-submit-btn'))).toBeVisible();
  });

  // ── Ceebrain ID ───────────────────────────────────────────────────────────

  test('displays a 12-digit Ceebrain ID on load', async ({ page }) => {
    const idText = await page.locator(sel('register-ceebrain-id-display')).textContent();
    expect(idText?.trim()).toMatch(/^\d{12}$/);
  });

  test('Ceebrain ID uniqueness is enforced by the backend', async ({ page }) => {
    // Each page load triggers GET /users/ceebrain-id — the backend guarantees uniqueness.
    // Here we verify the component renders whatever the API returns and does not override it client-side.
    await page.route('**/users/ceebrain-id', (route) =>
      route.fulfill({ status: 200, body: JSON.stringify({ status: true, ceebrainId: '999999999999' }) })
    );
    await page.reload();
    await page.waitForSelector(sel('register-form'));
    const idText = await page.locator(sel('register-ceebrain-id-display')).textContent();
    expect(idText?.trim()).toBe('999999999999');
  });

  test('shows error when Ceebrain ID generation fails', async ({ page }) => {
    await page.route('**/users/ceebrain-id', (route) =>
      route.fulfill({ status: 500, body: JSON.stringify({ status: false }) })
    );
    await page.reload();
    await page.waitForSelector(sel('register-form'));
    await expect(page.locator(sel('register-error-message'))).toBeVisible({ timeout: 5000 });
    await expect(page.locator(sel('register-error-message'))).toContainText('Could not generate a Ceebrain ID');
  });

  // ── Validation — empty submit ─────────────────────────────────────────────

  test('shows validation state when submitted empty', async ({ page }) => {
    await page.click(sel('register-submit-btn'));
    // Angular marks controls touched; form should remain (no success snackbar)
    await expect(page.locator(sel('register-success-snackbar'))).not.toBeVisible();
    // Submit button is still present and enabled (isLoading never fired)
    await expect(page.locator(sel('register-submit-btn'))).toBeEnabled();
  });

  // ── Validation — mobile number ────────────────────────────────────────────

  test('shows mobile error for non-10-digit input', async ({ page }) => {
    await page.fill(sel('register-mobile-input'), '12345');
    await page.locator(sel('register-mobile-input')).blur();
    await expect(page.locator(sel('register-mobile-error'))).toBeVisible();
    await expect(page.locator(sel('register-mobile-error'))).toContainText('valid 10-digit');
  });

  test('clears mobile error for valid 10-digit number', async ({ page }) => {
    await page.fill(sel('register-mobile-input'), '9876543210');
    await page.locator(sel('register-mobile-input')).blur();
    await expect(page.locator(sel('register-mobile-error'))).not.toBeVisible();
  });

  // ── Validation — password ─────────────────────────────────────────────────

  test('shows password error when pattern requirements are not met', async ({ page }) => {
    await page.fill(sel('register-password-input'), 'alllowercase');
    await page.locator(sel('register-password-input')).blur();
    await expect(page.locator(sel('register-password-error'))).toBeVisible();
    await expect(page.locator(sel('register-password-error'))).toContainText('uppercase');
  });

  test('clears password error for a compliant password', async ({ page }) => {
    await page.fill(sel('register-password-input'), 'Valid1pass');
    await page.locator(sel('register-password-input')).blur();
    await expect(page.locator(sel('register-password-error'))).not.toBeVisible();
  });

  // ── Submit — happy path ───────────────────────────────────────────────────

  test('disables submit button and shows loading state during submission', async ({ page }) => {
    await fillForm(page);

    // Intercept the API call so we can observe the in-flight state
    await page.route('**/register**', async (route) => {
      await new Promise((r) => setTimeout(r, 500));
      await route.fulfill({ status: 201, body: JSON.stringify({ message: 'ok' }) });
    });

    await page.click(sel('register-submit-btn'));
    await expect(page.locator(sel('register-submit-btn'))).toBeDisabled();
    await expect(page.locator(sel('register-submit-btn'))).toContainText('Registering');
  });

  test('shows success snackbar after successful registration', async ({ page }) => {
    await fillForm(page);

    await page.route('**/register**', (route) =>
      route.fulfill({ status: 201, body: JSON.stringify({ message: 'ok' }) })
    );

    await page.click(sel('register-submit-btn'));
    await expect(page.locator(sel('register-success-snackbar'))).toBeVisible({ timeout: 5000 });
    await expect(page.locator(sel('register-success-snackbar'))).toContainText('Registration Successful');
  });

  // ── Submit — API error ────────────────────────────────────────────────────

  test('shows API error message on failed registration', async ({ page }) => {
    await fillForm(page);

    await page.route('**/register**', (route) =>
      route.fulfill({
        status: 400,
        body: JSON.stringify({ message: 'Mobile number already registered.' }),
      })
    );

    await page.click(sel('register-submit-btn'));
    await expect(page.locator(sel('register-error-message'))).toBeVisible({ timeout: 5000 });
    await expect(page.locator(sel('register-error-message'))).toContainText('Mobile number already registered');
  });

  test('shows fallback error message when API returns no message', async ({ page }) => {
    await fillForm(page);

    await page.route('**/register**', (route) =>
      route.fulfill({ status: 500, body: JSON.stringify({}) })
    );

    await page.click(sel('register-submit-btn'));
    await expect(page.locator(sel('register-error-message'))).toContainText('Registration failed');
  });

  // ── Checkbox — framework agreement ───────────────────────────────────────

  test('prevents submission when framework checkbox is unchecked', async ({ page }) => {
    await fillForm(page);
    await page.uncheck(sel('register-agree-checkbox'));
    await page.click(sel('register-submit-btn'));
    await expect(page.locator(sel('register-success-snackbar'))).not.toBeVisible();
  });

  // ── Accessibility ─────────────────────────────────────────────────────────

  test('all inputs are reachable via keyboard Tab', async ({ page }) => {
    const focusableIds = [
      'register-mobile-input',
      'register-dob-input',
      'register-place-of-birth-input',
      'register-identity-select',
      'register-gender-select',
      'register-bpl-select',
      'register-underprivileged-select',
      'register-password-input',
      'register-agree-checkbox',
      'register-submit-btn',
    ];

    await page.locator(sel('register-mobile-input')).focus();
    for (const id of focusableIds) {
      await expect(page.locator(sel(id))).toBeFocused();
      await page.keyboard.press('Tab');
    }
  });
});
