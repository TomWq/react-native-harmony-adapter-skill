#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const {
  TARGETS,
  buildLineMatcher,
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

function relativePath(root, filePath) {
  return path.relative(root, filePath) || '.';
}

function replaceSpecifier(line, source, target) {
  return line.replaceAll(`'${source}'`, `'${target}'`).replaceAll(`"${source}"`, `"${target}"`);
}

function isCommentLine(line) {
  const trimmed = line.trim();
  return (
    trimmed.startsWith('//') ||
    trimmed.startsWith('/*') ||
    trimmed.startsWith('*') ||
    trimmed.startsWith('*/')
  );
}

function main() {
  const root = path.resolve(process.cwd(), process.argv[2] || '.');
  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
    console.error(`project root not found: ${root}`);
    process.exit(1);
  }

  const files = [];
  walk(root, files);

  const results = [];

  for (const file of files) {
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
    const suggestions = [];

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      if (isCommentLine(line)) {
        continue;
      }
      for (const [source, target] of Object.entries(TARGETS)) {
        if (!buildLineMatcher(source).test(line)) {
          continue;
        }
        suggestions.push({
          line: index + 1,
          source,
          target,
          before: line.trim(),
          after: replaceSpecifier(line.trim(), source, target),
        });
      }
    }

    if (suggestions.length) {
      results.push({file, suggestions});
    }
  }

  console.log('# Compat rewrite suggestions');
  console.log(`root: ${root}`);
  console.log('');

  if (!results.length) {
    console.log('No compat rewrite suggestions for the current target set.');
    return;
  }

  for (const result of results.sort((a, b) => a.file.localeCompare(b.file))) {
    console.log(`## ${relativePath(root, result.file)}`);
    for (const suggestion of result.suggestions) {
      console.log(`- line ${suggestion.line}: ${suggestion.source} -> ${suggestion.target}`);
      console.log(`  before: ${suggestion.before}`);
      console.log(`  after:  ${suggestion.after}`);
    }
    console.log('');
  }

  console.log('Next steps:');
  console.log('1. Verify the suggested compat file exists and exports the needed API.');
  console.log('2. Apply the replacements file by file instead of bulk editing blindly.');
  console.log('3. Re-run the scanner and this suggester after each migration batch.');
}

main();
