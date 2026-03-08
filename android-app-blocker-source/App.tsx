import React, { useEffect, useState } from 'react';
import { View, Text, Switch, Button, StyleSheet, NativeModules, Platform } from 'react-native';
import io from 'socket.io-client';

const { AppBlockerModule } = NativeModules;
const BACKEND_URL = 'http://YOUR_LOCAL_IP:3001'; // Replace with your computer's IP or Railway URL

export default function App() {
    const [isConnected, setIsConnected] = useState(false);
    const [hasPermission, setHasPermission] = useState(false);

    useEffect(() => {
        // 1. Check if Accessibility Permission is granted
        if (Platform.OS === 'android') {
            AppBlockerModule.checkPermission().then((status: boolean) => {
                setHasPermission(status);
            });
        }

        // 2. Connect to the Node.js Backend using the same User ID as the web app
        const socket = io(BACKEND_URL, {
            query: {
                userId: 'USER_123', // This must match the userId on the website
                platform: 'android'
            }
        });

        socket.on('connect', () => {
            setIsConnected(true);
            // Let the backend know this Android device is ready
            socket.emit('agent:android_status', { permissionsGranted: hasPermission });
        });

        socket.on('disconnect', () => setIsConnected(false));

        // 3. Listen for the Block Command from the Website Note: This comes from server.ts!
        socket.on('command:block_apps', (data) => {
            console.log('Received block command:', data);

            // Pass the list of blocked apps (e.g. ['com.instagram.android', 'com.zhiliaoapp.musically'])
            // and the duration to our native Android Java code
            if (Platform.OS === 'android') {
                AppBlockerModule.startBlocking(data.apps, data.duration);
            }
        });

        // 4. Listen for the Unblock Command
        socket.on('command:unblock_apps', () => {
            console.log('Received unblock command');
            if (Platform.OS === 'android') {
                AppBlockerModule.stopBlocking();
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [hasPermission]);

    const requestPermission = () => {
        if (Platform.OS === 'android') {
            AppBlockerModule.requestPermission();
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>FocusFlow App Blocker</Text>

            <View style={styles.statusCard}>
                <Text style={styles.label}>Backend Connection:</Text>
                <Text style={[styles.status, isConnected ? styles.connected : styles.disconnected]}>
                    {isConnected ? 'Connected' : 'Disconnected'}
                </Text>
            </View>

            <View style={styles.statusCard}>
                <Text style={styles.label}>Accessibility Permission:</Text>
                <Text style={[styles.status, hasPermission ? styles.connected : styles.disconnected]}>
                    {hasPermission ? 'Granted' : 'Missing'}
                </Text>
            </View>

            {!hasPermission && (
                <View style={styles.buttonContainer}>
                    <Button title="Grant Accessibility Permission" onPress={requestPermission} />
                    <Text style={styles.hint}>Required to detect and block social media apps.</Text>
                </View>
            )}

            {hasPermission && (
                <Text style={styles.successHint}>
                    Ready! Go to the FocusFlow website and start a focus session. When you try to open a blocked app, it will be intercepted immediately.
                </Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 24, backgroundColor: '#f5f5f5', justifyContent: 'center' },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 32, textAlign: 'center' },
    statusCard: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, backgroundColor: 'white', borderRadius: 8, marginBottom: 12, elevation: 2 },
    label: { fontSize: 16, color: '#333' },
    status: { fontSize: 16, fontWeight: 'bold' },
    connected: { color: 'green' },
    disconnected: { color: 'red' },
    buttonContainer: { marginTop: 24 },
    hint: { marginTop: 8, fontSize: 12, color: '#666', textAlign: 'center' },
    successHint: { marginTop: 24, fontSize: 14, color: 'green', textAlign: 'center', lineHeight: 20 }
});
