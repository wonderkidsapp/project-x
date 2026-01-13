const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const config = {
    resolver: {
        assetExts: [...getDefaultConfig(__dirname).resolver.assetExts, 'tflite', 'mp3'],
    },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
