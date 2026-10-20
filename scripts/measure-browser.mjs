import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const url = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000';
const browser = await chromium.launch();
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1100 },
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  const measurements = await page.evaluate(() => {
    const resources = globalThis.performance
      .getEntriesByType('resource')
      .filter((entry) => entry instanceof globalThis.PerformanceResourceTiming);
    const asset = (extension) =>
      resources
        .filter((entry) => new URL(entry.name).pathname.endsWith(extension))
        .reduce(
          (sum, entry) => ({
            files: sum.files + 1,
            encoded: sum.encoded + entry.encodedBodySize,
            decoded: sum.decoded + entry.decodedBodySize,
          }),
          { files: 0, encoded: 0, decoded: 0 },
        );
    const navigation = globalThis.performance.getEntriesByType('navigation')[0];
    return {
      javascript: asset('.js'),
      css: asset('.css'),
      firstContentfulPaintMs:
        globalThis.performance.getEntriesByName('first-contentful-paint')[0]
          ?.startTime ?? null,
      domContentLoadedMs:
        navigation instanceof globalThis.PerformanceNavigationTiming
          ? navigation.domContentLoadedEventEnd
          : null,
    };
  });
  const result = {
    method:
      'One fresh Chromium context, local production server, 1440×1100, no throttling; diagnostic only, not field metrics.',
    url,
    chromium: browser.version(),
    node: process.version,
    ...measurements,
  };
  await mkdir('artifacts', { recursive: true });
  await writeFile(
    'artifacts/browser-performance.json',
    JSON.stringify(result, null, 2),
  );
  console.log(JSON.stringify(result, null, 2));
} finally {
  await browser.close();
}
