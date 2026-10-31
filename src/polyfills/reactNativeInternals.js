let DevLoadingViewModule;
try {
  DevLoadingViewModule = require('react-native/Libraries/Utilities/DevLoadingView');
} catch (e) {
  DevLoadingViewModule = null;
}

const DevLoadingView =
  (DevLoadingViewModule && DevLoadingViewModule.default) ||
  DevLoadingViewModule || {
    showMessage: () => {},
    hide: () => {},
  };

module.exports = {
  DevLoadingView,
  NativeRedBox: {
    dismiss: () => {},
  },
  HMRClient: require('react-native/Libraries/Utilities/HMRClient'),
};
