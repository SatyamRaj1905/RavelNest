import { expect, type Page } from '@playwright/test';

export async function navigateTo(page: Page, name: string) {
  const menu = page.getByRole('button', {
    name: 'Open navigation',
    exact: true,
  });
  const target = page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('button', {
      name: name === 'Inspiration' ? /^Inspiration(?: NEW)?$/ : name,
      exact: true,
    });
  if (!(await target.isVisible()) && (await menu.isVisible()))
    await menu.click();
  await target.click();
}

export async function createPreview(
  page: Page,
  name = 'A rooftop birthday with friends',
) {
  await page
    .getByRole('button', { name: 'Create event', exact: true })
    .filter({ visible: true })
    .first()
    .click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByLabel('Event name', { exact: true }).fill(name);
  await dialog
    .getByRole('combobox', { name: 'Event type', exact: true })
    .selectOption('birthday');
  const future = new Date(Date.now() + 120 * 86_400_000)
    .toISOString()
    .slice(0, 10);
  await dialog.getByLabel('Event date', { exact: true }).fill(future);
  await dialog.getByLabel('Guests', { exact: true }).fill('32');
  await dialog.getByLabel('Total budget', { exact: true }).fill('123456');
  await dialog
    .getByRole('combobox', { name: 'Currency', exact: true })
    .selectOption('INR');
  await dialog.getByLabel('Location', { exact: true }).fill('Bengaluru, India');
  await dialog
    .getByLabel(/Your vision/)
    .fill(
      'A cozy rooftop with board games, local vegetarian food, and reusable decor.',
    );
  await dialog
    .getByRole('button', { name: 'Generate plan', exact: true })
    .click();
  await expect(
    dialog.getByRole('button', { name: 'Save event', exact: true }),
  ).toBeVisible();
  await expect(
    dialog.getByText(/^(Demo planning engine|Personalized with Gemini)$/),
  ).toBeVisible();
  return dialog;
}

export async function savePreview(page: Page) {
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Save event', exact: true })
    .click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
}
