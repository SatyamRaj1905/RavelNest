// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

it.each(['development', 'production'])(
  'allows React debug evaluation only in development, under %s settings',
  async (mode) => {
    vi.stubEnv('NODE_ENV', mode);
    vi.resetModules();
    const { default: config } = await import('../../next.config');
    const headers = await config.headers?.();
    const policy = headers
      ?.find((entry) => entry.source === '/(.*)')
      ?.headers.find(
        (header) => header.key === 'Content-Security-Policy',
      )?.value;
    expect(policy).toBeDefined();
    expect(policy?.includes("'unsafe-eval'")).toBe(mode === 'development');
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("connect-src 'self'");
  },
);
