import { loadTensorflowModel, TensorflowModel } from 'react-native-fast-tflite';
import { Asset } from 'expo-asset';

export class ObjectDetector {
    private model: TensorflowModel | null = null;
    private isLoaded = false;

    public async load(): Promise<boolean> {
        try {
            console.log('ObjectDetector: Start Loading...');
            const modelModule = require('../models/yolo11.tflite');
            const asset = Asset.fromModule(modelModule);

            // Ensure asset is on disk
            if (!asset.localUri) {
                await asset.downloadAsync();
            }

            const uri = asset.localUri || asset.uri;
            if (!uri) throw new Error('YOLO Asset URI is null');

            console.log(`ObjectDetector: Loading from ${uri}`);
            this.model = await loadTensorflowModel(uri);
            this.isLoaded = true;
            console.log('ObjectDetector: YOLOv11 Loaded Successfully');
            return true;
        } catch (error) {
            console.error('ObjectDetector Load Fatal:', error);
            return false;
        }
    }

    public getStatus(): boolean {
        return this.isLoaded && this.model !== null;
    }

    public detect(frame: any): any[] {
        if (!this.isLoaded || !this.model) return [];
        return [];
    }
}
