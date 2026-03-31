#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const {
  TARGETS,
  buildStatementMatchers,
} = require('./compat-import-targets');

const EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx']);
const SKIP_DIRS = new Set([
  '.git',
  '.expo',
  '.next',
  'android',
  'build',
  'coverage',
  'dist',
  'harmony',
  'ios',
  'node_modules',
]);

function walk(dir, files) {
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) {
        walk(fullPath, files);
      }
      continue;
    }
    if (EXTENSIONS.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }
}

function sanitizeContent(content) {
  return content
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
}

function countMatches(content, specifier) {
  const patterns = buildStatementMatchers(specifier);
  const sanitized = sanitizeContent(content);
  let total = 0;
  for (const pattern of patterns) {
    const matches = sanitized.match(pattern);
    if (matches) total += matches.length;
  }
  return total;
}

function relativePath(root, filePath) {
  return path.relative(root, filePath) || '.';
}

function main() {
  const root = path.resolve(process.cwd(), process.argv[2] || '.');
  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
    console.error(`project root not found: ${root}`);
    process.exit(1);
  }

  const files = [];
  walk(root, files);

  const report = Object.entries(TARGETS).map(([source, wrapper]) => ({
    source,
    wrapper,
    hits: [],
  }));

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    for (const item of report) {
      const count = countMatches(content, item.source);
      if (count > 0) {
        item.hits.push({file, count});
      }
    }
  }

  console.log('# Compat import scan');
  console.log(`root: ${root}`);
  console.log('');

  let found = false;

  for (const item of report) {
    console.log(`## ${item.source}`);
    console.log(`suggested wrapper: ${item.wrapper}`);
    if (!item.hits.length) {
      console.log('- no direct imports found');
      console.log('');
      continue;
    }

    found = true;
    for (const hit of item.hits.sort((a, b) => a.file.localeCompare(b.file))) {
      console.log(`- ${relativePath(root, hit.file)} (${hit.count})`);
    }
    console.log('');
  }

  if (!found) {
    console.log('No risky direct imports found for the current compat target set.');
    return;
  }

  console.log('Next steps:');
  console.log('1. Ensure each wrapper file exists and matches the intended API surface.');
  console.log('2. Replace the listed direct imports incrementally.');
  console.log('3. Re-run this scanner until the risky direct imports are gone.');
}

main();
