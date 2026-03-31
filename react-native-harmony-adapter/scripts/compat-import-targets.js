'use strict';

const TARGETS = {
  '@expo/vector-icons': 'src/compat/expo-vector-icons',
  'react-native-keyboard-controller': 'src/compat/react-native-keyboard-controller',
  'react-native-restart-newarch': 'src/compat/react-native-restart-newarch',
  'react-native-tab-view': 'src/compat/react-native-tab-view',
  '@sdcx/pull-to-refresh': 'src/compat/sdcx-pull-to-refresh',
  'react-native-vector-icons': 'src/compat/react-native-vector-icons-native',
};

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildStatementMatchers(specifier) {
  const escaped = escapeRegExp(specifier);
  return [
    new RegExp(`import\\s+[^;]*?from\\s+['"]${escaped}['"]`, 'g'),
    new RegExp(`import\\s*\\(\\s*['"]${escaped}['"]\\s*\\)`, 'g'),
    new RegExp(`require\\(\\s*['"]${escaped}['"]\\s*\\)`, 'g'),
    new RegExp(`export\\s+[^;]*?from\\s+['"]${escaped}['"]`, 'g'),
  ];
}

function buildLineMatcher(specifier) {
  const escaped = escapeRegExp(specifier);
  return new RegExp(
    `(?:import\\s+.*?from\\s+|export\\s+.*?from\\s+|require\\(|import\\()\\s*['"]${escaped}['"]`,
  );
}

module.exports = {
  TARGETS,
  buildStatementMatchers,
  buildLineMatcher,
};
