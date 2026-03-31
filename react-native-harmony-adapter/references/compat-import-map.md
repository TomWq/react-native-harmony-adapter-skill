# Compat Import Map

Use this reference when moving page code away from direct native imports and into a project-level compatibility layer.

## Recommended wrapper targets

- `@expo/vector-icons` -> `src/compat/expo-vector-icons`
- `expo-font` -> project compat layer when Harmony must bypass Expo native font loading
- `@react-native-community/netinfo` -> `src/compat/netinfo`
- `react-native-keyboard-controller` -> `src/compat/react-native-keyboard-controller`
- `react-native-restart-newarch` -> `src/compat/react-native-restart-newarch`
- `react-native-tab-view` -> `src/compat/react-native-tab-view`
- `@sdcx/pull-to-refresh` -> `src/compat/sdcx-pull-to-refresh`
- `react-native-vector-icons` -> `src/compat/react-native-vector-icons-native`
- `expo-linking` -> `src/compat/expo-linking`
- `@react-navigation/elements` -> `src/compat/react-navigation-elements`
- `@react-navigation/native-stack` -> project compat stack wrapper when Harmony stack behavior diverges
- `react-native-unistyles` -> `src/compat/react-native-unistyles`
- `@nandorojo/galeria` -> `src/compat/nandorojo-galeria`
- `@microsoft/signalr` connection setup -> `src/platform/services/signalrService`
- picker-style Expo modules such as `expo-picker` -> `src/platform/services/pickerService`

## Why wrappers help

- Harmony may need a different backing package than iOS or Android.
- Some packages need behavior adjustments instead of a simple package rename.
- Wrappers reduce business-layer churn and make rollback easier.
- Some Harmony packages use a different npm name than the original community package, so wrappers avoid leaking those naming differences into screen code.
- Some migrations are not just package swaps. For example picker flows, galleries, and SignalR often need platform-specific behavior and lifecycle handling.

## Suggested migration sequence

1. Create the wrapper first.
2. Scan the project for direct imports.
3. Replace imports in the listed files gradually.
4. Keep wrapper paths stable so the rest of the codebase does not need to know the platform details.

## Review questions

- Does a page still import a risky package directly?
- Are the same replacements repeated in many screens?
- Does the wrapper preserve enough of the old API to avoid large rewrites?
- If the wrapper is for icons or navigation, did you update both Metro aliases and TS path aliases?
