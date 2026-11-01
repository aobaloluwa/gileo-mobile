const assetRegistry = require('./assetRegistry');

let realReactNative;
try {
  realReactNative = require('react-native');
} catch (e) {
  realReactNative = {};
}

let resolvedRN = realReactNative;
if (realReactNative && realReactNative.__esModule && realReactNative.default) {
  resolvedRN = realReactNative.default;
}

module.exports = new Proxy({}, {
  get(target, prop) {
    if (prop === 'AssetRegistry') {
      return (resolvedRN && resolvedRN.AssetRegistry) || assetRegistry;
    }
    if (resolvedRN && prop in resolvedRN) {
      return resolvedRN[prop];
    }
    return undefined;
  },
  has(target, prop) {
    if (prop === 'AssetRegistry') {
      return true;
    }
    return resolvedRN && prop in resolvedRN;
  },
  ownKeys(target) {
    const keys = resolvedRN ? Reflect.ownKeys(resolvedRN) : [];
    if (!keys.includes('AssetRegistry')) {
      keys.push('AssetRegistry');
    }
    return keys;
  },
  getOwnPropertyDescriptor(target, prop) {
    if (prop === 'AssetRegistry') {
      return {
        configurable: true,
        enumerable: true,
        value: (resolvedRN && resolvedRN.AssetRegistry) || assetRegistry,
      };
    }
    return resolvedRN ? Reflect.getOwnPropertyDescriptor(resolvedRN, prop) : undefined;
  }
});
