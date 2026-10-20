import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { createPreview, navigateTo } from './helpers';

async function expectNoSeriousViolations(
  page: Parameters<typeof navigateTo>[0],
) {
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter(
          (animation) => animation.effect?.getTiming().iterations !== Infinity,
        )
        .map((animation) => animation.finished.catch(() => undefined)),
    ),
  );
  const result = await new AxeBuilder({ page }).analyze();
  expect(
    result.violations
      .filter((item) => item.impact === 'serious' || item.impact === 'critical')
      .map((item) => ({
        id: item.id,
        nodes: item.nodes.map((node) => ({
          target: node.target,
          reason: node.failureSummary,
        })),
      })),
  ).toEqual([]);
}

test('primary workspace views and event dialog have no serious or critical axe violations', async ({
  page,
}) => {
  await page.goto('/');
  for (const name of [
    'Overview',
    'My events',
    'Budget',
    'Timeline',
    'Vendors',
    'Inspiration',
  ]) {
    await navigateTo(page, name);
    await expectNoSeriousViolations(page);
  }
  await page
    .getByRole('button', { name: 'Create event', exact: true })
    .filter({ visible: true })
    .first()
    .click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expectNoSeriousViolations(page);
});

test('keyboard opens a native dialog, contains focus, and returns focus on Escape', async ({
  page,
}) => {
  await page.goto('/');
  const trigger = page
    .getByRole('button', { name: 'Create event', exact: true })
    .filter({ visible: true })
    .first();
  await trigger.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Shift+Tab');
  await expect(
    dialog.getByRole('button', { name: 'Generate plan', exact: true }),
  ).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(
    dialog.getByRole('button', { name: 'Close dialog', exact: true }),
  ).toBeFocused();
  for (let index = 0; index < 15; index += 1) {
    await page.keyboard.press('Tab');
    expect(
      await dialog.evaluate((element) =>
        element.contains(document.activeElement),
      ),
    ).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
});

test('mobile host can create a plan and navigate without page overflow', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page
    .getByRole('button', { name: 'Open navigation', exact: true })
    .click();
  const dialog = await createPreview(page, 'A mobile community of friends');
  await expect(dialog).toBeVisible();
  await expectNoSeriousViolations(page);
  await dialog.getByRole('button', { name: 'Save event', exact: true }).click();
  for (const name of [
    'Budget',
    'Timeline',
    'Vendors',
    'Inspiration',
    'My events',
  ]) {
    await navigateTo(page, name);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  await expectNoSeriousViolations(page);
});
