// Learn more https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// zustand's ESM build uses `import.meta`, which breaks the (non-module) web bundle.
// Resolve zustand through its CommonJS entry points instead.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'zustand' || moduleName.startsWith('zustand/')) {
    return context.resolveRequest(
      { ...context, unstable_conditionNames: ['require', 'react-native', 'default'] },
      moduleName,
      platform,
    );
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
