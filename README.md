# React Native Harmony Adapter Skill

A reusable Codex skill for adapting existing React Native projects to HarmonyOS or OpenHarmony.

This skill was distilled from a real migration of a complex React Native + Expo Router application. It focuses on the practical work needed to get a real business app running on Harmony, including dependency auditing, host-project wiring, compat wrappers, custom TurboModules, navigation stabilization, icon font fixes, and startup triage.

## What This Skill Covers

- Auditing React Native and Expo-heavy projects for Harmony migration risk
- Pinning a practical RN / RNOH baseline
- Wiring a dedicated `harmony/` host project
- Replacing unsupported libraries with Harmony equivalents or compat wrappers
- Stabilizing Expo Router and navigation-related dependencies on Harmony
- Handling icon fonts, Expo font issues, and host-side registration
- Bridging project-owned TurboModules across JS, ArkTS, and C++
- Providing scripts to audit dependencies and suggest compat rewrites

## Included Files

```text
react-native-harmony-adapter/
├── SKILL.md
├── agents/openai.yaml
├── references/
└── scripts/
```

## Installation

### Option 1: Install locally by copying the skill folder

Copy the `react-native-harmony-adapter/` directory into your local Codex skills directory:

```bash
mkdir -p "$CODEX_HOME/skills"
cp -R react-native-harmony-adapter "$CODEX_HOME/skills/"
```

### Option 2: Install from a Git repository checkout

If this package is published as a Git repository, clone it and copy or symlink the skill folder into `$CODEX_HOME/skills`.

## Recommended Usage

Example prompt:

```text
Use $react-native-harmony-adapter to adapt this existing React Native project to HarmonyOS.
```

Typical tasks:

- "Audit this Expo app for Harmony migration blockers"
- "Wire a Harmony host project for this RN app"
- "Replace unsupported Expo/native dependencies behind compat wrappers"
- "Fix Harmony startup white screen and Metro connection issues"
- "Bridge this project-owned module as a Harmony TurboModule"

## Why This Skill Exists

Many Harmony migration problems are not just JS issues. Real projects usually fail across multiple layers at once:

- dependency versions
- host project registration
- Expo runtime assumptions
- navigation package drift
- icon fonts and startup resources
- custom module linkage

This skill aims to make those patterns reusable.

## Compatibility Notes

This is a practical migration skill, not an official compatibility guarantee.

Before changing a production project, still verify:

- the current RNOH support matrix
- the exact Harmony package docs for each dependency
- the RN / Expo baseline used by your target branch

## Publishing Note

This bundle is prepared for sharing. Before publishing publicly, review:

- `LICENSE`
- `PUBLISHING.md`
- the references inside `react-native-harmony-adapter/references/`

## Source Context

This skill was refined through a real Harmony adaptation effort and then generalized for reuse.
