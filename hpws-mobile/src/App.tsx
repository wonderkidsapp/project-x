import React, { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, StatusBar, TouchableOpacity, Text, View, ActivityIndicator } from 'react-native';
import { CameraView } from './components/CameraView';
import { StatusDisplay } from './components/StatusDisplay';
import KeepAwake from 'react-native-keep-awake';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

const App = () => {
  const [isActive, setIsActive] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isAppReady, setIsAppReady] = useState(false);

  useEffect(() => {
    // Prevent screen sleep when app is open
    KeepAwake.activate();

    // CRITICAL: Delay initial render to let React Native bridge fully initialize
    // This prevents crash from Text components rendering before native modules are ready
    const timer = setTimeout(() => {
      setIsAppReady(true);
    }, 100);

    return () => {
      KeepAwake.deactivate();
      clearTimeout(timer);
    };
  }, []);

  const toggleActive = () => {
    // Only allow toggle if camera system is ready
    if (!isCameraReady) {
      console.warn('Camera system not ready yet');
      return;
    }

    ReactNativeHapticFeedback.trigger('impactHeavy');
    setIsActive(!isActive);
  };

  // Show minimal splash while React Native initializes
  if (!isAppReady) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color="#2ecc71" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Camera Layer (Background) */}
      <View style={styles.cameraContainer}>
        <CameraView
          isActive={isActive}
          onReadyChange={setIsCameraReady}
        />
      </View>

      {/* Overlay Layer */}
      <View style={styles.overlay}>
        <StatusDisplay isActive={isActive} processingFps={isActive ? 3 : 0} />

        <View style={styles.controls}>
          <TouchableOpacity
            style={[
              styles.button,
              isActive ? styles.buttonStop : styles.buttonStart,
              !isCameraReady && styles.buttonDisabled
            ]}
            onPress={toggleActive}
            activeOpacity={0.7}
            disabled={!isCameraReady}
          >
            <Text style={styles.buttonText}>
              {!isCameraReady ? "ĐANG TẢI..." : (isActive ? "DỪNG LẠI" : "BẮT ĐẦU")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center'
  },
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  cameraContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between'
  },
  controls: {
    padding: 30,
    alignItems: 'center',
    marginBottom: 30
  },
  button: {
    width: '100%',
    height: 80,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  buttonStart: {
    backgroundColor: '#2ecc71', // Green
  },
  buttonStop: {
    backgroundColor: '#e74c3c', // Red
  },
  buttonDisabled: {
    backgroundColor: '#555',
    opacity: 0.6
  },
  buttonText: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    textTransform: 'uppercase'
  }
});

export default App;
