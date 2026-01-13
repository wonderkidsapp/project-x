import { loadTensorflowModel, TensorflowModel } from 'react-native-fast-tflite';
import { Asset } from 'expo-asset';

// Full COCO Labels for YOLOv11
const COCO_LABELS: Record<number, string> = {
    0: 'person', 1: 'bicycle', 2: 'car', 3: 'motorcycle', 4: 'airplane', 5: 'bus', 6: 'train', 7: 'truck',
    8: 'boat', 9: 'traffic light', 10: 'fire hydrant', 11: 'stop sign', 12: 'parking meter', 13: 'bench',
    14: 'bird', 15: 'cat', 16: 'dog', 17: 'horse', 18: 'sheep', 19: 'cow', 20: 'elephant', 21: 'bear',
    22: 'zebra', 23: 'giraffe', 24: 'backpack', 25: 'umbrella', 26: 'handbag', 27: 'tie', 28: 'suitcase',
    29: 'frisbee', 30: 'skis', 31: 'snowboard', 32: 'sports ball', 33: 'kite', 34: 'baseball bat',
    35: 'baseball glove', 36: 'skateboard', 37: 'surfboard', 38: 'tennis racket', 39: 'bottle',
    40: 'wine glass', 41: 'cup', 42: 'fork', 43: 'knife', 44: 'spoon', 45: 'bowl', 46: 'banana',
    47: 'apple', 48: 'sandwich', 49: 'orange', 50: 'broccoli', 51: 'carrot', 52: 'hot dog', 53: 'pizza',
    54: 'donut', 55: 'cake', 56: 'chair', 57: 'couch', 58: 'potted plant', 59: 'bed', 60: 'dining table',
    61: 'toilet', 62: 'tv', 63: 'laptop', 64: 'mouse', 65: 'remote', 66: 'keyboard', 67: 'cell phone',
    68: 'microwave', 69: 'oven', 70: 'toaster', 71: 'sink', 72: 'refrigerator', 73: 'book', 74: 'clock',
    75: 'vase', 76: 'scissors', 77: 'teddy bear', 78: 'hair drier', 79: 'toothbrush'
};

export interface DetectionResult {
    class: string;
    confidence: number;
    bbox: [number, number, number, number]; // [x, y, width, height]
}

export class ObjectDetector {
    private model: TensorflowModel | null = null;
    private isLoaded = false;

    public async load(): Promise<void> {
        try {
            console.log('ObjectDetector: Loading YOLOv11...');
            const modelAsset = require('../models/yolo11.tflite');
            const asset = await Asset.fromModule(modelAsset).downloadAsync();
            if (!asset.localUri) throw new Error('Failed to download YOLO model asset');

            this.model = await loadTensorflowModel(asset.localUri);
            this.isLoaded = true;
            console.log('ObjectDetector: YOLOv11 Ready');
        } catch (error) {
            console.error('ObjectDetector Load Error:', error);
            throw error;
        }
    }

    public detect(frame: any): DetectionResult[] {
        if (!this.isLoaded || !this.model) return [];
        // Actual detection logic will be re-enabled after system stability is confirmed
        return [];
    }
}
