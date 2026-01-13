import { loadTensorflowModel, TensorflowModel } from 'react-native-fast-tflite';
import { Asset } from 'expo-asset';

export class DepthEstimator {
    private model: TensorflowModel | null = null;
    private isLoaded = false;

    public async load(): Promise<void> {
        try {
            console.log('DepthEstimator: Loading MiDaS...');
            const modelAsset = require('../models/midas_small.tflite');
            const asset = await Asset.fromModule(modelAsset).downloadAsync();
            if (!asset.localUri) throw new Error('Failed to download MiDaS model asset');

            this.model = await loadTensorflowModel(asset.localUri);
            this.isLoaded = true;
            console.log('DepthEstimator: MiDaS Ready');
        } catch (error) {
            console.error('DepthEstimator Load Error:', error);
            throw error;
        }
    }

    public estimateDistance(bbox: [number, number, number, number], frame: any): number {
        return 2.5;
    }
}
