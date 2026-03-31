---
name: react-native-harmony-adapter
description: Use when adapting an existing React Native project to HarmonyOS or OpenHarmony, especially when auditing dependencies, pinning a compatible RN/RNOH baseline, creating a Harmony host project, replacing unsupported libraries, adding manual package linkage, or debugging Harmony-specific startup, Metro, gesture, TurboModule, icon font, keyboard, tab view, and white-screen issues.
---

# React Native Harmony Adapter

Use this skill for existing RN projects that need HarmonyOS support. Prefer adapting the current codebase over rewriting business logic unless the project is deeply tied to unsupported Expo modules or a mismatched RN baseline.

Read [references/dependency-matrix.md](references/dependency-matrix.md) when auditing third-party packages.
Read [references/manual-linking-checklist.md](references/manual-linking-checklist.md) when a TurboModule, native view, or ArkTS-side package is missing.
Read [references/host-project-template.md](references/host-project-template.md) when wiring or reviewing Harmony host project files.
Read [references/compat-import-map.md](references/compat-import-map.md) when replacing direct risky imports with project-level wrappers.
Read [references/expo-projects.md](references/expo-projects.md) when the app uses Expo, Expo Router, local Expo modules under `modules/`, or a mixed Expo-plus-bare workflow.
Read [references/expo-router-on-harmony.md](references/expo-router-on-harmony.md) when debugging Expo Router startup, layout, linking, or navigation-container issues on Harmony.
Read [references/navigation-dependency-set-on-harmony.md](references/navigation-dependency-set-on-harmony.md) when stack, tabs, linking, or `@react-navigation/*` exports become undefined after package swaps.
Read [references/vision-camera-on-harmony.md](references/vision-camera-on-harmony.md) when debugging camera preview, `takePhoto()` returning `null`, `photoSession null`, `7400101` or `7400201` errors, camera-roll saves, or Harmony-specific VisionCamera patches.
Read [references/custom-expo-modules-on-harmony.md](references/custom-expo-modules-on-harmony.md) when adapting business Expo modules under `modules/` or replacing them with Harmony services.
Read [references/custom-turbomodules-on-harmony.md](references/custom-turbomodules-on-harmony.md) when building or debugging a project-owned TurboModule with JS, ArkTS, and C++ registration on Harmony.
Read [references/vector-icons-and-fonts-on-harmony.md](references/vector-icons-and-fonts-on-harmony.md) when `@expo/vector-icons`, `expo-font`, icon white boxes, or missing glyphs appear on Harmony.
Run `node scripts/audit-harmony-deps.js /path/to/package.json` to produce a first-pass migration report for a project.
Run `node scripts/generate-harmony-plan.js /path/to/package.json` to produce a first draft migration plan.
Run `node scripts/scan-compat-imports.js /path/to/project-root` to find source files that still import risky packages directly.
Run `node scripts/suggest-compat-rewrites.js /path/to/project-root` to generate line-level import replacement suggestions.
Run `node scripts/apply-compat-rewrites.js /path/to/project-root` for a dry-run bulk rewrite, then re-run with `--write` when ready.

## Goals

1. Keep the main iOS/Android line stable.
2. Build a dedicated Harmony branch and host project.
3. Pin RN and RNOH to a documented compatible line.
4. Replace or degrade unsupported native capabilities with minimal JS churn.
5. Make Harmony boot, connect to Metro, render core flows, and fail gracefully for unsupported features.

## Baseline workflow

1. Audit the repo structure and dependency graph first.
2. Identify the current RN version and compare it with documented RNOH support.
3. If the current RN line is too new, create a dedicated Harmony branch and downgrade only that branch.
4. Create or verify a `harmony/` host project instead of polluting the main native targets.
5. Classify dependencies into four buckets:
   - direct Harmony package exists
   - Harmony replacement package exists
   - JS-only or compat-wrapper is enough
   - unsupported now, must degrade or stub
6. Add a platform service layer for risky native capabilities before touching many screens.
7. Run on Harmony emulator early, then fix startup blockers before polishing screens.

## Versioning rules

- Do not guess RN compatibility. Check the exact RNOH release notes and package docs.
- Prefer a documented RN/RNOH pair such as `react-native 0.77.1` with the matching `@react-native-oh/react-native-harmony` line when the app is currently on a newer RN.
- Keep Harmony changes on a dedicated branch if the baseline needs downgrade.
- Do not back-port downgraded native dependencies into the main branch.

## Dependency audit playbook

For each native dependency, decide the action explicitly:

- If Harmony package exists in official usage docs, swap to that package and follow its integration guide.
- If the original package is unsupported but a Harmony alternative exists, replace it behind a compat wrapper.
- If the feature is not critical for first launch, degrade it behind a capability flag.
- If the module is custom Expo code, either replace it with a Harmony third-party package or leave an empty Harmony implementation until vendor SDK arrives.

