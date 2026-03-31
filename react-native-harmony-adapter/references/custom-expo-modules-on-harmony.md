# Custom Expo Modules on Harmony

Use this reference when the project has business modules under `modules/` such as `expo-picker`, `expo-picture-select`, `expo-app-exit`, analytics wrappers, or other custom Expo packages that must keep working on the Harmony branch.

Also read `custom-turbomodules-on-harmony.md` when a module should stay as a real native bridge instead of being moved fully into a service layer.

## Core rule: preserve the JS contract first

For local Expo modules, the rest of the app often already depends on a stable JS API. On Harmony, prefer:

- preserving the JS-facing contract
- replacing the implementation behind that contract
- routing Harmony behavior through compat wrappers or service layers

Avoid forcing every screen to learn about Harmony-specific package names or behavior differences.

## Decide the right shape before you code

For each module under `modules/`, choose one of these paths explicitly:

### 1. Keep as a native bridge

Use this when:

- the module really needs native capabilities
- the API shape is already good
- Harmony has an equivalent native dialog or device capability

Typical examples:

- `expo-picker`
- `expo-app-exit`

Recommended pattern:

- keep the module name stable
- add Harmony host-side TurboModule wiring
- support both `TurboModuleRegistry` and `NativeModules` fallback in JS while wiring the host
- keep the native-bridge details out of business screens

### 2. Replace with a service layer

Use this when:

- the old Expo module API is less important than the user-facing behavior
- the feature needs platform-specific orchestration
- the implementation may mix native bridge and JS fallback

Typical examples:

- date/time pickers
- media-pick and gallery flows
- websocket and SignalR setup

Recommended pattern:

- create `src/platform/services/<feature>.ts[x]`
- keep route or screen code pointed at the service
- let the service decide Harmony-native bridge vs JS fallback

### 3. Stub or degrade on Harmony

Use this when:

- the module is not required for first launch
- Harmony has no immediate implementation
- a partial fake is safer than a hard crash

Typical examples:

- `expo-umeng`
- `expo-torch`
- `expo-tiphone`
- `expo-rpverify`

Recommended pattern:

- return a clear unsupported result
- log once with a Harmony-specific message
- never crash the app root because a noncritical vendor module is missing

## Practical patterns from real migrations

### TurboModule loading on Harmony

When a custom Expo module is bridged on Harmony:

- try `TurboModuleRegistry.get('<ModuleName>')`
- fall back to `NativeModules.<ModuleName>`
- log which path was found
- keep the same module name across JS, ArkTS, and C++

This helps when the host project is partially wired during migration.

### Service-first wrapper for picker-style modules

For picker modules, separate concerns:

- module file keeps the canonical JS API
- service layer owns runtime behavior
- Harmony bridge handles native dialogs if available
- JS overlay or third-party component remains as fallback

This is usually cleaner than trying to encode every picker behavior directly inside the Expo module file.

### Do not confuse API parity with UI parity

A Harmony system dialog may satisfy API parity while still failing UI parity against the Android implementation.

For example:

- a date picker may return the right value
- but its layout and header may not match the Android bottom sheet

Decide explicitly whether the migration goal is:

- native-system parity
- Android visual parity
- or just functional parity for first launch

That decision changes whether you should use a system dialog, a custom ArkTS component, or a JS bottom sheet.

## Range and fallback rules for date/time modules

If the module accepts `minDate`, `maxDate`, or `selectDate`:

- never default missing `maxDate` to `selectDate`
- never default missing `minDate` to `selectDate`
- use explicit boundary defaults that match the previous Android behavior
- log the resolved range when first stabilizing the bridge

Many "picker looks wrong" reports are actually range bugs.

## Host-side wiring checklist for local Expo modules

When a custom Expo module needs Harmony native code, verify all of these:

- `harmony/entry/oh-package.json5`
- `harmony/entry/src/main/ets/PackageProvider.ets`
- `harmony/entry/src/main/cpp/CMakeLists.txt`
- `harmony/entry/src/main/cpp/PackageProvider.cpp`
- `harmony/entry/src/main/cpp/package-provider/*.cpp`
- any custom ArkTS package file under `harmony/entry/src/main/ets`
- any custom C++ TurboModule factory under `harmony/entry/src/main/cpp`

If the module exports native views, also verify:

- `harmony/entry/src/main/ets/pages/Index.ets`

## Bun and local modules

If the project uses Bun and local module paths like `./modules/expo-picker`:

- do not assume `patch-package` regeneration will work the same way as npm or Yarn
- if install fails, inspect postinstall scripts and patch files first
- keep module-local code changes small and explicit so they can survive reinstall cycles

## Recommended validation flow for custom Expo modules

1. Verify the JS module loads without throwing.
2. Verify the native module lookup path on Harmony.
3. Verify the host project is actually linked.
4. Verify the feature returns correct values.
5. Verify the UI behavior matches the intended parity target.
6. Only then refactor the calling screens.

## Working style

- Keep business screens boring.
- Move Harmony-specific complexity into module wrappers or service files.
- Prefer recoverable fallbacks over brittle "all native or nothing" implementations.
