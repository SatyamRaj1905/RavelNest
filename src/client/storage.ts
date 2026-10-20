import { workspaceSchema, type Workspace } from '@/domain/contracts';

export const STORAGE_KEY = 'ravelnest.workspace.v1';
export const MAX_STORAGE_BYTES = 250_000;
export type StorageResult = { workspace: Workspace | null; notice: string };

export function readWorkspace(
  storage: Pick<Storage, 'getItem'>,
): StorageResult {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return { workspace: null, notice: '' };
    if (new TextEncoder().encode(raw).byteLength > MAX_STORAGE_BYTES)
      throw new Error('Storage capacity exceeded');
    const result = workspaceSchema.safeParse(JSON.parse(raw));
    if (!result.success) throw new Error('Invalid saved workspace');
    return { workspace: result.data, notice: '' };
  } catch {
    return {
      workspace: null,
      notice:
        'Your saved workspace could not be loaded. The sample workspace is available; existing browser data has not been removed.',
    };
  }
}

export function writeWorkspace(
  storage: Pick<Storage, 'setItem'>,
  workspace: Workspace,
): string {
  try {
    const raw = JSON.stringify(workspaceSchema.parse(workspace));
    if (new TextEncoder().encode(raw).byteLength > MAX_STORAGE_BYTES)
      throw new Error('Storage capacity exceeded');
    storage.setItem(STORAGE_KEY, raw);
    return '';
  } catch {
    return 'Browser storage is unavailable or full. Changes work for this session but may not survive a refresh. Export your plan to keep a copy.';
  }
}
