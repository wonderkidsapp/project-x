import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { Camera, useCameraDevice, useFrameProcessor, runAtTargetFps, useCameraFormat } from 'react-native-vision-camera';
import { ObjectDetector } from '../engine/ObjectDetector';
import { DepthEstimator } from '../engine/DepthEstimator';
import { AttentionRiskEngine } from '../engine/AttentionRiskEngine';
import { AudioInterface } from '../engine/AudioInterface';

// Global instances
let objectDetector: ObjectDetector;
let depthEstimator: DepthEstimator;
let attentionEngine: AttentionRiskEngine;
let audioInterface: AudioInterface;

interface Props {
    isActive: boolean;
}

type InitStep = 'IDLE' | 'PERMISSION' | 'MODEL_OBJ' | 'MODEL_DEPTH' | 'AUDIO' | 'READY' | 'ERROR';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const CameraView = ({ isActive }: Props) => {
    const device = useCameraDevice('back');
    const format = device ? useCameraFormat(device, [
        { videoResolution: { width: 1280, height: 720 } },
        { fps: 30 }
    ]) : undefined;

    const [step, setStep] = useState<InitStep>('IDLE');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        const startSequence = async () => {
            try {
                // 1. Permission (Wait for UI to settle)
                setStep('PERMISSION');
                const status = await Camera.requestCameraPermission();
                if (status !== 'granted') {
                    throw new Error('Bạn chưa cho phép truy cập Camera');
                }
                await delay(1000);

                // 2. Object Model
                setStep('MODEL_OBJ');
                objectDetector = new ObjectDetector();
                await objectDetector.load();
                await delay(1000);

                // 3. Depth Model
                setStep('MODEL_DEPTH');
                depthEstimator = new DepthEstimator();
                await depthEstimator.load();
                await delay(1000);

                // 4. Audio & Engines
                setStep('AUDIO');
                attentionEngine = new AttentionRiskEngine();
                audioInterface = new AudioInterface();
                await audioInterface.load();
                await delay(1000);

                setStep('READY');
            } catch (e: any) {
                console.error('Init Sequence Failed:', e);
                setErrorMsg(e.message || 'Lỗi không xác định');
                setStep('ERROR');
            }
        };

        startSequence();
    }, []);

    const frameProcessor = useFrameProcessor((frame) => {
        'worklet';
        runAtTargetFps(5, () => {
            'worklet';
            console.log("Processing flow stable");
        });
    }, []);

    // Important: Render progress screen
    if (step !== 'READY') {
        const isError = step === 'ERROR';
        return (
            <View style={[styles.loadingContainer, isError && styles.errorBg]}>
                {!isError && <ActivityIndicator size="large" color="#2ecc71" style={{ marginBottom: 20 }} />}
                <Text style={styles.loadingTitle}>HPWS - Hệ thống đang khởi động</Text>
                <Text style={styles.loadingText}>
                    {step === 'PERMISSION' && "Đang kiểm tra quyền truy cập camera..."}
                    {step === 'MODEL_OBJ' && "Đang nạp mô hình Object Detection (Step 1/3)..."}
                    {step === 'MODEL_DEPTH' && "Đang nạp mô hình Depth Estimation (Step 2/3)..."}
                    {step === 'AUDIO' && "Đang khởi tạo hệ thống Voice & Audio (Step 3/3)..."}
                    {isError && `LỖI KHỞI TẠO: ${errorMsg}`}
                </Text>
                {isError && <Text style={styles.retryHint}>Vui lòng xóa app và cài lại nếu lỗi tiếp diễn.</Text>}
            </View>
        );
    }

    if (!device) return <View style={styles.loadingContainer}><Text style={styles.loadingText}>Không tìm thấy Camera</Text></View>;

    return (
        <View style={styles.container}>
            <Camera
                style={StyleSheet.absoluteFill}
                device={device}
                format={format}
                isActive={isActive}
                frameProcessor={frameProcessor}
                pixelFormat="yuv"
                enableDepthData={true}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#111',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 30
    },
    errorBg: {
        backgroundColor: '#2c0000'
    },
    loadingTitle: {
        color: '#2ecc71',
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 10
    },
    loadingText: {
        color: '#eee',
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24
    },
    retryHint: {
        color: '#aaa',
        marginTop: 20,
        fontSize: 14
    }
});
