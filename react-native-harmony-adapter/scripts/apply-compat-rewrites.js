#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const {TARGETS} = require('./compat-import-targets');

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

function parseArgs(argv) {
  const args = {
    root: '.',
    write: false,
    filter: null,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--write') {
      args.write = true;
      continue;
    }
    if (arg === '--filter') {
      args.filter = argv[i + 1] || null;
      i += 1;
      continue;
    }
    if (!arg.startsWith('--')) {
      args.root = arg;
    }
  }

  return args;
}

function relativePath(root, filePath) {
  return path.relative(root, filePath) || '.';
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function replaceSpecifiers(content, source, target) {
  const escaped = escapeRegExp(source);
  return content
    .replace(new RegExp(`from\\s+(['"])${escaped}\\1`, 'g'), `from '${
      target
    }'`)
    .replace(new RegExp(`require\\(\\s*(['"])${escaped}\\1\\s*\\)`, 'g'), `require('${target}')`)
    .replace(new RegExp(`import\\(\\s*(['"])${escaped}\\1\\s*\\)`, 'g'), `import('${target}')`);
}

function main() {
  const args = parseArgs(process.argv);
  const root = path.resolve(process.cwd(), args.root);

  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
    console.error(`project root not found: ${root}`);
    process.exit(1);
  }

  const files = [];
  walk(root, files);

  const touched = [];

  for (const file of files) {
    const rel = relativePath(root, file);
    if (args.filter && !rel.includes(args.filter)) {
      continue;
    }

    const original = fs.readFileSync(file, 'utf8');
    let next = original;
    const changes = [];

    for (const [source, target] of Object.entries(TARGETS)) {
      const updated = replaceSpecifiers(next, source, target);
      if (updated !== next) {
        changes.push(`${source} -> ${target}`);
        next = updated;
      }
    }

    if (!changes.length) {
      continue;
    }

    if (args.write) {
      fs.writeFileSync(file, next);
    }

    touched.push({
      file: rel,
      changes,
    });
  }

  console.log('# Compat rewrite apply');
  console.log(`root: ${root}`);
  console.log(`mode: ${args.write ? 'write' : 'dry-run'}`);
  if (args.filter) {
    console.log(`filter: ${args.filter}`);
  }
  console.log('');

  if (!touched.length) {
    console.log('No files matched the current rewrite rules.');
    return;
  }

  for (const item of touched) {
    console.log(`## ${item.file}`);
    for (const change of item.changes) {
      console.log(`- ${change}`);
    }
    console.log('');
  }

  if (!args.write) {
    console.log('Run again with `--write` to apply these changes.');
    console.log('Use `--filter <text>` to limit rewrites to a subset of files.');
    return;
  }

  console.log('Rewrites applied. Re-run the scanner to verify remaining direct imports.');
}

main();
