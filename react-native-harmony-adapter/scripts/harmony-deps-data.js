'use strict';

const DIRECT = {
  'react-native-gesture-handler': '@react-native-ohos/react-native-gesture-handler',
  'react-native-reanimated': '@react-native-ohos/react-native-reanimated',
  'react-native-safe-area-context': '@react-native-ohos/react-native-safe-area-context',
  'react-native-screens': '@react-native-ohos/react-native-screens',
  'react-native-pager-view': '@react-native-ohos/react-native-pager-view',
  'react-native-webview': '@react-native-ohos/react-native-webview',
  'react-native-device-info': '@react-native-ohos/react-native-device-info',
  'react-native-document-picker': '@react-native-ohos/react-native-document-picker',
  'react-native-haptic-feedback': '@react-native-ohos/react-native-haptic-feedback',
  'react-native-image-picker': '@react-native-ohos/react-native-image-picker',
  'react-native-share': '@react-native-ohos/react-native-share',
  'react-native-mmkv': '@react-native-ohos/react-native-mmkv',
  'react-native-permissions': '@react-native-ohos/react-native-permissions',
  'react-native-pdf': '@react-native-ohos/react-native-pdf',
  'react-native-date-picker': '@react-native-ohos/react-native-date-picker',
  'react-native-bootsplash': '@react-native-ohos/react-native-bootsplash',
  'react-native-blob-util': '@react-native-ohos/react-native-blob-util',
  'react-native-svg': '@react-native-ohos/react-native-svg',
  'react-native-view-shot': '@react-native-ohos/react-native-view-shot',
  'react-native-vision-camera': '@react-native-ohos/react-native-vision-camera',
  'react-native-worklets-core': '@react-native-ohos/react-native-worklets-core',
  '@react-native-community/netinfo': '@react-native-ohos/netinfo',
  '@react-native-camera-roll/camera-roll': '@react-native-ohos/camera-roll',
  'react-native-restart-newarch': '@react-native-ohos/react-native-restart',
};

const REPLACEMENT = {
  'jpush-react-native': '@react-native-ohos/jpush-react-native',
  'react-native-amap3d': '@react-native-ohos/react-native-amap3d',
  'react-native-amap-geolocation': '@react-native-ohos/react-native-amap-geolocation',
  '@expo/vector-icons': 'compat wrapper + react-native-vector-icons + font registration',
  'expo-blur': '@react-native-ohos/blur or degrade path',
  '@sdcx/pull-to-refresh': '@react-native-ohos/pull-to-refresh or platform default refresh',
};

const COMPAT = new Set([
  'react-native-tab-view',
  'react-native-keyboard-controller',
  'react-native-vector-icons',
  'expo-picker',
  'expo-picture-select',
  'expo-app-exit',
]);

const DEGRADE = new Set([
  'react-native-update',
  'react-native-vision-camera-face-detector',
  'expo-yk-sdk',
  'expo-umeng',
]);

function classifyDependencies(depNames) {
  const direct = [];
  const replacement = [];
  const compat = [];
  const degrade = [];
  const unknownNativeLike = [];

  for (const name of depNames.sort()) {
    if (DIRECT[name]) {
      direct.push({name, target: DIRECT[name]});
      continue;
    }
    if (REPLACEMENT[name]) {
      replacement.push({name, target: REPLACEMENT[name]});
      continue;
    }
    if (COMPAT.has(name)) {
      compat.push(name);
      continue;
    }
    if (DEGRADE.has(name)) {
      degrade.push(name);
      continue;
    }

    const nativeLike =
      name.startsWith('react-native-') ||
      name.startsWith('@react-native/') ||
      name.startsWith('@react-native-community/') ||
      name.startsWith('@expo/') ||
      name.startsWith('expo-');

    if (nativeLike) {
      unknownNativeLike.push(name);
    }
  }

  return {direct, replacement, compat, degrade, unknownNativeLike};
}

function detectExpoWeight(depNames) {
  return depNames.filter(name => name === 'expo' || name.startsWith('expo-') || name.startsWith('@expo/')).length;
}

function parseRnVersion(version) {
  if (!version) return null;
  const match = String(version).match(/(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;
  return {
    raw: String(version),
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

module.exports = {
  DIRECT,
  REPLACEMENT,
  COMPAT,
  DEGRADE,
  classifyDependencies,
  detectExpoWeight,
  parseRnVersion,
};
