# Expo Router on Harmony

Use this reference when the project keeps `expo-router` on the Harmony branch and you need to stabilize startup, routing, stack navigation, tabs, or deep-link-related behavior.

Also read `navigation-dependency-set-on-harmony.md` when the errors point to mismatched `@react-navigation/*`, `expo-linking`, or stack exports.

## Treat Expo Router as a dependency bundle, not a single package

When `expo-router` breaks on Harmony, the root cause is often not the router package itself. Audit the whole navigation set together:

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

If one part of this set is mismatched or partially linked, the resulting error may surface far away from the real cause.

## Common failure clusters

### `ExpoRoot` is undefined

Typical meaning:

- the Expo runtime layer still expects native Expo module plumbing that Harmony is not providing
- the app is importing unsupported Expo native modules during startup

What to check first:

- `expo-modules-core`
- `EXNativeModulesProxy`
- `expo-font`
- any custom `modules/*` package loaded before the first route renders

Do not debug route files first until these startup imports are under control.

### `Linking.getInitialURL` is undefined

Typical meaning:

- the router stack expects `expo-linking` or `Linking` behavior that the Harmony branch is not exposing correctly
- a wrapper or package replacement removed a method the router still calls

What to do:

- verify the `expo-linking` package version on the Harmony branch
- verify whether the app should use a compat wrapper for linking instead of direct package imports
- confirm that the router and navigation package set is still internally compatible after the RN downgrade

### `Couldn't find a LinkingContext context`

Typical meaning:

- the navigation container tree is broken
- a layout file or wrapper component is rendering stack content outside the expected container hierarchy
- a replaced stack package exports a different component shape than the JS expects

What to inspect:

- root `app/_layout`
- nested `_layout` files
- wrappers around `Slot`, `Stack`, `Tabs`, or `NavigationContainer`
- Harmony replacements for stack or native-stack packages

### `Element type is invalid` from `createNativeStackNavigator`

Typical meaning:

- a stack-related export became `undefined`
- package swap preserved the import path but not the exported symbol
- a wrapper or alias returns the wrong module shape

What to check:

- the exact exports from `@react-navigation/native-stack` or Harmony stack replacement
- any compat layer that re-exports stack components
- whether the project mixed `native-stack`, `stack`, and Harmony-specific stack packages inconsistently

### `useFrameSize is not a function`

Typical meaning:

- `@react-navigation/elements` version is incompatible with the rest of the navigation set
- a Harmony-specific replacement package expects a different `elements` version

Do not patch the screen first. Reconcile the navigation dependency set.
Switch to `navigation-dependency-set-on-harmony.md` and verify the package set, Metro aliases, and TS aliases together.

## Layout-file pitfalls seen in real Expo Router migrations

### Missing default export warnings

If a route reports "missing the required default export":

- check the file first for export mistakes
- if the file looks correct, suspect an earlier module-load crash prevented evaluation
- fix the earliest native-module or import error before trusting route warnings

### `Layout children must be of type Screen`

Typical meaning:

- a layout file is putting custom children directly under a navigator instead of using the router-supported layout pattern
- a Harmony-specific wrapper changed how layout children are resolved

What to do:

- keep custom content outside the navigator component
- if custom children are required, build a custom layout wrapper rather than stuffing arbitrary nodes into `Stack` or `Tabs`

## Harmony-specific working rules for Expo Router

### Keep routing stable, replace native dependencies under it

In most migrations it is better to:

- keep `expo-router`
- keep route files and route groups
- replace unsupported native modules and navigation-adjacent libraries under the router

It is usually worse to rewrite the app away from Expo Router early unless the router itself is fundamentally blocked.

### Reduce the first rendered route if startup is unclear

If the app boots to white and route-level errors are noisy:

1. reduce the first route to minimal content
2. keep the root layout intact
3. restore wrappers and page sections incrementally

This helps separate "router is broken" from "first screen import crashed".

### Verify navigation wrappers before page logic

Check these in order:

1. `GestureHandlerRootView`
2. `SafeAreaProvider`
3. root router layout
4. stack or tab wrapper replacements
5. page-level business code

## Packages that often need wrappers in Expo Router apps

- `expo-linking`
- `@expo/vector-icons`
- `react-native-tab-view`
- `react-native-keyboard-controller`
- any screen transition or blur dependency used in layouts

If these are imported directly in `_layout` files, they become startup-critical and should be wrapped early.

## Validation checklist

1. App root loads without `ExpoRoot` errors.
2. First route renders.
3. One stack push works.
4. One back navigation works.
5. One tab switch works.
6. Deep-link-related methods used by the router are defined.
7. Layout warnings are gone or understood.

## Working style

- Treat layout files as startup-critical infrastructure.
- Prefer wrapping risky dependencies used by layouts before touching page screens.
- When router errors stack on top of native-module failures, fix the native-module failure first.
