#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const {
  classifyDependencies,
  detectExpoWeight,
  parseRnVersion,
} = require('./harmony-deps-data');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function collectDeps(pkg) {
  return {
    ...pkg.dependencies,
    ...pkg.devDependencies,
    ...pkg.peerDependencies,
  };
}

function getBaselineAdvice(rnVersion) {
  if (!rnVersion) {
    return {
      summary: '无法从 package.json 解析 RN 版本，先人工确认 RN/RNOH 兼容线。',
      branchAdvice: '建议先建独立 Harmony 分支，再决定是否降级。',
    };
  }

  if (rnVersion.major === 0 && rnVersion.minor === 77) {
    return {
      summary: `当前 RN 为 ${rnVersion.raw}，接近 Harmony 0.77 文档线，可优先在当前代码基线上做鸿蒙分支适配。`,
      branchAdvice: '建议仍创建独立 Harmony 分支，避免宿主工程和依赖改动影响主线。',
    };
  }

  if (rnVersion.major === 0 && rnVersion.minor > 77) {
    return {
      summary: `当前 RN 为 ${rnVersion.raw}，高于常见 Harmony 0.77 文档线，建议在 Harmony 分支降到已验证的 RN/RNOH 基线。`,
      branchAdvice: '主线继续当前 RN，Harmony 分支单独降级并锁版本。',
    };
  }

  return {
    summary: `当前 RN 为 ${rnVersion.raw}，不在本 skill 的常见 Harmony 0.77 基线范围内，先核对官方兼容文档。`,
    branchAdvice: '建议新建独立 Harmony 分支，避免直接改动现有主线。',
  };
}

function printList(items, formatter = item => item) {
  if (!items.length) {
    console.log('- 无');
    return;
  }
  for (const item of items) {
    console.log(`- ${formatter(item)}`);
  }
}

function main() {
  const input = process.argv[2] || 'package.json';
  const pkgPath = path.resolve(process.cwd(), input);

  if (!fs.existsSync(pkgPath)) {
    console.error(`package.json not found: ${pkgPath}`);
    process.exit(1);
  }

  const pkg = readJson(pkgPath);
  const deps = collectDeps(pkg);
  const depNames = Object.keys(deps);
  const rnVersion = parseRnVersion(deps['react-native']);
  const expoWeight = detectExpoWeight(depNames);
  const {direct, replacement, compat, degrade, unknownNativeLike} =
    classifyDependencies(depNames);
  const baseline = getBaselineAdvice(rnVersion);

  console.log(`## HarmonyOS 迁移计划（${pkg.name || '未命名项目'}）`);
  console.log('');
  console.log('### Summary');
  console.log(`- ${baseline.summary}`);
  console.log(`- ${baseline.branchAdvice}`);
  if (expoWeight > 5) {
    console.log(`- 项目含有较多 Expo 相关依赖（${expoWeight} 个），鸿蒙分支建议优先替换原生 Expo 能力，不要直接照搬。`);
  }
  console.log('');

  console.log('### Branch Strategy');
  console.log('- 从当前稳定提交创建独立 Harmony 分支。');
  console.log('- 主线继续 iOS/Android 研发，Harmony 分支单独处理宿主工程、依赖替换和降级。');
  console.log('- 所有鸿蒙原生改动集中在 `harmony/` 和 compat/service 层，不回灌主线原生配置。');
  console.log('');

  console.log('### Dependency Actions');
  console.log('- 可直接接入 Harmony 包：');
  printList(direct, item => `${item.name} -> ${item.target}`);
  console.log('- 需要平替：');
  printList(replacement, item => `${item.name} -> ${item.target}`);
  console.log('- 建议走 compat wrapper：');
  printList(compat);
  console.log('- 建议先降级或留空实现：');
  printList(degrade);
  console.log('- 需要人工核对的原生倾向依赖：');
  printList(unknownNativeLike);
  console.log('');

  console.log('### Host Project Work');
  console.log('- 建立或检查 `harmony/entry/oh-package.json5` 的依赖声明。');
  console.log('- 为 TurboModule 和 native view 同步检查 `PackageProvider.ets`、`PackageProvider.cpp`、`CMakeLists.txt`、`Index.ets`。');
  console.log('- 调试模式优先改 `MetroJSBundleProvider.fromServerIp(<宿主机IP>, 8081)`，不要默认只用 `localhost`。');
  console.log('- 每次改鸿蒙宿主依赖后，运行 `ohpm install`，必要时清理 `.hvigor`、`build`、`.cxx`。');
  console.log('');

  console.log('### Code Structure');
  console.log('- 新增 `src/compat/*` 兼容入口，统一替换高风险 import。');
  console.log('- 新增 `src/platform/services/*` 平台服务门面和能力标记。');
  console.log('- 页面层避免直接依赖高风险原生库，统一走 compat 和 service。');
  console.log('');

  console.log('### Milestones');
  console.log('- M1: 锁定 RN/RNOH 基线，宿主工程可编译安装，Metro 可连接。');
  console.log('- M2: 登录、导航、图标字体、手势和基础页面可用。');
  console.log('- M3: 地图、相机、推送、存储等关键链路打通或明确降级。');
  console.log('- M4: 回归主要业务页面，整理剩余不支持能力和上线边界。');
  console.log('');

  console.log('### Validation');
  console.log('- 调试包可启动且不闪退。');
  console.log('- 首页或登录页可见，可输入，可点击。');
  console.log('- GestureHandlerRootView、生僻 TurboModule、图标字体、TabView、KeyboardController 等高风险点逐项回归。');
  console.log('- 所有先降级的功能有显式兜底，而不是运行时崩溃。');
}

main();
