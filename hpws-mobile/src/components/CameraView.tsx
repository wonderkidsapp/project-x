import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Camera, useCameraDevice, useFrameProcessor, runAtTargetFps, useCameraFormat } from 'react-native-vision-camera';
import { ObjectDetector } from '../engine/ObjectDetector';
import { DepthEstimator } from '../engine/DepthEstimator';
import { AttentionRiskEngine } from '../engine/AttentionRiskEngine';
import { AudioInterface } from '../engine/AudioInterface';

// Global singleton instances to persist across re-renders
const objectDetector = new ObjectDetector();
const depthEstimator = new DepthEstimator();
const audioInterface = new AudioInterface();
const attentionEngine = new AttentionRiskEngine();

interface Props {
    isActive: boolean;
}

type AppState = 'STARTUP' | 'LOADING_OBJ' | 'LOADING_DEPTH' | 'LOADING_AUDIO' | 'NEED_PERMISSION' | 'READY' | 'ERROR';

export const CameraView = ({ isActive }: Props) => {
    const device = useCameraDevice('back');
    const format = device ? useCameraFormat(device, [
        { videoResolution: { width: 1280, height: 720 } },
        { fps: 30 }
    ]) : undefined;

    const [appState, setAppState] = useState<AppState>('STARTUP');
    const [statusMsg, setStatusMsg] = useState('Đang khởi động...');

    // Strict Sequential Initialization Logic
    const initApp = useCallback(async () => {
        try {
            // STEP 1: Load YOLO Model (High Memory)
            setAppState('LOADING_OBJ');
            setStatusMsg('Nạp mô hình nhận diện vật thể...');
            const objOk = await objectDetector.load();
            if (!objOk) throw new Error('Không thể nạp mô hình nhận diện (YOLO)');

            // STEP 2: Load MiDaS Model (High Memory)
            setAppState('LOADING_DEPTH');
            setStatusMsg('Nạp mô hình ước tính chiều sâu...');
            const depthOk = await depthEstimator.load();
            if (!depthOk) throw new Error('Không thể nạp mô hình chiều sâu (MiDaS)');

            // STEP 3: Setup Audio & TTS
            setAppState('LOADING_AUDIO');
            setStatusMsg('Khởi tạo âm thanh và giọng nói...');
            await audioInterface.load();

            // STEP 4: Check or Request Permissions
            const permission = await Camera.getCameraPermissionStatus();
            if (permission !== 'granted') {
                setAppState('NEED_PERMISSION');
                return;
            }

            setAppState('READY');
        } catch (e: any) {
            console.error('Initialization Failed:', e);
            setStatusMsg(`Lỗi: ${e.message}`);
            setAppState('ERROR');
        }
    }, []);

    useEffect(() => {
        initApp();
    }, [initApp]);

    const requestPermission = async () => {
        const result = await Camera.requestCameraPermission();
        if (result === 'granted') {
            setAppState('READY');
        } else {
            setStatusMsg('Bạn cần cấp quyền Camera để sử dụng app.');
            setAppState('ERROR');
        }
    };

    const frameProcessor = useFrameProcessor((frame) => {
        'worklet';
        runAtTargetFps(5, () => {
            'worklet';
            // Logic processor stays safe here
        });
    }, []);

    // Helper UI for Loading States
    if (appState !== 'READY') {
        return (
            <View style={[styles.loadingContainer, appState === 'ERROR' && styles.errorBg]}>
                {appState !== 'ERROR' && appState !== 'NEED_PERMISSION' && (
                    <ActivityIndicator size="large" color="#2ecc71" style={{ marginBottom: 20 }} />
                )}

                <Text style={styles.title}>HPWS - THIẾT BỊ HỖ TRỢ</Text>
                <Text style={styles.status}>{statusMsg}</Text>

                {appState === 'NEED_PERMISSION' && (
                    <TouchableOpacity style={styles.btn} onPress={requestPermission}>
                        <Text style={styles.btnText}>CHO PHÉP CAMERA</Text>
                    </TouchableOpacity>
                )}

                {appState === 'ERROR' && (
                    <TouchableOpacity style={[styles.btn, { backgroundColor: '#555' }]} onPress={initApp}>
                        <Text style={styles.btnText}>THỬ LẠI</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    }

    if (!device) return <View style={styles.loadingContainer}><Text style={styles.status}>Lỗi: Không tìm thấy thiết bị Camera</Text></View>;

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
        backgroundColor: '#000',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40
    },
    errorBg: {
        backgroundColor: '#300',
    },
    title: {
        color: '#2ecc71',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10
    },
    status: {
        color: '#fff',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 30
    },
    btn: {
        backgroundColor: '#2ecc71',
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 12
    },
    btnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 18
    }
});
