import { copyFile, lstat, mkdir, readFile, realpath, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = await realpath(fileURLToPath(new URL('..', import.meta.url)));
const output = path.resolve(root, 'dist');

// This explicit allowlist keeps originals, guides, manifests, and tools private.
// Add any new browser scripts or stylesheets here when the page starts using them.
const entries = [
  'index.html',
  'styles.css',
  'js/creatives.js',
  'js/gallery.js',
  'js/format.js',
  'js/carousel.js',
  'js/main.js',
];
const files = new Map(entries.map(file => [file, file]));

for (const entry of entries) {
  const source = await readFile(path.join(root, entry), 'utf8');
  // Includes the catalog's full-size images and thumbnails, plus CSS backgrounds.
  for (const match of source.matchAll(/["'](assets\/[^"'\s]+)["']/g)) {
    const asset = match[1];
    if (!/^assets\/(?:brand|fonts|library)\/[a-z0-9-]+\.(?:webp|svg|woff2)$/i.test(asset)) {
      throw new Error(`Asset is outside the public allowlist: ${asset}`);
    }
    files.set(asset, asset);
  }
}

files.set('404.html', 'cloudflare/404.html');
files.set('_headers', 'cloudflare/_headers');

// Validate every source before clearing the previous build.
let bytes = 0;
for (const source of files.values()) {
  const absolute = await realpath(path.join(root, source));
  const relative = path.relative(root, absolute);
  const info = await lstat(absolute);
  if (relative.startsWith('..') || path.isAbsolute(relative) || !info.isFile()) {
    throw new Error(`Public source must be a file inside this repository: ${source}`);
  }
  bytes += info.size;
}

// Only ever replace this checkout's dist directory, never a linked directory.
if (path.dirname(output) !== root || path.basename(output) !== 'dist') {
  throw new Error('Unexpected build output directory.');
}
const previous = await lstat(output).catch(error => {
  if (error.code !== 'ENOENT') throw error;
});
if (previous && (!previous.isDirectory() || previous.isSymbolicLink())) {
  throw new Error('Refusing to replace dist: it must be a regular directory.');
}
await rm(output, { recursive: true, force: true });

for (const [destination, source] of files) {
  const target = path.join(output, destination);
  await mkdir(path.dirname(target), { recursive: true });
  await copyFile(path.join(root, source), target);
}

console.log(`Built ${files.size} public files (${(bytes / 1024 / 1024).toFixed(2)} MiB) in dist/.`);
