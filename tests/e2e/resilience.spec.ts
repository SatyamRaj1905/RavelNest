import { expect, test } from '@playwright/test';
import { createPreview, navigateTo, savePreview } from './helpers';

test('network failure after load still produces an approvable local plan', async ({
  page,
}) => {
  await page.goto('/');
  await page.route('**/api/plan', (route) =>
    route.abort('internetdisconnected'),
  );
  const dialog = await createPreview(
    page,
    'A celebration even without the network',
  );
  await expect(dialog.getByRole('status')).toContainText(
    'available even offline',
  );
  await savePreview(page);
  await navigateTo(page, 'Budget');
  await expect(page.getByRole('table')).toBeVisible();
});

test('invalid successful API output is rejected and replaced with canonical fallback', async ({
  page,
}) => {
  await page.goto('/');
  await page.route('**/api/plan', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        plan: { summary: '<script>bad()</script>' },
        source: 'gemini',
      }),
    }),
  );
  const dialog = await createPreview(page, 'Validated output matters');
  await expect(dialog.getByRole('status')).toContainText(
    'deterministic demo plan',
  );
  await expect(
    page.getByText('<script>bad()</script>', { exact: true }),
  ).toHaveCount(0);
});

test('unavailable storage keeps edits usable and explains their persistence limit', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException('Storage unavailable', 'QuotaExceededError');
    };
  });
  await page.goto('/');
  await navigateTo(page, 'Budget');
  await page
    .getByRole('textbox', { name: /^Amount spent on / })
    .first()
    .fill('999');
  await page
    .getByRole('button', { name: /^Save spending for / })
    .first()
    .click();
  await expect(
    page.getByText(/Browser storage is unavailable or full/),
  ).toBeVisible();
  await navigateTo(page, 'Timeline');
  await navigateTo(page, 'Budget');
  await expect(
    page.getByRole('textbox', { name: /^Amount spent on / }).first(),
  ).toHaveValue('999');
});

test('corrupt saved data is retained while a usable sample is offered', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem('ravelnest.workspace.v1', '{broken json');
  });
  await page.goto('/');
  await expect(
    page.getByText(/Your saved workspace could not be loaded/),
  ).toBeVisible();
  await expect(
    page.getByRole('combobox', { name: 'Active event' }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => localStorage.getItem('ravelnest.workspace.v1')),
  ).toBe('{broken json');
});
