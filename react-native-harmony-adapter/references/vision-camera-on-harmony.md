# Vision Camera on Harmony

Read this file when Harmony camera behavior is wrong even though the basic package swap looks correct.

## Contents

1. Known-good baseline
2. Symptoms to classify first
3. Host wiring checks
4. JS-side adaptation rules
5. Native/session issues seen in real projects
6. CameraRoll save failures
7. Patch persistence in Bun projects

## Known-good baseline

- JS package: `react-native-vision-camera`
- Harmony package: `@react-native-ohos/react-native-vision-camera`
- Camera-roll package: `@react-native-ohos/camera-roll`
- Permission flow: prefer VisionCamera's official hooks and methods such as `useCameraPermission()` and `requestPermission()`
- First-pass degrade: disable `react-native-vision-camera-face-detector` on Harmony until the base camera flow is stable

Do not mix "community package import path" and "Harmony native package registration" assumptions. The host project must still link the Harmony package correctly.

## Symptoms to classify first

Separate these cases before editing business screens:

- Preview is blank from the start
- Preview appears, but `takePhoto()` returns `null`
- Preview appears, photo path exists, but preview image does not render in JS
- Runtime logs `photoSession null`
- Native logs show `7400101`
- Native logs show `7400201` with `Camera service fatal error`
- Saved-to-gallery flow fails with `RNCCameraRoll` TurboModule missing

These symptoms map to different layers. Do not treat them as one generic "camera broken" issue.

## Host wiring checks

Check the normal Harmony host files first:

- `harmony/entry/oh-package.json5`
- `harmony/build-profile.json5`
- `harmony/entry/src/main/ets/PackageProvider.ets`
- `harmony/entry/src/main/cpp/PackageProvider.cpp`
- `harmony/entry/src/main/cpp/CMakeLists.txt`
- `harmony/entry/src/main/ets/pages/Index.ets`

For VisionCamera specifically:

- If you need to patch ArkTS source files, point the dependency to the source package such as `file:../../node_modules/@react-native-ohos/react-native-vision-camera/harmony/vision_camera` instead of relying only on a prebuilt HAR.
- If runtime still behaves like the old package after editing `node_modules`, inspect the generated copy under `harmony/entry/oh_modules/...`. A stale generated module can make it look like your patch "did nothing".
- If a TurboModule is missing, verify both ArkTS registration and C++ registration. Do not stop after `oh-package.json5`.

## JS-side adaptation rules

- Use the official permission hooks from VisionCamera on Harmony before layering custom permission state on top.
- Do not assume iOS or Android-only props are safe on Harmony. Conditionally degrade options such as `photoHdr`, some rotation helpers, and face-detector add-ons.
- If you animate the camera component, confirm the exported camera view is a valid React component on Harmony before wrapping it with `Animated.createAnimatedComponent`.
- If `takePhoto()` returns a local file path and the image still does not render, normalize the preview URI to `file://...` before passing it into React Native image components.

## Native/session issues seen in real projects

### Preview visible, but `takePhoto()` returns `null`

This is commonly a session readiness problem, not a button-handler problem.

Check these first:

- Whether preview is already visible
- Whether `photoSession null` appears in native logs
- Whether the surface ID changed after the first init
- Whether the package re-initializes the camera session more than once for the same surface

If preview is visible but capture returns `null`, treat the current surface/session lifecycle as the main suspect.

### `photoSession null, please check camera permission`

Do not assume the message means permission is truly missing.

In Harmony migrations this can also mean:

- permission was requested too late relative to session init
- session init ran before the preview surface was ready
- the session was released and not rebuilt for the current surface
- duplicate init paths left the active session in an inconsistent state

Verify permissions, but if preview already opens, focus quickly on session timing and XComponent lifecycle.

### `7400101`

Treat this as a bad-argument or bad-profile clue first.

Real causes include:

- preview ratio chosen from a hardcoded default that does not match the actual display or surface
- preview profile selection that is too strict and fails to fall back
- resize logic using a stale width or height during init

Preferred fix direction:

- derive target ratio from the actual display or surface ratio
- add a safe preview-profile fallback instead of requiring an exact ratio match
- retry init once the surface and size are stable

### `7400201` with `Camera service fatal error`

If preview is already live and capture works, this may be a duplicate-init side effect rather than the root failure.

Check for:

- `onLoad` firing again after the session is already initialized
- the same surface being reinitialized without a guard
- session init running in both page lifecycle code and component surface lifecycle code

Preferred fix direction:

- guard against repeated init on the same surface
- track whether initialization is already in progress
- suppress or downgrade secondary `7400201` noise only after confirming preview and capture are functional

Do not silence the error first and assume the problem is solved.

### Preview area is too small or heavily letterboxed

Do not focus only on page CSS.

On Harmony this often comes from native preview math:

- target ratio selection
- preview profile selection
- resize-mode implementation
- cover versus contain behavior inside the XComponent surface

If the page container is full-screen but the live camera feed still sits in a smaller 4:3 rectangle, inspect the native package, not only the screen layout.

## CameraRoll save failures

If runtime reports `RNCCameraRoll` missing or `Couldn't find Turbo Module on the ArkTs side`, treat it as a host-linking problem first.

Checklist:

- install `@react-native-ohos/camera-roll`
- wire the package in the Harmony host project
- verify the TurboModule is registered on both ArkTS and C++ sides if required by the package structure
- keep a graceful fallback message until save-to-gallery is actually linked

Do not assume the JS API is enough just because `expo-media-library` or another save flow works on other platforms.

## Patch persistence in Bun projects

If you patch `node_modules/@react-native-ohos/react-native-vision-camera/...` directly, those changes are not durable by default.

For Bun-based projects:

- existing patches can still be applied by `patch-package` during `postinstall`
- creating a new patch with `npx patch-package <pkg>` may fail if the repo has `bun.lock` but no `yarn.lock` or `package-lock.json`

Reliable fallback:

1. Download a clean snapshot with `npm pack <pkg>@<version>`.
2. Diff the clean package against the patched installed package.
3. Save the result as `patches/@scope+pkg+<version>.patch`.

Use this approach when Harmony ETS fixes must survive `bun install`.
