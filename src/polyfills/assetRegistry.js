let nativeAssetRegistry;
try {
  nativeAssetRegistry = require('react-native/Libraries/Image/AssetRegistry');
} catch (e) {
  nativeAssetRegistry = null;
}

const getAssetFn =
  (nativeAssetRegistry && (nativeAssetRegistry.getAssetByID || nativeAssetRegistry.getAssetById)) ||
  function (id) {
    return id;
  };

const registerAssetFn =
  (nativeAssetRegistry && nativeAssetRegistry.registerAsset) ||
  function (asset) {
    return asset;
  };

const registryObject = {
  registerAsset: registerAssetFn,
  getAssetByID: getAssetFn,
  getAssetById: getAssetFn,
};

module.exports = new Proxy(registryObject, {
  get(target, prop) {
    if (prop in target) {
      return target[prop];
    }
    if (prop === 'default') {
      return registryObject;
    }
    if (prop === 'getAssetById' || prop === 'getAssetByID') {
      return getAssetFn;
    }
    if (prop === 'registerAsset') {
      return registerAssetFn;
    }
    return undefined;
  },
});