Typical high-value categories to audit:

- navigation and screens
- gestures and reanimated
- safe area and keyboard controller
- vector icons and font registration
- webview, pager-view, tab-view
- maps, geolocation, camera, image picker
- share, permissions, storage, mmkv, blob util
- push, device-info, restart, bootsplash
- hot update

When auditing a project, prefer a script-assisted first pass:

1. Run `node scripts/audit-harmony-deps.js /absolute/path/to/package.json`.
2. Run `node scripts/generate-harmony-plan.js /absolute/path/to/package.json`.
3. Run `node scripts/scan-compat-imports.js /absolute/path/to/project-root`.
4. Run `node scripts/suggest-compat-rewrites.js /absolute/path/to/project-root`.
5. Optionally run `node scripts/apply-compat-rewrites.js /absolute/path/to/project-root --filter <path-fragment>` and add `--write` only after reviewing the dry-run output.
6. Review the generated buckets:
   - direct Harmony package likely exists
   - Harmony replacement suggested
   - compat wrapper or JS-only handling
   - unsupported or degrade first
7. Review the generated migration plan and adjust the RN baseline decision.
8. Then verify each high-risk package against the official Harmony usage docs before changing code.

## Host project checklist

Harmony native packages are often not autolinked. Assume manual integration is required unless the exact library docs say otherwise.

Check these files for every linked package:

- `harmony/entry/oh-package.json5`
- `harmony/build-profile.json5`
- `harmony/entry/hvigorfile.ts`
- `harmony/entry/src/main/ets/PackageProvider.ets`
- `harmony/entry/src/main/cpp/PackageProvider.cpp`
- `harmony/entry/src/main/cpp/CMakeLists.txt`
- `harmony/entry/src/main/ets/pages/Index.ets`

Also verify component registration for ArkTS-side views in `Index.ets`, such as:

- map views
- pager view
- pdf
- webview
- vision camera
- icon fonts

## JS adaptation strategy

Prefer wrappers over broad business rewrites.

Use these patterns:

- `src/compat/*` for package-level compatibility shims
- `src/platform/services/*` for platform capabilities and service facades
- feature flags for temporarily disabled Harmony features
- explicit degraded return values instead of silent failure

Common real-world wrapper targets:

- `@react-native-community/netinfo` -> `src/compat/netinfo`
- custom picker flows such as `expo-picker` -> `src/platform/services/pickerService`
- `@nandorojo/galeria` or other fullscreen gallery libraries -> route-based compat wrapper
- `@microsoft/signalr` transport setup -> `src/platform/services/signalrService`
- `react-native-unistyles` when Harmony needs runtime or typing adjustments -> `src/compat/react-native-unistyles`
- `@expo/vector-icons` -> `src/compat/expo-vector-icons` plus host-level font registration
- router and stack imports such as `expo-linking`, `@react-navigation/elements`, and `@react-navigation/native-stack` -> project compat aliases when the Harmony dependency set diverges

Avoid direct page-level imports of risky native packages once Harmony work starts.
After creating compat wrappers, use the import scanner to replace direct imports incrementally instead of editing the entire app at once.

## Startup triage order

Always fix blockers in this order:

1. app can compile and install
2. app can start without native crash
3. Metro can connect in debug
4. root component renders
5. input and gestures work
6. key pages render
7. polish layout and interactions

## Common fixes from real migrations

### White screen but app process is alive

- Check whether a wrapper view is swallowing layout or touch events.
- Reduce the page to a minimal `<Text>` and restore sections incrementally.
- Suspect keyboard, blur, custom screen wrappers, or unsupported complex composed components first.

### Inputs or buttons cannot click

- Verify `GestureHandlerRootView` wraps the app root.
- Check custom wrappers for `pointerEvents`, overlays, or full-screen absolute children.
- Confirm the page is not blocked by a loading mask that never dismisses.

### `GestureDetector must be used as a descendant of GestureHandlerRootView`

- Root-wrap the app with `GestureHandlerRootView`.
- Recheck any nested app entry wrappers introduced during migration.

### TurboModule not found

- The Harmony package is not fully linked.
- Recheck `oh-package.json5`, `PackageProvider.ets`, `PackageProvider.cpp`, and `CMakeLists.txt`.
- Many Harmony libraries need manual native registration even if JS dependency is installed.
- If the project uses split package-factory files such as `cpp/package-provider/*.cpp`, inspect those too. Do not assume everything is registered directly inside root `PackageProvider.cpp`.

### `NativeModule.<Name> is null` for a community package that has a Harmony fork

- Installing `@react-native-ohos/*` is not enough if business code still imports the community package path.
- Common example: `@react-native-community/netinfo` vs `@react-native-ohos/netinfo`.
- Link the Harmony package on the host side and route JS imports through a compat wrapper instead of relying on implicit aliasing.

