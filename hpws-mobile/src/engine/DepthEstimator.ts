import { TensorflowModel } from 'react-native-fast-tflite';

export class DepthEstimator {
    private model: TensorflowModel | null = null;

    public async load(): Promise<void> {
        console.log('DepthEstimator: Mock Mode Active');
        return Promise.resolve();
    }

    public estimateDistance(bbox: [number, number, number, number], frame: any): number {
        // Return a fixed safety distance
        return 2.5;
    }
}
