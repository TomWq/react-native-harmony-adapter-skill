# Expo Projects on Harmony

Use this reference when the project depends on `expo`, `expo-router`, local Expo modules in `modules/`, or an Expo-managed JS layer running on a separate Harmony host project.

For deeper dives, also read:

- `expo-router-on-harmony.md` for router and navigation failures
- `custom-expo-modules-on-harmony.md` for business modules under `modules/`
- `navigation-dependency-set-on-harmony.md` for keeping the router and navigation package set aligned
- `vector-icons-and-fonts-on-harmony.md` for icon font failures and `@expo/vector-icons` replacement

## First rule: keep the branch honest

- Do not leave the Harmony branch on a mixed baseline where Expo packages expect one RN line and the Harmony host is pinned to another.
- If the Harmony branch downgrades RN for RNOH compatibility, audit the Expo SDK and Expo native packages immediately after that downgrade.
- In practice, "Metro starts but runtime is full of undefined Expo modules" often means the branch still carries an incompatible Expo package set.

## What to audit first in Expo-heavy apps

1. `package.json`
2. `app/` route structure if `expo-router` is used
3. `modules/` for custom Expo modules
4. `babel.config.*`, `metro.config.*`, and app entry files
5. all direct imports from Expo native packages and `expo-modules-core`

Questions to answer early:

- Is this app still using Expo Router as the navigation shell?
- Which Expo modules are standard packages, and which are local business modules?
- Which Expo capabilities are critical for first launch, and which can be stubbed on Harmony?

## Recommended migration buckets

### Keep with minimal change

- `expo-router` if the app already depends heavily on file-based routing
- `expo-linking` when it works through the router stack and Harmony wrappers are in place
- JS-only Expo utilities that do not require native code

### Replace behind wrappers or services

- `@expo/vector-icons` -> compat wrapper backed by `react-native-vector-icons`
- picker-like custom Expo modules -> `src/platform/services/pickerService`
- media picker flows -> project service wrapper instead of direct Expo imports
- route-based gallery or fullscreen preview libraries -> route-based compat layer
- networking or websocket setup -> platform service wrapper

### Stub or degrade first on Harmony

- vendor analytics such as custom `expo-umeng`
- flashlight, phone, identity verification, or business-specific Expo modules when Harmony implementation is not required for first launch
- any local Expo module that would otherwise hard-crash at startup

## Local Expo modules

For business modules under `modules/`:

- Keep the JS contract stable if the rest of the app already depends on it.
- Add a Harmony-specific implementation or service fallback rather than rewriting all calling code.
- Prefer project service layers when the behavior is more important than the original Expo module shape.
- For TurboModule-style bridges on Harmony, support both `TurboModuleRegistry` and `NativeModules` fallback while wiring the host project.

Typical examples:

- `expo-picker` -> service layer plus Harmony date/text picker bridge
- `expo-picture-select` -> image-picker service wrapper
- `expo-app-exit` -> Harmony exit-app package or explicit unsupported path
- analytics or device business SDK wrappers -> empty Harmony implementation with clear logging

If the project has many of these, switch to `custom-expo-modules-on-harmony.md` and work module-by-module instead of screen-by-screen.

## Expo Router on Harmony

Expo Router can stay, but verify its dependencies as a unit:

- `@react-navigation/*`
- `react-native-screens`
- `react-native-safe-area-context`
- `expo-linking`
- any custom layout wrappers in `app/_layout` and nested `_layout` files

Common warning signs:

- `ExpoRoot` is undefined
- `Linking.getInitialURL` is undefined
- `Couldn't find a LinkingContext context`
- route files are missing required default exports
- stack or tab components become undefined after package swaps

If router or layout failures dominate the error stream, switch to `expo-router-on-harmony.md` and stabilize the router shell before fixing business pages.
If the router fails after package swaps or RN baseline changes, also use `navigation-dependency-set-on-harmony.md` before debugging page code.

When these appear:

- do not debug the page screen first
- first verify the navigation package set and the router-related wrappers
- confirm the host side packages for screens, safe area, and navigation-adjacent native modules

## Expo startup blockers seen in real migrations

### `expo-modules-core` or `EXNativeModulesProxy` failures

- If runtime reports missing `EXNativeModulesProxy`, `ExpoRoot`, or `ExpoFontLoader`, the app is still depending on Expo native-module plumbing that Harmony is not providing.
- Remove, replace, or wrap those imports before trying to debug downstream screen errors.
- Do not leave Harmony depending on Expo native modules that are not actually linked into the host.

### Metro or dev-server starts but app stays white

- Expo Router may be alive while the first route crashes during module evaluation.
- Temporarily reduce the first route to a minimal component if needed, but still audit native Expo dependencies first.
- Treat "main has not been registered" as a downstream symptom until module-load errors are eliminated.

### `bun start` or Metro crashes inside `expo-modules-core`

- Recheck the Expo SDK and RN baseline pairing on the Harmony branch.
- Recheck whether an incompatible Expo package version remained after the RN downgrade.
- Do not assume this is a Metro bug first; mixed package baselines are a more common cause.

## Icons and fonts in Expo apps

- If the app uses `@expo/vector-icons`, Harmony should usually bypass Expo font loading and use a compat wrapper backed by `react-native-vector-icons`.
- Register required font files in the Harmony host project.
- If icons render as white boxes or missing glyphs, verify the font registration before changing icon usage.
- If `ExpoFontLoader` or icon exports are undefined, switch to `vector-icons-and-fonts-on-harmony.md` and audit both the JS wrapper and host font registration.

## Date and time pickers in Expo-style modules

- Decide whether you need API parity or UI parity.
- Harmony system dialogs may work functionally but not match the Android bottom-sheet design.
- If range behavior matters, log resolved `minDate`, `maxDate`, and `selectDate`.
- Do not default missing range boundaries to the selected value; that silently collapses the selectable range.

## Validation checklist for Expo-heavy Harmony branches

1. Metro or Bun dev server starts without `expo-modules-core` failures.
2. The app root loads without `ExpoRoot` or `EXNativeModulesProxy` errors.
3. Login and first-route screens render.
4. Router navigation works across at least one stack push and one tab change.
5. Icons render with the expected fonts.
6. Linking-related methods used by Expo Router are available or wrapped.
7. Local Expo business modules either work on Harmony or fail gracefully.

## Working style for Expo migrations

- Do not treat Expo as all-or-nothing.
- Keep the router and JS architecture when they still help, but be ruthless about replacing unsupported native Expo pieces.
- Prefer service facades and compat wrappers over screen-by-screen hacks.
- Stabilize startup first, then navigation, then business modules, then UI parity.
