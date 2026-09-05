import { cp, mkdir, rm, access } from 'node:fs/promises';
await access('dist/client/index.html');
await rm('docs', { recursive: true, force: true });
await mkdir('docs', { recursive: true });
await cp('dist/client', 'docs', { recursive: true });
console.log('GitHub Pages files ready in docs/');
