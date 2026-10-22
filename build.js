import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, 'dist');

// Ensure dist directory exists
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Ensure dummy placeholder file exists in dist
const dummyHtml = path.join(distDir, 'index.html');
if (!fs.existsSync(dummyHtml)) {
  fs.writeFileSync(
    dummyHtml,
    '<!doctype html><html lang="en"><head><meta charset="UTF-8" /><title>Site</title></head><body><div id="root"></div></body></html>',
    'utf-8'
  );
}

// Execute Vite production build
try {
  console.log('Starting Vite build...');
  execSync('npx vite build', { stdio: 'inherit' });
  console.log('Vite build completed successfully.');
} catch (error) {
  console.error('Vite build failed, keeping fallback dist assets:', error.message);
  process.exit(1);
}
