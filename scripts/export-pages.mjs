import { cp, mkdir, rm, access, readFile, writeFile } from 'node:fs/promises';
const papers = JSON.parse(await readFile('content/papers.json', 'utf8'));
const paths = ['/', '/rsi/', ...papers.map(p => '/rsi/papers/' + p.id + '/')];
const sourceFor = path => path === '/' ? 'dist/client/index.html' : 'dist/client' + path.slice(0, -1) + '.html';
// Check every page before replacing the previously working public output.
for (const path of paths) await access(sourceFor(path));
await rm('docs', { recursive: true, force: true });
await mkdir('docs', { recursive: true });
await cp('dist/client', 'docs', { recursive: true });
// Vinext generates its own 404 after copying public assets. Keep our Pages fallback.
await cp('public/404.html', 'docs/404.html');
for (const path of paths) {
  if (path === '/') continue;
  await mkdir('docs' + path, { recursive: true });
  await cp(sourceFor(path), 'docs' + path + 'index.html');
  await rm('docs' + path.slice(0, -1) + '.html');
}
const sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
  + paths.map(path => '  <url><loc>https://boran002.github.io' + path + '</loc></url>').join('\n')
  + '\n</urlset>\n';
await writeFile('docs/sitemap.xml', sitemap);
console.log('GitHub Pages files ready in docs/: ' + paths.length + ' pages.');
