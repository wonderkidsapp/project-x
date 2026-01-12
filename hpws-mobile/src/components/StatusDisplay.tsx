import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useBatteryLevel } from 'react-native-device-info'; // Need to install if not present, or mock
// Since react-native-device-info wasn't in list, I'll mock or use standard API if available. 
// Actually guideline list didn't include device-info explicitly but mentioned "Battery Optimization".
// I'll stick to simple display for now.

interface Props {
    isActive: boolean;
    processingFps?: number;
}

export const StatusDisplay = ({ isActive, processingFps = 0 }: Props) => {
    return (
        <View style={styles.container}>
            <View style={styles.row}>
                <View style={[styles.indicator, { backgroundColor: isActive ? '#00ff00' : '#555' }]} />
                <Text style={styles.text}>{isActive ? 'ACTIVE' : 'STANDBY'}</Text>
            </View>
            <View style={styles.row}>
                <Text style={styles.infoText}>FPS: {processingFps}</Text>
                <Text style={styles.infoText}>BAT: --%</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 15,
        backgroundColor: 'rgba(0,0,0,0.8)',
        width: '100%',
        position: 'absolute',
        top: 0,
        zIndex: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10
    },
    indicator: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    text: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold'
    },
    infoText: {
        color: '#ccc',
        fontSize: 14,
        marginLeft: 10
    }
});
