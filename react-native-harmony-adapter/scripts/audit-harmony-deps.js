#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const {classifyDependencies} = require('./harmony-deps-data');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function collectDeps(pkg) {
  return {
    ...pkg.dependencies,
    ...pkg.devDependencies,
    ...pkg.peerDependencies,
  };
}

function main() {
  const input = process.argv[2] || 'package.json';
  const pkgPath = path.resolve(process.cwd(), input);

  if (!fs.existsSync(pkgPath)) {
    console.error(`package.json not found: ${pkgPath}`);
    process.exit(1);
  }

  const pkg = readJson(pkgPath);
  const deps = collectDeps(pkg);
  const names = Object.keys(deps).sort();
  const {direct, replacement, compat, degrade, unknownNativeLike} =
    classifyDependencies(names);

  console.log(`# Harmony dependency audit`);
  console.log(`package: ${pkg.name || '(unknown)'}`);
  console.log(`source: ${pkgPath}`);
  console.log('');

  printGroup('Direct Harmony package likely exists', direct.map(item => `${item.name} -> ${item.target}`));
  printGroup('Harmony replacement suggested', replacement.map(item => `${item.name} -> ${item.target}`));
  printGroup('Compat wrapper recommended', compat);
  printGroup('Degrade or stub first', degrade);
  printGroup('Unknown native-like packages to verify manually', unknownNativeLike);

  console.log('Next steps:');
  console.log('1. Verify RN/RNOH version compatibility first.');
  console.log('2. Check every selected package against official Harmony usage docs.');
  console.log('3. Manually wire Harmony host files for packages that expose TurboModules or native views.');
}

function printGroup(title, items) {
  console.log(`## ${title}`);
  if (!items.length) {
    console.log('- none');
    console.log('');
    return;
  }
  for (const item of items) {
    console.log(`- ${item}`);
  }
  console.log('');
}

main();
