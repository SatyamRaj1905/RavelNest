import { expect, test } from '@playwright/test';
import { AiFailure, getAiFallbackNotice } from '../../src/domain/ai-failure';
import { planRequestSchema } from '../../src/domain/contracts';
import { generatePlan } from '../../src/domain/planner';
import { createPreview } from './helpers';

const scenarios = [
  ['timeout', 'Gemini took too long to respond. Please try again.'],
  ['rate-limit', 'Gemini reached a rate or quota limit.'],
] as const;

for (const [code, expectedNotice] of scenarios) {
  test(`${code} fallback explains the specific failure and keeps an approvable plan`, async ({
    page,
  }) => {
    await page.route('**/api/plan', async (route) => {
      const input = planRequestSchema.parse(route.request().postDataJSON());
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          plan: generatePlan(input.brief, input.prompt),
          source: 'demo',
          notice: getAiFallbackNotice(new AiFailure(code)),
        }),
      });
    });
    await page.goto('/');
    const dialog = await createPreview(
      page,
      'A clear plan through a provider failure',
    );
    await expect(dialog.getByRole('status')).toContainText(expectedNotice);
    await expect(
      dialog.getByText('Demo planning engine', { exact: true }),
    ).toBeVisible();
    await expect(
      dialog.getByText('Personalized with Gemini', { exact: true }),
    ).toHaveCount(0);
    await expect(
      dialog.getByRole('button', { name: 'Save event', exact: true }),
    ).toBeEnabled();
  });
}
