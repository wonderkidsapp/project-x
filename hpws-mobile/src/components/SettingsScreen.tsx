import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const SettingsScreen = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Settings Screen Placeholder</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        color: 'black',
        fontSize: 20,
    }
});
