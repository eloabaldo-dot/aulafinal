/**
 * Test suite for index.html integrity, SEO standards, and build artifacts.
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

console.log('--- 1. Testing index.html Structure & Metadata ---');
const indexPath = resolve(process.cwd(), 'index.html');
assert(existsSync(indexPath), 'index.html exists in root directory');

const htmlContent = readFileSync(indexPath, 'utf-8');

// Doctype and HTML lang
assert(/<!doctype html>/i.test(htmlContent), 'Contains <!DOCTYPE html>');
assert(/<html\s+lang="pt-BR"/i.test(htmlContent), 'Root <html> specifies lang="pt-BR"');

// Charset and Viewport
assert(/<meta\s+charset="UTF-8"/i.test(htmlContent), 'Specifies UTF-8 charset');
assert(/<meta\s+name="viewport"\s+content="[^"]*width=device-width[^"]*"/i.test(htmlContent), 'Specifies responsive viewport meta tag');

// Title and SEO description
assert(/<title>.*SmartTrip.*<\/title>/i.test(htmlContent), 'Specifies descriptive <title> with SmartTrip branding');
assert(/<meta\s+name="description"\s+content="[^"]{20,}"/i.test(htmlContent), 'Specifies descriptive SEO meta tag');

// OpenGraph and Social cards
assert(/<meta\s+property="og:title"/i.test(htmlContent), 'Specifies og:title');
assert(/<meta\s+property="og:description"/i.test(htmlContent), 'Specifies og:description');
assert(/<meta\s+name="twitter:card"/i.test(htmlContent), 'Specifies twitter:card');

// Favicon and theme color
assert(/<link\s+rel="icon"[^>]*href="\/favicon\.svg"/i.test(htmlContent), 'Links to /favicon.svg');
assert(/<meta\s+name="theme-color"/i.test(htmlContent), 'Specifies theme-color meta tag');

// Web Fonts
assert(/fonts\.googleapis\.com/i.test(htmlContent), 'Includes Google Fonts preconnect / stylesheet');
assert(/Plus\+Jakarta\+Sans/i.test(htmlContent), 'Includes Plus Jakarta Sans typography');

// Mounting root and noscript
assert(/<div\s+id="root">\s*<\/div>/i.test(htmlContent), 'Includes <div id="root"> mounting container');
assert(/<noscript>.*<\/noscript>/is.test(htmlContent), 'Includes accessible <noscript> fallback');

// Script entry point
assert(/<script\s+type="module"\s+src="\/src\/main\.tsx"><\/script>/i.test(htmlContent), 'Loads module script /src/main.tsx');

// Favicon file existence
console.log('\n--- 2. Testing Favicon Asset ---');
const faviconPath = resolve(process.cwd(), 'public', 'favicon.svg');
assert(existsSync(faviconPath), 'public/favicon.svg exists');
const faviconContent = readFileSync(faviconPath, 'utf-8');
assert(/<svg/i.test(faviconContent) && /<\/svg>/i.test(faviconContent), 'public/favicon.svg is a valid SVG document');

console.log(`\n========================================`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
}
