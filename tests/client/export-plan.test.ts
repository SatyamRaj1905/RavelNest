import { afterEach, describe, expect, it, vi } from 'vitest';
import { downloadPlan, planMarkdown } from '../../src/client/export-plan';
import { createSampleWorkspace } from '../../src/domain/sample';

const event = createSampleWorkspace().events[0];
if (!event) throw new Error('Missing fixture');
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('portable Markdown export', () => {
  it('includes the entire actual plan, state, estimates and source in readable Markdown', () => {
    const output = planMarkdown(event);
    expect(output).toContain(`# ${event.brief.name}`);
    expect(output).toContain('Plan source: demo');
    expect(output).toContain(event.plan.summary);
    expect(output).toContain('## Budget estimates');
    expect(output).toContain('## Timeline');
    expect(output).toContain('## Vendor checklist');
    expect(output).toContain('## Personalized ideas');
    expect(output).toContain('- [x]');
    expect(output).toContain('- [ ]');
    for (const vendor of event.plan.vendors)
      expect(output).toContain(vendor.category);
    for (const idea of event.plan.ideas)
      expect(output).toContain(idea.description);
    expect(output).toContain('not vendor quotations');
  });
  it('downloads a sanitized filename and promptly releases its object URL', () => {
    const create = vi.fn(() => 'blob:ravelnest-export');
    const revoke = vi.fn();
    vi.stubGlobal(
      'URL',
      Object.assign(URL, { createObjectURL: create, revokeObjectURL: revoke }),
    );
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);
    const createElement = vi.spyOn(document, 'createElement');
    downloadPlan({
      ...event,
      brief: { ...event.brief, name: 'A/B <celebration>'.repeat(10) },
    });
    expect(create).toHaveBeenCalledWith(expect.any(Blob));
    expect(click).toHaveBeenCalledTimes(1);
    const link = createElement.mock.results[0]?.value as
      HTMLAnchorElement | undefined;
    expect(link?.download).toMatch(/^[a-z0-9-]{1,60}-plan\.md$/i);
    expect(link?.href).toBe('blob:ravelnest-export');
    expect(revoke).toHaveBeenCalledWith('blob:ravelnest-export');
    expect(link?.isConnected).toBe(false);
  });
});

it('releases the download URL and temporary element even if a browser click fails', () => {
  const revoke = vi.fn();
  vi.stubGlobal(
    'URL',
    Object.assign(URL, {
      createObjectURL: () => 'blob:failed-download',
      revokeObjectURL: revoke,
    }),
  );
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {
    throw new Error('Browser blocked click');
  });
  expect(() => downloadPlan(event)).toThrow('Browser blocked click');
  expect(revoke).toHaveBeenCalledWith('blob:failed-download');
  expect(document.querySelector('a[download]')).toBeNull();
});
