import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { createSampleWorkspace } from '../../src/domain/sample';
import { createPreview, navigateTo, savePreview } from './helpers';

test('a host previews, approves, updates, and reloads one connected plan', async ({
  page,
}, testInfo) => {
  await page.goto('/');
  const name = 'A rooftop birthday with friends';
  const dialog = await createPreview(page, name);
  await expect(
    dialog.getByText(`${name} · 32 guests`, { exact: true }),
  ).toBeVisible();
  await expect(
    dialog.getByText('₹1,23,456 allocated', { exact: true }),
  ).toBeVisible();
  await savePreview(page);
  await expect(
    page
      .getByRole('combobox', { name: 'Active event' })
      .locator('option:checked'),
  ).toHaveText(name);

  await navigateTo(page, 'Budget');
  const spending = page
    .getByRole('textbox', { name: /^Amount spent on / })
    .first();
  await spending.fill('1234');
  await page
    .getByRole('button', { name: /^Save spending for / })
    .first()
    .click();
  await expect(
    page.getByRole('progressbar', { name: 'Budget spent' }),
  ).toHaveAttribute('aria-valuenow', '1');

  await navigateTo(page, 'Timeline');
  await page.getByRole('checkbox').first().check();
  await expect(page.getByRole('checkbox').first()).toBeChecked();
  await expect(page.getByText(/1 of \d+ tasks complete/)).toBeVisible();

  await navigateTo(page, 'Vendors');
  await page
    .getByLabel('Planning status', { exact: true })
    .first()
    .selectOption('contacted');
  await page
    .getByLabel('Your shortlist & notes', { exact: true })
    .first()
    .fill('Request a vegetarian menu and an itemized quote.');
  await page
    .getByRole('button', { name: 'Save notes', exact: true })
    .first()
    .click();
  await expect(
    page.getByText('Notes saved', { exact: true }).first(),
  ).toBeVisible();

  await navigateTo(page, 'Inspiration');
  await page
    .getByRole('button', { name: 'Save this idea', exact: true })
    .first()
    .click();
  await expect(
    page.getByRole('button', { name: 'Saved to your collection', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');

  await page.reload();
  await expect(
    page
      .getByRole('combobox', { name: 'Active event' })
      .locator('option:checked'),
  ).toHaveText(name);
  await navigateTo(page, 'Budget');
  await expect(
    page.getByRole('textbox', { name: /^Amount spent on / }).first(),
  ).toHaveValue('1234');
  await navigateTo(page, 'Timeline');
  await expect(page.getByRole('checkbox').first()).toBeChecked();
  await navigateTo(page, 'Vendors');
  await expect(
    page.getByLabel('Planning status', { exact: true }).first(),
  ).toHaveValue('contacted');
  await expect(
    page.getByLabel('Your shortlist & notes', { exact: true }).first(),
  ).toHaveValue('Request a vegetarian menu and an itemized quote.');
  await navigateTo(page, 'Inspiration');
  await expect(
    page.getByRole('button', { name: 'Saved to your collection', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await navigateTo(page, 'My events');
  await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export plan', exact: true }).click();
  const download = await downloaded;
  const exportedPath = testInfo.outputPath('event-plan.md');
  await download.saveAs(exportedPath);
  const markdown = await readFile(exportedPath, 'utf8');
  expect(markdown).toContain(`# ${name}`);
  expect(markdown).toContain('## Vendor checklist');
  expect(markdown).toContain(
    'Request a vegetarian menu and an itemized quote.',
  );
  expect(markdown).toContain('₹1,234 spent');
});

test('assistant suggestions require approval and preserve planning work', async ({
  page,
}) => {
  const [fixture] = createSampleWorkspace().events;
  if (!fixture) throw new Error('The sample event fixture is unavailable.');
  await page.route('**/api/plan', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        plan: {
          ...fixture.plan,
          summary: 'A validated Gemini narrative preview for your celebration.',
        },
        source: 'gemini',
        notice: 'A test-controlled structured provider response.',
      }),
    }),
  );
  await page.goto('/');
  await navigateTo(page, 'Inspiration');
  await page
    .getByRole('button', { name: 'Save this idea', exact: true })
    .first()
    .click();
  await navigateTo(page, 'Timeline');
  const task = page.getByRole('checkbox').nth(4);
  await task.check();
  await navigateTo(page, 'Overview');
  await page
    .getByRole('textbox', { name: 'Ask your planning assistant' })
    .fill('Make the celebration sustainable with reusable decorations.');
  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(
    page.getByText('Gemini suggestions', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('Sample / demo plan', { exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Apply suggestions', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Suggestions saved', exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByText('Gemini personalized', { exact: true }),
  ).toBeVisible();
  await navigateTo(page, 'Timeline');
  await expect(page.getByRole('checkbox').nth(4)).toBeChecked();
  await navigateTo(page, 'Inspiration');
  await expect(
    page.getByRole('button', { name: 'Saved to your collection', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
});

test('an event that has passed is labeled as past rather than today', async ({
  page,
}) => {
  const workspace = createSampleWorkspace(new Date('2025-01-01T12:00:00Z'));
  await page.addInitScript((savedWorkspace) => {
    localStorage.setItem(
      'ravelnest.workspace.v1',
      JSON.stringify(savedWorkspace),
    );
  }, workspace);
  await page.goto('/');
  await expect(page.getByText('DAYS AGO', { exact: true })).toBeVisible();
  await expect(page.getByText('TODAY', { exact: true })).toHaveCount(0);
});
