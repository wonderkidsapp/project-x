import React, { useEffect, useState, useCallback, useRef } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Camera, useCameraDevice, useFrameProcessor, runAtTargetFps, useCameraFormat } from 'react-native-vision-camera';
import { ObjectDetector } from '../engine/ObjectDetector';
import { DepthEstimator } from '../engine/DepthEstimator';
import { AttentionRiskEngine } from '../engine/AttentionRiskEngine';
import { AudioInterface } from '../engine/AudioInterface';

interface Props {
    isActive: boolean;
    onReadyChange?: (ready: boolean) => void;
}

type AppState = 'STARTUP' | 'LOADING_OBJ' | 'LOADING_DEPTH' | 'LOADING_AUDIO' | 'NEED_PERMISSION' | 'READY' | 'ERROR';

export const CameraView = ({ isActive, onReadyChange }: Props) => {
    const device = useCameraDevice('back');
    const format = device ? useCameraFormat(device, [
        { videoResolution: { width: 1280, height: 720 } },
        { fps: 30 }
    ]) : undefined;

    const [appState, setAppState] = useState<AppState>('STARTUP');
    const [statusMsg, setStatusMsg] = useState('Đang khởi động...');

    // Use refs to store engine instances (they persist across re-renders but don't trigger re-renders)
    const objectDetectorRef = useRef<ObjectDetector | null>(null);
    const depthEstimatorRef = useRef<DepthEstimator | null>(null);
    const audioInterfaceRef = useRef<AudioInterface | null>(null);
    const attentionEngineRef = useRef<AttentionRiskEngine | null>(null);

    const initApp = useCallback(async () => {
        try {
            // WAIT for the UI to settle and Splash screen to hide
            // This prevents iOS 18 Watchdog from killing the app due to long blocking startup
            await new Promise(resolve => setTimeout(resolve, 1500));

            // STEP 1: Load YOLO Model
            setAppState('LOADING_OBJ');
            setStatusMsg('Nạp mô hình nhận diện vật thể...');
            objectDetectorRef.current = new ObjectDetector();
            const objOk = await objectDetectorRef.current.load();
            if (!objOk) throw new Error('Không thể nạp mô hình nhận diện (YOLO)');

            // STEP 2: Load MiDaS Model
            setAppState('LOADING_DEPTH');
            setStatusMsg('Nạp mô hình ước tính chiều sâu...');
            depthEstimatorRef.current = new DepthEstimator();
            const depthOk = await depthEstimatorRef.current.load();
            if (!depthOk) throw new Error('Không thể nạp mô hình chiều sâu (MiDaS)');

            // STEP 3: Setup Audio & TTS
            setAppState('LOADING_AUDIO');
            setStatusMsg('Khởi tạo âm thanh và giọng nói...');
            attentionEngineRef.current = new AttentionRiskEngine();
            audioInterfaceRef.current = new AudioInterface();
            await audioInterfaceRef.current.load();

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

    // Notify parent when ready state changes
    useEffect(() => {
        if (appState === 'READY') {
            onReadyChange?.(true);
        } else if (appState === 'ERROR') {
            onReadyChange?.(false);
        }
    }, [appState, onReadyChange]);

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
            // Safe processing
        });
    }, []);

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
        backgroundColor: '#0a0a0a',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40
    },
    errorBg: {
        backgroundColor: '#1a0505'
    },
    title: {
        color: '#2ecc71',
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 15,
        letterSpacing: 1
    },
    status: {
        color: '#aaa',
        fontSize: 17,
        textAlign: 'center',
        marginBottom: 40,
        fontWeight: '500'
    },
    btn: {
        backgroundColor: '#2ecc71',
        paddingHorizontal: 40,
        paddingVertical: 18,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
    },
    btnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 18
    }
});
