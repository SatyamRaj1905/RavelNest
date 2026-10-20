// @vitest-environment node
import { expect, it } from 'vitest';
import { maxDuration } from '../../src/app/api/plan/route';
import {
  GEMINI_DEADLINE_MS,
  PLAN_REQUEST_DEADLINE_MS,
} from '../../src/domain/ai-policy';
import hostingConfig from '../../vercel.json';

it('keeps provider work inside browser and hosting deadlines with limiter headroom', () => {
  expect(GEMINI_DEADLINE_MS).toBe(25_000);
  expect(PLAN_REQUEST_DEADLINE_MS).toBe(35_000);
  expect(PLAN_REQUEST_DEADLINE_MS - GEMINI_DEADLINE_MS).toBeGreaterThan(2500);
  expect(maxDuration * 1000).toBeGreaterThan(PLAN_REQUEST_DEADLINE_MS);
  expect(hostingConfig.functions['src/app/api/plan/route.ts'].maxDuration).toBe(
    maxDuration,
  );
});
