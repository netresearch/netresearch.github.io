/** Publish the same standalone header assets used by the sibling Pages sites. */
import { copyFileSync, mkdirSync } from 'node:fs';

const source = new URL('../shared/site-shell/', import.meta.url);
const destination = new URL('../public/assets/site-shell/', import.meta.url);
mkdirSync(destination, { recursive: true });
for (const name of ['site-shell.css', 'site-shell.js', 'netresearch-symbol-only.svg']) {
  copyFileSync(new URL(name, source), new URL(name, destination));
}
