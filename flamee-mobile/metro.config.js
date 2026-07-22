const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts = [...config.resolver.assetExts, 'riv'];

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'paths-js/pie': path.resolve(__dirname, 'node_modules/paths-js/pie.js'),
};

module.exports = withNativeWind(config, { input: './styles/global.css' });
