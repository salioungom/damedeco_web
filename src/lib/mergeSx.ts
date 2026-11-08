import type { SxProps, Theme } from '@mui/material/styles';

type SxItem = SxProps<Theme> | false | null | undefined;

export function mergeSx(...items: SxItem[]): SxProps<Theme> {
  const out: unknown[] = [];
  for (const item of items) {
    if (!item) continue;
    if (Array.isArray(item)) out.push(...item);
    else out.push(item);
  }
  return out as SxProps<Theme>;
}