import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Camera, useCameraDevice, useFrameProcessor, runAtTargetFps, useCameraFormat } from 'react-native-vision-camera';
import { Worklets } from 'react-native-worklets-core';
import { ObjectDetector, DetectionResult } from '../engine/ObjectDetector';
import { DepthEstimator } from '../engine/DepthEstimator';
import { AttentionRiskEngine } from '../engine/AttentionRiskEngine';
import { AudioInterface } from '../engine/AudioInterface';

// Initialized lazily inside the component to prevent race conditions during module load
let objectDetector: ObjectDetector;
let depthEstimator: DepthEstimator;
let attentionEngine: AttentionRiskEngine;
let audioInterface: AudioInterface;

interface Props {
    isActive: boolean;
}

export const CameraView = ({ isActive }: Props) => {
    const device = useCameraDevice('back');
    const format = device ? useCameraFormat(device, [
        { videoResolution: { width: 1280, height: 720 } },
        { fps: 30 }
    ]) : undefined;

    const [isReady, setIsReady] = useState(false);
    const [hasPermission, setHasPermission] = useState(false);

    useEffect(() => {
        const init = async () => {
            try {
                const status = await Camera.requestCameraPermission();
                if (status === 'granted') {
                    setHasPermission(true);

                    // Delay initialization to let the system UI settle after permission dialog
                    setTimeout(async () => {
                        try {
                            // Initialize engines seqentially
                            objectDetector = new ObjectDetector();
                            depthEstimator = new DepthEstimator();
                            attentionEngine = new AttentionRiskEngine();
                            audioInterface = new AudioInterface();

                            await objectDetector.load();
                            await depthEstimator.load();
                            setIsReady(true);
                        } catch (e) {
                            console.error('Sequence Init Error', e);
                        }
                    }, 500);
                }
            } catch (e) {
                console.error('Permission Request Error', e);
            }
        };
        init();
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

        if (!attentionEngine || !audioInterface) return;

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
