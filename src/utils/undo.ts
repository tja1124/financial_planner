import type { AppData } from '../types';

/** Lightweight deep clone for undo snapshots (in-memory only, never persisted separately) */
export function cloneAppData(data: AppData): AppData {
  return JSON.parse(JSON.stringify(data)) as AppData;
}
