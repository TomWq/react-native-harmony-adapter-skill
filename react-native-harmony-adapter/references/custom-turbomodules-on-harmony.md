# Custom TurboModules on Harmony

Use this reference when you need to build or debug a project-owned TurboModule on Harmony, especially for local business modules that must keep a stable JS API while adding Harmony host wiring.

For adjacent topics, also read:

- `custom-expo-modules-on-harmony.md` when deciding between TurboModule, service layer, or stub
- `manual-linking-checklist.md` when runtime says the native module is missing
- `compat-import-map.md` when the module should stay behind a project wrapper instead of leaking platform details into screens

## First decision: should this really be a TurboModule

Use a TurboModule when:

- the feature needs real native capability
- the JS contract is already stable and widely used
- the module is command-like and Promise-based
- Harmony has a system capability or native SDK to back it

Prefer a service layer instead when:

- the feature is mostly orchestration and fallback logic
- UI parity matters more than native-module purity
- the implementation will mix native calls, JS state, and route-level behavior

Typical split:

- picker command bridge -> TurboModule is reasonable
- picker product flow with bottom-sheet parity and fallback UI -> service layer is usually better

## Name consistency is everything

The module name must match across every layer.

Keep the same string in:

- JS lookup: `TurboModuleRegistry.get('<Name>')`
- JS fallback: `NativeModules.<Name>`
- ArkTS class static name
- ArkTS package factory checks
- C++ factory delegate checks

If one layer says `ExpoPicker` and another says `ExpoPickerModule`, the runtime error will look much more confusing than the real problem.

## Recommended structure

### 1. JS-facing module contract

Keep the business API stable.

Recommended shape:

- define a narrow TypeScript interface
- on Harmony, try `TurboModuleRegistry.get(...)`
- then fall back to `NativeModules.<Name>`
- return explicit unsupported errors if the module is unavailable

Why:

- Harmony wiring is often incremental during migration
- the fallback path makes it easier to diagnose whether the issue is host linkage or JS import shape

Good pattern:

- Promise-based methods
- explicit argument types
- a single place that owns the module lookup

## 2. ArkTS TurboModule class

Create a dedicated ArkTS class that extends `UITurboModule`.

Typical responsibilities:

- expose the same method names as the JS contract expects
- use `public static NAME = '<ModuleName>'`
- get `UIContext` when a system dialog or UI-bound API is needed
- return Promises for async commands
- log the inputs and resolved values while stabilizing the bridge

Good fit for ArkTS TurboModules:

- date or time picker dialogs
- simple platform commands
- native capability lookups

## 3. ArkTS package registration

Create a package file that extends `RNPackage` and returns a `TurboModulesFactory`.

The package should:

- create the TurboModule when the name matches
- report `hasTurboModule(name)` consistently

Then add that package to:

- `harmony/entry/src/main/ets/PackageProvider.ets`

If this step is missing, the ArkTS side may compile but the runtime still cannot find the module.

## 4. C++ TurboModule bridge

For ArkTS-backed TurboModules, wire the C++ side with `ArkTSTurboModule`.

Typical pieces:

- host functions that call `callAsync(...)`
- an `ArkTSTurboModule` subclass with `methodMap_`
- a `TurboModuleFactoryDelegate`
- a package class returning that delegate
- registration inside the package list returned by the Harmony host

Why this matters:

- having only ArkTS code is not enough
- the JS runtime still needs the C++ side to expose the TurboModule correctly

## 5. Host package list

Register the package in the C++ package-assembly path actually used by the project.

Do not assume everything lives in one root file.

Real projects often split registration across:

- `harmony/entry/src/main/cpp/PackageProvider.cpp`
- `harmony/entry/src/main/cpp/package-provider/*.cpp`

If the project uses helper files like `appendServicePackages(...)`, the module must be added there too.

## Practical build pattern

For a project-owned TurboModule, verify this chain end to end:

1. JS module file
2. ArkTS TurboModule class
3. ArkTS package file
4. `PackageProvider.ets`
5. C++ `ArkTSTurboModule` factory
6. C++ package list registration
7. `CMakeLists.txt` if a new source file or target must be compiled

Missing any one layer can produce a "module not found" error.

## Common errors and what they usually mean

### `Couldn't find Turbo Module on the ArkTs side`

Typical meaning:

- `PackageProvider.ets` does not include the package
- the ArkTS package factory does not expose the same module name
- the C++ side is not registering the TurboModule factory

Check:

- module name string in every layer
- ArkTS package registration
- C++ package registration path actually used by the host

### `TurboModuleRegistry.getEnforcing(...): '<Name>' could not be found`

Typical meaning:

- the host project is incompletely wired
- JS is asking for the right module name, but the native side never exported it

Check:

- C++ registration
- `PackageProvider.ets`
- whether the Harmony app was rebuilt after host changes

### `NativeModule.<Name> is null`

Typical meaning:

- the module lookup is falling back, but the native module was still not exported
- or the JS import path is still hitting the old community module instead of your project wrapper

Check:

- JS wrapper path
- Metro and TS aliases
- host-side package export

### Methods exist but calls fail strangely

Typical meaning:

- C++ `methodMap_` argument counts do not match the JS call signature
- ArkTS method names differ slightly from the JS names
- ArkTS return shape is not serializable as expected

Check:

- method names
- method arity in `MethodMetadata`
- Promise resolve and reject paths

## ArkTS-specific pitfalls

### Structural typing errors

ArkTS is stricter than TypeScript.

If you hit errors like:

- `Structural typing is not supported`

Prefer:

- explicit interfaces or classes for returned values
- assigning through a typed local variable before resolving
- simpler serializable shapes for bridge results

### UI-only APIs

If the module opens dialogs or uses UI-bound APIs:

- get `UIContext` from the TurboModule context
- run UI operations inside the expected scoped task
- reject clearly when UI context is unavailable

## Logging strategy that actually helps

During stabilization, add lightweight logs at three layers:

- JS: whether TurboModule or `NativeModules` path was found
- ArkTS: inputs, resolved ranges, selected values
- C++: only when needed, mostly to confirm registration path

This is usually enough to tell whether the failure is:

- lookup
- linkage
- argument mismatch
- UI runtime behavior

## Good migration posture

- Keep screens unaware of Harmony registration details.
- Keep the module name stable.
- Prefer a thin TurboModule plus a service layer over a giant native bridge.
- Use TurboModule for native commands, not for every piece of business behavior.