### `bun install` fails inside `patch-package`

- A malformed patch file can block the whole install even when dependencies are otherwise fine.
- If `patch-package` says a patch file cannot be parsed, inspect the patch first instead of reinstalling blindly.
- In Bun-only projects, `npx patch-package` may refuse to regenerate patches because there is no `package-lock.json` or `yarn.lock`.
- In that case regenerate the patch by diffing the installed package against an `npm pack` tarball or another clean source snapshot, then replace the broken patch file.

### VisionCamera preview opens but `takePhoto()` returns `null`

- Read [references/vision-camera-on-harmony.md](references/vision-camera-on-harmony.md) before changing page code blindly.
- On Harmony, this is often a session-init race, not a JS call-site bug.
- Start by checking whether preview is visible, whether `photoSession null` appears, and whether the current surface was re-created after first init.
- Prefer the official permission helpers from VisionCamera on Harmony before adding custom permission logic.

### VisionCamera logs `7400101` or `7400201`

- `7400101` usually points to a bad preview/session argument combination such as ratio or profile mismatch.
- `7400201` can be a secondary camera-service failure after a duplicate init; if preview is already live and capture succeeds, treat it as a duplicate-init clue first.
- Fix the native/session lifecycle before rewriting the camera page UI.

### Camera preview is too small or letterboxed

- Do not assume this is only page-level styling.
- On Harmony, inspect the native preview ratio, preview profile selection, and resize-mode behavior in the VisionCamera host package.
- If you patch the package under `node_modules`, persist it with `patch-package` or the next install may wipe the fix.

### Metro debug mode cannot connect

- `localhost` inside the emulator is not your Mac.
- In `Index.ets`, prefer the host machine IP with `MetroJSBundleProvider.fromServerIp('<host-ip>', 8081)`.
- Keep a fallback provider, but do not rely on `localhost` as the first choice.

### Icon text or icon glyphs are wrong

- Replace `@expo/vector-icons` usage with a compat layer backed by `react-native-vector-icons` for Harmony.
- Register all required icon font files in `Index.ets`.
- Ensure raw font files are copied into Harmony resources.

### Tab can swipe but cannot tap

- Verify the exact Harmony tab-view package and docs before patching app logic.
- If a package regression exists, prefer a narrow compat shim over rewriting every screen.
- Do not keep a custom tab implementation if it regresses layout across many screens.

### Date or time picker works but the selectable range is wrong

- When bridging custom pickers to ArkTS `showDatePickerDialog` or `showTimePickerDialog`, do not default missing `maxDate` or `minDate` to `selectDate`.
- Use explicit fallback boundaries such as `1900-01-01` to `2100-01-01` so Harmony behavior matches the previous Android picker contract.
- Log the resolved range during migration. Many "UI looks wrong" reports are actually range bugs.

### System picker works but does not visually match the Android bottom sheet

- Harmony system dialogs can differ significantly from the existing Android picker UI.
- If visual parity matters more than "native system" appearance, prefer a custom bottom sheet or a custom ArkTS picker component rather than over-tuning the system dialog.

### Pushy or hot-update crashes at startup

- Do not assume the published npm package matches the documentation exactly.
- Inspect the installed `node_modules/react-native-update/harmony` contents before wiring ArkTS imports.
- If runtime reports `cannot find record '&pushy/...&<version>'`, treat it as a Harmony module packaging problem first, not a JS problem.
- Register `pushy` as a standalone module in `harmony/build-profile.json5`, not just as an `oh-package.json5` dependency.
- Mount `reactNativeUpdatePlugin()` in `harmony/entry/hvigorfile.ts`; attaching it only at project-level `harmony/hvigorfile.ts` is not enough for the `entry` module build.
- Keep `pushy` in `harmony/hvigor/hvigor-config.json5` as a `file:` dependency so hvigor can resolve the module plugin and source package consistently.
- If the Harmony package contents do not match the docs, disable hot update on Harmony first and keep the app bootable.

## Harmony-first degradation policy

For first rollout, it is acceptable to leave Harmony implementations empty for:

- vendor analytics SDKs
- vendor business SDKs
- face detection
- hot update

But do not leave them as hard crashes. Return a supported or unsupported capability clearly.

## Validation checklist

Before calling the migration stable, verify:

1. The app starts on emulator in debug mode.
2. Metro connects using host IP.
3. Login page renders and accepts input.
4. Root navigation works.
5. Gesture-heavy pages still receive taps and swipes.
6. Maps, camera, push, and storage flows either work or degrade clearly.
7. Harmony-only native changes do not leak back into the main branch.

## Working style

- Be conservative. Prefer recoverable, incremental fixes.
- Do not rewrite screens first. Stabilize the host and compat layer first.
- Trust official Harmony usage docs and release notes over assumptions.
- When a doc and installed package disagree, inspect local package contents and adjust.
