# Vector Icons and Fonts on Harmony

Use this reference when icons render as white boxes, glyphs disappear, `ExpoFontLoader` is missing, or `@expo/vector-icons` works on Android/iOS but not on Harmony.

For related migration steps, also read:

- `expo-projects.md` for Expo-heavy branch strategy
- `compat-import-map.md` for the wrapper path to use in JS
- `manual-linking-checklist.md` if the host project still looks miswired

## Core rule

On Harmony, treat icon rendering as a host-registered font problem first, not as a JSX problem.

In Expo apps, the usual failure mode is:

1. business code imports `@expo/vector-icons`
2. Expo font runtime is not actually available on Harmony
3. the icon component renders, but the required font family is never registered
4. the UI shows white boxes, empty glyphs, or missing icons

## Recommended pattern

### JS side

- Keep business screens importing a project wrapper such as `src/compat/expo-vector-icons`.
- Back that wrapper with `react-native-vector-icons` on Harmony.
- Avoid direct Harmony-only import paths in page code.

Typical wrapper direction:

- `@expo/vector-icons` -> `src/compat/expo-vector-icons`
- Harmony implementation inside the wrapper -> `react-native-vector-icons/*`

This keeps iOS and Android unchanged while letting Harmony bypass Expo font loading.

### Host side

- Copy the required `.ttf` files into `harmony/entry/src/main/resources/rawfile/fonts/`.
- Register every used font family in `harmony/entry/src/main/ets/pages/Index.ets`.
- Ensure the registered family name matches the runtime family name expected by the icon package.

Real examples from migrations:

- `AntDesign` often needs family name `anticon`
- `MaterialIcons` often needs family name `Material Icons`
- `Ionicons`, `Feather`, `Entypo`, and `FontAwesome` usually use direct family names

If the file exists but the family name is wrong, the icon still renders incorrectly.

## Distinguish the two font systems

### Expo font runtime

Symptoms:

- `Cannot find native module 'ExpoFontLoader'`
- `FontAwesome` or another icon export becomes undefined
- `EXNativeModulesProxy` or Expo native-module warnings appear early in startup

Meaning:

- Harmony is still trying to boot through Expo native font plumbing that the host project is not providing

Preferred fix:

- stop relying on Expo font loading for icon fonts on Harmony
- route icon usage through a compat wrapper
- register fonts on the Harmony host instead

### Host-registered fonts

Symptoms:

- icons render as white squares
- some icon sets work while others do not
- text looks fine but icon glyphs are missing

Meaning:

- the font file or family mapping is incomplete on the Harmony host

Preferred fix:

- verify raw font resources
- verify `registerFont(...)` calls
- verify family names line up with the wrapped icon library

## Common symptom mapping

### White square instead of back icon

Typical example:

- `<Ionicons name=\"chevron-back\" ... />` renders as a white square

What to check:

1. `Ionicons.ttf` exists under `rawfile/fonts`
2. `Index.ets` registers `Ionicons`
3. the screen imports the compat wrapper instead of direct `@expo/vector-icons`

### `ExpoFontLoader` missing

What it usually means:

- the Harmony branch still pulls in Expo font-native behavior

What to do:

1. alias `expo-font` to a compat implementation if the app still imports it
2. remove Harmony dependence on Expo font-native loading for icons
3. use host-registered fonts for vector icons

### `FontAwesome` of undefined

What it usually means:

- the import shape is wrong after package swapping, or the Expo vector-icons module is no longer valid on Harmony

What to do:

1. verify the wrapper exports the same names the app expects
2. verify Metro and TS path aliases point to the wrapper
3. verify the Harmony wrapper resolves `react-native-vector-icons/*` correctly

## Practical audit checklist

1. Search for direct imports from `@expo/vector-icons`.
2. Replace them with the project wrapper path.
3. Search for `expo-font` imports that are only there to support icons.
4. Copy the needed `.ttf` files into `harmony/entry/src/main/resources/rawfile/fonts/`.
5. Register each font in `harmony/entry/src/main/ets/pages/Index.ets`.
6. Verify family names, not just file names.
7. Rebuild the Harmony app after host changes.

## Good migration posture

- Keep the JS icon API stable.
- Move the platform difference into the wrapper and the host font registration.
- Do not patch icon usage one screen at a time if the real problem is missing host registration.
- When only Harmony is affected, suspect font registration before suspecting business logic.
