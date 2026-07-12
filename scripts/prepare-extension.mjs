import { cp, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const dist = resolve(root, 'dist/firefox');

async function copy(from, to) {
  await mkdir(dirname(to), { recursive: true });
  await cp(resolve(root, from), resolve(root, to), { recursive: true });
}

await copy('public_html/manifest.json', 'dist/firefox/manifest.json');
await copy('public_html/icons', 'dist/firefox/icons');
