import { loadTensorflowModel, TensorflowModel } from 'react-native-fast-tflite';
import { Asset } from 'expo-asset';

export class DepthEstimator {
    private model: TensorflowModel | null = null;
    private isLoaded = false;

    public async load(): Promise<boolean> {
        try {
            console.log('DepthEstimator: Start Loading...');
            const modelModule = require('../models/midas_small.tflite');
            const asset = Asset.fromModule(modelModule);

            if (!asset.localUri) {
                await asset.downloadAsync();
            }

            const uri = asset.localUri || asset.uri;
            if (!uri) throw new Error('MiDaS Asset URI is null');

            console.log(`DepthEstimator: Loading from ${uri}`);
            this.model = await loadTensorflowModel(uri);
            this.isLoaded = true;
            console.log('DepthEstimator: MiDaS Loaded Successfully');
            return true;
        } catch (error) {
            console.error('DepthEstimator Load Fatal:', error);
            return false;
        }
    }

    public getStatus(): boolean {
        return this.isLoaded && this.model !== null;
    }

    public estimateDistance(bbox: any, frame: any): number {
        return 2.5;
    }
}
