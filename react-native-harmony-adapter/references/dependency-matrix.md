# Dependency Matrix

This file captures common RN-to-Harmony migration decisions seen in real projects. Treat it as a starting point, not a guarantee. Always verify exact package docs and version compatibility before changing code.

## Direct Harmony packages often available

These usually keep the same JS API shape with Harmony-specific native integration:

- `react-native-gesture-handler` -> `@react-native-ohos/react-native-gesture-handler`
- `react-native-reanimated` -> `@react-native-ohos/react-native-reanimated`
- `react-native-safe-area-context` -> `@react-native-ohos/react-native-safe-area-context`
- `react-native-screens` -> `@react-native-ohos/react-native-screens`
- `react-native-pager-view` -> `@react-native-ohos/react-native-pager-view`
- `react-native-webview` -> `@react-native-ohos/react-native-webview`
- `react-native-device-info` -> `@react-native-ohos/react-native-device-info`
- `react-native-document-picker` -> `@react-native-ohos/react-native-document-picker`
- `react-native-haptic-feedback` -> `@react-native-ohos/react-native-haptic-feedback`
- `react-native-image-picker` -> `@react-native-ohos/react-native-image-picker`
- `react-native-share` -> `@react-native-ohos/react-native-share`
- `react-native-mmkv` -> `@react-native-ohos/react-native-mmkv`
- `react-native-permissions` -> `@react-native-ohos/react-native-permissions`
- `react-native-pdf` -> `@react-native-ohos/react-native-pdf`
- `react-native-date-picker` -> `@react-native-ohos/react-native-date-picker`
- `react-native-bootsplash` -> `@react-native-ohos/react-native-bootsplash`
- `react-native-blob-util` -> `@react-native-ohos/react-native-blob-util`
- `react-native-svg` -> `@react-native-ohos/react-native-svg`
- `react-native-view-shot` -> `@react-native-ohos/react-native-view-shot`
- `react-native-vision-camera` -> `@react-native-ohos/react-native-vision-camera`
- `react-native-worklets-core` -> `@react-native-ohos/react-native-worklets-core`
- `@react-native-community/netinfo` -> `@react-native-ohos/netinfo`
- `@react-native-camera-roll/camera-roll` -> `@react-native-ohos/camera-roll`
- `react-native-restart-newarch` -> `@react-native-ohos/react-native-restart`

Notes:

- `react-native-vision-camera` often still needs manual host verification, and Harmony-specific fixes may live in the ArkTS source package rather than pure JS.
- `@react-native-camera-roll/camera-roll` can still fail with a missing TurboModule if the Harmony host project is not fully wired.

## Replacements commonly needed

- `jpush-react-native` -> `@react-native-ohos/jpush-react-native`
- `react-native-amap3d` -> `@react-native-ohos/react-native-amap3d`
- `react-native-amap-geolocation` -> `@react-native-ohos/react-native-amap-geolocation`
- `@expo/vector-icons` -> compat wrapper backed by `react-native-vector-icons`, plus Harmony font registration
- `expo-blur` -> `@react-native-ohos/blur` or a degrade path if API differences are too large
- `@sdcx/pull-to-refresh` -> prefer platform default refresh flow or Harmony package `@react-native-ohos/pull-to-refresh`
- `react-native-tab-view` -> verify the Harmony package and behavior carefully; keep a compat wrapper because tap and swipe behavior may differ
- `expo-linking` and `@react-navigation/*` -> treat as one navigation dependency set, not isolated swaps

## Usually needs compat wrappers

- keyboard controller imports
- vector icons imports
- community-package imports whose Harmony implementation uses a different npm name
- restart imports
- tab view imports
- custom pull-to-refresh imports
- custom Expo modules that have different implementations per platform
- route-based gallery or fullscreen preview flows
- SignalR or websocket setup that needs platform-specific lifecycle handling
- Expo font and vector icon imports
- navigation packages that need Harmony-specific aliasing while preserving the original export shape

Recommended pattern:

- `src/compat/react-native-keyboard-controller.tsx`
- `src/compat/react-native-vector-icons-native.ts`
- `src/compat/netinfo.ts`
- `src/compat/react-native-restart-newarch.ts`
- `src/compat/react-native-tab-view.js`
- `src/compat/sdcx-pull-to-refresh.tsx`
- `src/compat/nandorojo-galeria.tsx`
- `src/platform/services/pickerService.tsx`
- `src/platform/services/signalrService.ts`

## Usually unsupported first, degrade safely

- vendor analytics SDKs
- vendor private business SDKs
- face detector add-ons
- hot update if the published Harmony package shape does not match current docs

Practical examples:

- `react-native-vision-camera-face-detector` -> disable on Harmony first, then revisit after the base camera flow is stable
- camera props or helpers that are iOS or Android specific -> gate behind `Platform.OS !== 'harmony'`

For these, prefer:

- capability flags
- empty Harmony implementation
- explicit unsupported result objects
- page-level fallback UI

## Expo-specific guidance

Expo-heavy projects can still migrate, but native Expo modules must be audited one by one.

- If an Expo capability has a mature Harmony third-party package, replace it.
- If the Expo module is custom and business-specific, keep the JS contract and add a Harmony placeholder implementation.
- Do not try to make unsupported Expo native modules work blindly inside Harmony.
- For picker-style Expo modules, consider a service layer instead of a direct native-module shim. Harmony may need a custom ArkTS dialog bridge, a `react-native-date-picker` fallback, or a custom bottom-sheet implementation depending on whether API parity or UI parity matters more.

## Validation reminders

- Harmony often needs manual native linking even after npm and ohpm install.
- A package being present in `package.json` does not mean it is registered on the ArkTS or C++ side.
- TurboModule or native view failures usually mean the host project is incompletely wired.
