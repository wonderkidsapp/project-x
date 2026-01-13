import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Camera, useCameraDevice, useFrameProcessor, runAtTargetFps, useCameraFormat } from 'react-native-vision-camera';
import { Worklets } from 'react-native-worklets-core';
import { ObjectDetector, DetectionResult } from '../engine/ObjectDetector';
import { DepthEstimator } from '../engine/DepthEstimator';
import { AttentionRiskEngine } from '../engine/AttentionRiskEngine';
import { AudioInterface } from '../engine/AudioInterface';

// Initialize engines (singleton-like for this scope)
const objectDetector = new ObjectDetector();
const depthEstimator = new DepthEstimator();
const attentionEngine = new AttentionRiskEngine();
const audioInterface = new AudioInterface();

interface Props {
    isActive: boolean;
}

export const CameraView = ({ isActive }: Props) => {
    const device = useCameraDevice('back');
    // Select a format that supports Depth Capture (LiDAR)
    const format = device ? useCameraFormat(device, [
        { videoResolution: { width: 1280, height: 720 } },
        { fps: 30 }
    ]) : undefined;

    const [hasPermission, setHasPermission] = useState(false);

    useEffect(() => {
        (async () => {
            const status = await Camera.requestCameraPermission();
            setHasPermission(status === 'granted');

            // Load models
            await objectDetector.load();
            await depthEstimator.load();
        })();
    }, []);

    // Frame Processor
    const frameProcessor = useFrameProcessor((frame) => {
        'worklet';
        runAtTargetFps(5, () => {
            'worklet';
            console.log("Frame captured");
        });
    }, []);

    const processRisk = (detections: DetectionResult[]) => {
        // Logic runs on JS thread
        // Need to get IMU data etc here

        const state = {
            detections: detections.map(d => ({
                class: d.class,
                bbox: d.bbox,
                confidence: d.confidence,
                distance: 2.0 // Placeholder distance until depth map integration is fully native
            })),
            userVelocity: 0, // Mock IMU
            ambientNoise: 0, // Mock Mic
            timeOfDay: 'day' as const
        };

        const risk = attentionEngine.computeAttentionRisk(state);
        audioInterface.playFeedback(risk);
    };

    if (!hasPermission) return <View style={styles.container}><Text>No Camera Permission</Text></View>;
    if (!device) return <View style={styles.container}><Text>No Camera Device</Text></View>;

    return (
        <View style={styles.container}>
            <Camera
                style={StyleSheet.absoluteFill}
                device={device}
                format={format}
                isActive={isActive}
                frameProcessor={frameProcessor}
                pixelFormat="yuv"
                enableDepthData={true} // Re-enable for iPhone 12 Pro LiDAR
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
