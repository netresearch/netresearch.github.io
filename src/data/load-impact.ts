import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Lang } from '../i18n';

export interface ImpactSnapshot {
  source: string;
  dashboard: string;
  /** When the dashboard collected the data — the figure's real age. */
  generated_at: string;
  /** When this repository last pulled it. Not the same thing. */
  fetched_at: string;
  traffic_available: boolean;
  unavailable: string[];
  kpis: Record<string, number>;
}

/** Impact figures as published by the maint dashboard. See scripts/fetch-impact.mjs. */
export function loadImpact(): ImpactSnapshot {
  const raw = readFileSync(join(process.cwd(), 'src/data/impact.json'), 'utf-8');
  return JSON.parse(raw) as ImpactSnapshot;
}

const LOCALE: Record<Lang, string> = { en: 'en-GB', de: 'de-DE' };

/** Rendered server-side so the formatted number is in the initial HTML. */
export function formatNumber(value: number, lang: Lang): string {
  return new Intl.NumberFormat(LOCALE[lang]).format(value);
}

export function formatDate(iso: string, lang: Lang): string {
  return new Intl.DateTimeFormat(LOCALE[lang], {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(iso));
}
