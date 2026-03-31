# Host Project Template

Use these snippets as a checklist and starting point when wiring Harmony host files. Do not paste blindly. Replace package names, class names, and targets with the exact values from the selected Harmony library docs.

## `harmony/entry/oh-package.json5`

Add the Harmony package dependency:

```json5
{
  "dependencies": {
    "@react-native-ohos/react-native-device-info": "file:../../node_modules/@react-native-ohos/react-native-device-info/harmony/device_info.har"
  }
}
```

Rules:

- Use the exact package path from the installed package or official docs.
- Prefer `file:` dependencies for local `node_modules` integration.
- Re-run `ohpm install` after changing this file.

## `harmony/build-profile.json5`

When a library ships as a Harmony source module instead of only a HAR, register it in the app module list:

```json5
{
  modules: [
    {
      name: "entry",
      srcPath: "./entry",
    },
    {
      name: "pushy",
      srcPath: "../node_modules/react-native-update/harmony/pushy",
    },
  ],
}
```

Rules:

- This is especially important for modules like Pushy that expose ArkTS sources consumed at runtime.
- If runtime crashes with `cannot find record '&pushy/...&<version>'`, check this file before touching JS.

## `harmony/entry/hvigorfile.ts`

Some Harmony source modules need their hvigor plugin attached at the `entry` module level:

```ts
import {hapTasks} from '@ohos/hvigor-ohos-plugin';
import {reactNativeUpdatePlugin} from 'pushy/hvigor-plugin';

export default {
  system: hapTasks,
  plugins: [reactNativeUpdatePlugin()],
};
```

Rules:

- For Pushy, attaching the plugin only in project-level `harmony/hvigorfile.ts` is insufficient.
- Keep the package resolvable through `harmony/hvigor/hvigor-config.json5`.

## `harmony/entry/src/main/ets/PackageProvider.ets`

Import the ArkTS package and include it in `getRNPackages`:

```ts
import {RNDeviceInfoPackage} from '@react-native-ohos/react-native-device-info/ts';

export function getRNPackages(ctx: RNPackageContext): RNPackage[] {
  return [
    new RNDeviceInfoPackage(ctx),
  ];
}
```

Rules:

- The import path may be `/ts`, the package root, or another export path depending on the library.
- Verify the installed package exports before adding the import.

## `harmony/entry/src/main/cpp/PackageProvider.cpp`

Wire native package registration when the library requires C++ linkage:

```cpp
#include "DeviceInfoPackage.h"

std::vector<std::shared_ptr<Package>> PackageProvider::getPackages(
    Package::Context ctx) {
  return {
      std::make_shared<DeviceInfoPackage>(ctx),
  };
}
```

Rules:

- Header names differ by package.
- Some libraries only need ArkTS registration, while others need both ArkTS and C++ wiring.

## `harmony/entry/src/main/cpp/CMakeLists.txt`

Add native module source and link target:

```cmake
add_subdirectory("${OH_MODULES_DIR}/@react-native-ohos/react-native-device-info/src/main/cpp" ./device-info)

target_link_libraries(rnoh_app PUBLIC
  device_info
)
```

Rules:

- The folder alias and final target name vary by package.
- Always inspect the package's `src/main/cpp/CMakeLists.txt` if the target name is unclear.

## `harmony/entry/src/main/ets/pages/Index.ets`

Use this file for:

- ArkTS-side native view registration
- vector icon font registration
- Metro host IP selection for debug mode

Typical patterns:

```ts
rnInstance.registerFont('Ionicons', $rawfile('fonts/Ionicons.ttf'));
```

```ts
MetroJSBundleProvider.fromServerIp('<host-ip>', 8081)
```

```ts
if (ctx.componentName === WEB_VIEW) {
  WebView({
    ctx: ctx.rnComponentContext,
    tag: ctx.tag,
  });
}
```

Rules:

- `localhost` is usually wrong for emulator-to-host Metro.
- Fonts must exist in Harmony raw resources.
- Native views often need explicit registration here even if the TurboModule side is already linked.

## After any host project change

1. Run `ohpm install` in `harmony/`.
2. Run `ohpm install` in `harmony/entry/`.
3. If an old package still appears at runtime, clear stale artifacts:
   - `harmony/.hvigor`
   - `harmony/entry/build`
   - `harmony/entry/.cxx`
4. Rebuild and reinstall the app.
