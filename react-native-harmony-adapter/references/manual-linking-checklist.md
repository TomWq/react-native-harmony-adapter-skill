# Manual Linking Checklist

Use this checklist when a Harmony package is installed but still fails at runtime.

## Symptoms

- `TurboModuleRegistry.getEnforcing(...): '<Module>' could not be found`
- `Couldn't find Turbo Module on the ArkTs side`
- `NativeModule.<Name> is null`
- native view renders as blank
- component type is undefined after package swap
- gestures, netinfo, device-info, restart, or icons fail only on Harmony

## Files to inspect

Check all of these before changing JS:

- `harmony/entry/oh-package.json5`
- `harmony/build-profile.json5`
- `harmony/entry/hvigorfile.ts`
- `harmony/entry/src/main/ets/PackageProvider.ets`
- `harmony/entry/src/main/cpp/PackageProvider.cpp`
- `harmony/entry/src/main/cpp/package-provider/*.cpp`
- `harmony/entry/src/main/cpp/CMakeLists.txt`
- `harmony/entry/src/main/ets/pages/Index.ets`

## What to confirm

### `oh-package.json5`

- The Harmony package is declared.
- The local `file:` path points to the correct HAR or source package.
- The package name matches the docs exactly.

### `build-profile.json5`

- Source-style Harmony modules are registered in the top-level `modules` array.
- If a package provides ArkTS sources that are imported directly at runtime, do not rely on `oh-package.json5` alone.

### `harmony/entry/hvigorfile.ts`

- Module-specific hvigor plugins are attached at the `entry` module level when the package docs require it.
- For Pushy, missing `reactNativeUpdatePlugin()` can leave module packaging incomplete even when imports compile.

### `PackageProvider.ets`

- The ArkTS package class is imported from the right package entry.
- The package instance is included in the exported package list.

### `PackageProvider.cpp`

- The C++ package header is included if the library needs native registration.
- The package is added to the returned package vector.
- If the project delegates registration into helper files such as `appendServicePackages(...)`, inspect those helper files too. A clean root `PackageProvider.cpp` does not prove the package is actually wired.

### `CMakeLists.txt`

- The library source or Harmony C++ module is added with `add_subdirectory`.
- The produced native target is linked in `target_link_libraries`.

### `Index.ets`

- ArkTS view components are registered for native view packages.
- Fonts are registered for icon libraries.
- Debug bundle provider uses the host machine IP, not just `localhost`.

## Package-name mismatch reminder

- Some Harmony libraries ship under a different npm name than the original community package.
- Example: business code may import `@react-native-community/netinfo` while the Harmony native package is `@react-native-ohos/netinfo`.
- In those cases, fixing host linkage alone may not be enough. Add a project-level compat wrapper or explicit alias so the JS import path resolves to the Harmony-backed implementation.

## After fixing config

1. Run `ohpm install` in `harmony/` and `harmony/entry/`.
2. Clear stale Harmony build artifacts if the old package is still being loaded.
3. Rebuild and reinstall the Harmony app.
4. If the package still fails only from JS, scan the codebase for direct imports of the old community package path and replace them with the compat wrapper.

Typical stale directories:

- `harmony/.hvigor`
- `harmony/entry/build`
- `harmony/entry/.cxx`
