// Post-build: hash every inline <script> Astro emitted and write an nginx
// snippet with a Content-Security-Policy that allows exactly those scripts.
// Usage: node scripts/csp.mjs <dist-dir> <out.conf>
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [dist = 'dist', out = 'deploy/csp.conf'] = process.argv.slice(2);

const htmlFiles = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? htmlFiles(join(dir, e.name)) : e.name.endsWith('.html') ? [join(dir, e.name)] : [],
  );

const hashes = new Set();
for (const file of htmlFiles(dist)) {
  const html = readFileSync(file, 'utf8');
  for (const [, attrs, body] of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
    if (/\bsrc=/.test(attrs) || !body.trim()) continue;
    hashes.add(`'sha256-${createHash('sha256').update(body).digest('base64')}'`);
  }
}

const policy = [
  "default-src 'self'",
  `script-src 'self' ${[...hashes].sort().join(' ')}`,
  // Inline style attributes and React <style> tags; low risk with scripts locked down.
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
  "frame-ancestors 'none'",
].join('; ');

writeFileSync(out, `add_header Content-Security-Policy "${policy}" always;\n`);
console.log(`csp: ${hashes.size} inline script hash(es) -> ${out}`);
