const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Resolve react-native subpath export aliases for Expo Metro Bundler
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react-native/unstable-internals-do-not-use') {
    return {
      type: 'sourceFile',
      filePath: path.resolve(
        __dirname,
        'node_modules/react-native/Libraries/Utilities/HMRClient.js'
      ),
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
