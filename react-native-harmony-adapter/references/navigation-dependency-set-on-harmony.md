# Navigation Dependency Set on Harmony

Use this reference when `expo-router` or `@react-navigation/*` starts failing after RN downgrade, Harmony package swaps, or partial wrapper migration.

For related references, also read:

- `expo-router-on-harmony.md` for router and layout failures
- `compat-import-map.md` for wrapper targets
- `manual-linking-checklist.md` if a navigation-adjacent native package is installed but still null at runtime

## Core rule

Treat navigation as a versioned bundle, not as isolated packages.

On Harmony, a lot of scary runtime errors are just symptoms of one mismatched navigation dependency set.

Audit these together:

- `expo-router`
- `expo-linking`
- `@react-navigation/native`
- `@react-navigation/native-stack`
- `@react-navigation/stack`
- `@react-navigation/bottom-tabs`
- `@react-navigation/elements`
- `react-native-screens`
- `react-native-safe-area-context`
- `react-native-gesture-handler`

If one of them is swapped, downgraded, aliased, or host-linked differently, validate the whole set again.

## Common symptom mapping

### `useFrameSize is not a function`

Typical meaning:

- `@react-navigation/elements` is out of sync with the rest of the navigation stack

What to do:

- reconcile the dependency set first
- if Harmony needs a compat implementation, alias it consistently in both Metro and TS config

### `Element type is invalid`

Typical meaning:

- `native-stack`, `stack`, tab, or elements exports became `undefined`
- a compat wrapper returns the wrong module shape

What to do:

1. inspect the exact export shape expected by app code
2. verify the alias target exports the same symbols
3. confirm the package set still matches after the RN baseline change

### `Couldn't find a LinkingContext context`

Typical meaning:

- the navigation container hierarchy is broken
- a stack replacement is rendering outside the expected linking context

What to do:

- inspect root and nested `_layout` files
- inspect any custom compat stack wrapper
- verify `expo-linking` and stack packages were adapted together

### `Linking.getInitialURL is not a function`

Typical meaning:

- the Harmony branch replaced or stubbed `expo-linking` or `Linking` incompletely

What to do:

- keep a compat wrapper for `expo-linking`
- verify it exposes the methods the router actually calls
- do not assume a shallow no-op stub is enough

### `Layout children must be of type Screen`

Typical meaning:

- the layout file is mixing custom nodes directly into a navigator
- a wrapper changed how children are normalized

What to do:

- fix the layout structure first
- do not bury custom content directly inside `Stack` or `Tabs`

## Recommended Harmony strategy

### Keep the route structure, wrap the risky native edges

In most Expo Router migrations, it is better to:

- keep `expo-router`
- keep route files and route groups
- wrap `expo-linking`, stack packages, and elements when Harmony needs compatibility glue

Avoid rewriting the whole navigation shell unless the router is fundamentally blocked.

### Alias consistently

If Harmony needs a compat file for a navigation package:

- alias it in Metro
- alias it in TypeScript paths
- keep the exported API shape compatible with the original package

If only one layer is aliased, the app can compile yet still fail at runtime.

### Prefer one chosen stack path

Do not leave the Harmony branch half-on `native-stack` and half-on `stack` accidentally.

Decide explicitly:

- which package backs the stack behavior on Harmony
- which import path business code uses
- whether a compat wrapper normalizes behavior and exports

Mixed stack usage is one of the fastest ways to get `undefined` component exports.

## Navigation-adjacent native packages to verify

These are often blamed later, but they can be root causes during startup:

- `react-native-screens`
- `react-native-safe-area-context`
- `react-native-gesture-handler`
- `react-native-pager-view`
- keyboard or blur dependencies used directly in layout files

If any of these are null, undefined, or partially linked, navigation can fail in misleading ways.

## Practical audit order

1. Check the exact versions in `package.json`.
2. Check Metro aliases for navigation packages.
3. Check TS path aliases for the same packages.
4. Check `app/_layout` and nested `_layout` files for startup-critical imports.
5. Check Harmony host linkage for screens, safe area, and gesture handler.
6. Only after that, debug page-level route files.

## Working style

- Reconcile the dependency set before patching individual pages.
- Keep compatibility logic close to wrappers, not spread across route files.
- When multiple navigation errors appear together, suspect version drift first.
- If a route warning appears after an earlier startup import error, fix the earlier import error first.
