import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
const root = path.resolve('dist');
async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (await Promise.all(entries.map(e => e.isDirectory() ? walk(path.join(dir, e.name)) : path.join(dir, e.name)))).flat();
}
const files = (await walk(root)).filter(p => !p.endsWith('sw.js'));
const digest = createHash('sha256');
for (const p of files.sort()) digest.update(await readFile(p));
const version = digest.digest('hex').slice(0, 12);
const urls = files.map(p => './' + path.relative(root, p).replaceAll('\\', '/'));
const sw = `const CACHE = 'nine-heavens-${version}';
const ASSETS = ${JSON.stringify(['./', ...urls])};
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS))); });
self.addEventListener('message', e => { if(e.data === 'ACTIVATE_UPDATE') self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('nine-heavens-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
 if (e.request.method !== 'GET' || new URL(e.request.url).origin !== self.location.origin) return;
 e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).catch(() => e.request.mode === 'navigate' ? caches.match('./index.html') : Response.error())));
});
`;
await writeFile(path.join(root, 'sw.js'), sw);
console.log('Offline cache prepared:', urls.length, 'assets, build', version);
