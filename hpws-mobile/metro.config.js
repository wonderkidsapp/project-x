const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const config = {
    resolver: {
        assetExts: [...getDefaultConfig(__dirname).resolver.assetExts, 'tflite', 'mp3'],
    },
    transformer: {
        assetPlugins: ['expo-asset/tools/hashAssetFiles'],
    },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
