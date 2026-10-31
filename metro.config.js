const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Custom Metro resolver for react-native subpath exports
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react-native/asset-registry') {
    return {
      type: 'sourceFile',
      filePath: path.resolve(
        __dirname,
        'node_modules/react-native/Libraries/Image/AssetRegistry.js'
      ),
    };
  }

  if (moduleName === 'react-native/unstable-internals-do-not-use') {
    return {
      type: 'sourceFile',
      filePath: path.resolve(
        __dirname,
        'src/polyfills/reactNativeInternals.js'
      ),
    };
  }

  if (moduleName === 'react-native/setup-env') {
    return {
      type: 'sourceFile',
      filePath: path.resolve(
        __dirname,
        'node_modules/react-native/Libraries/Core/setUpGlobals.js'
      ),
    };
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
