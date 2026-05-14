const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

module.exports = async () => {
  const defaultConfig = await getDefaultConfig(__dirname);

  return {
    ...defaultConfig,
    resolver: {
      ...defaultConfig.resolver,
      assetExts: [...defaultConfig.resolver.assetExts, 'onnx', 'tflite', 'wasm'],
      sourceExts: defaultConfig.resolver.sourceExts.filter(ext => ext !== 'wasm'),
      extraNodeModules: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server: {
      ...defaultConfig.server,
      enhanceMiddleware: middleware => {
        return (req, res, next) => {
          if (req.url.endsWith('.wasm')) {
            res.setHeader('Content-Type', 'application/wasm');
          }
          return middleware(req, res, next);
        };
      },
    },
    watchFolders: [path.resolve(__dirname)],
  };
};
