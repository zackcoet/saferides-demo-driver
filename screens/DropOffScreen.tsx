import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Dimensions
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

type DropOffRouteProp = RouteProp<RootStackParamList, 'DropOffScreen'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Default coordinates (San Francisco)
const DEFAULT_COORDINATES = {
    latitude: 37.7749,
    longitude: -122.4194,
};

const DropOffScreen = () => {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<DropOffRouteProp>();
    const { rideId, dropoffAddress, pickupLocation, dropoffLocation } = route.params;
    
    const [isLoading, setIsLoading] = useState(false);
    const [rideData, setRideData] = useState<any>(null);
    const [mapRegion, setMapRegion] = useState({
        latitude: pickupLocation?.latitude || DEFAULT_COORDINATES.latitude,
        longitude: pickupLocation?.longitude || DEFAULT_COORDINATES.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
    });

    // Listen for ride updates
    useEffect(() => {
        const unsubscribe = onSnapshot(doc(db, 'rides', rideId), (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                setRideData(data);
            }
        });

        return () => unsubscribe();
    }, [rideId]);

    const handleCompleteTrip = async () => {
        try {
            setIsLoading(true);
            await updateDoc(doc(db, 'rides', rideId), {
                status: 'completed',
                completedAt: serverTimestamp()
            });
            navigation.reset({
                index: 0,
                routes: [{ name: 'Home' }]
            });
        } catch (error) {
            console.error('Error completing trip:', error);
            Alert.alert('Error', 'Failed to complete trip');
        } finally {
            setIsLoading(false);
        }
    };

    // If we only have a string address (no coordinates), show simplified view
    if (!dropoffLocation) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Drop-off Location</Text>
                </View>

                <View style={styles.content}>
                    <View style={styles.locationCard}>
                        <View style={styles.locationIcon}>
                            <Ionicons name="flag" size={32} color="#174EA6" />
                        </View>
                        <View style={styles.locationDetails}>
                            <Text style={styles.locationLabel}>Destination</Text>
                            <Text style={styles.locationAddress}>
                                {dropoffAddress || 'Loading...'}
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.completeButton, isLoading && styles.disabledButton]}
                        onPress={handleCompleteTrip}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.buttonText}>Complete Trip</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // Ensure we have valid coordinates for the map
    const pickupCoords = pickupLocation as { latitude: number; longitude: number };
    const dropoffCoords = dropoffLocation as { latitude: number; longitude: number };

    // If we have coordinates, show map view
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Drop-off Location</Text>
            </View>

            <View style={styles.content}>
                <View style={styles.locationCard}>
                    <View style={styles.locationIcon}>
                        <Ionicons name="flag" size={32} color="#174EA6" />
                    </View>
                    <View style={styles.locationDetails}>
                        <Text style={styles.locationLabel}>Destination</Text>
                        <Text style={styles.locationAddress}>
                            {dropoffAddress || 'Loading...'}
                        </Text>
                    </View>
                </View>

                {/* Map View */}
                <View style={styles.mapContainer}>
                    <MapView
                        style={styles.map}
                        provider={PROVIDER_GOOGLE}
                        initialRegion={mapRegion}
                        showsUserLocation
                        showsMyLocationButton
                    >
                        {/* Pickup Marker */}
                        <Marker
                            coordinate={pickupCoords}
                            title="Pickup Location"
                            pinColor="#174EA6"
                        >
                            <Ionicons name="location" size={24} color="#174EA6" />
                        </Marker>

                        {/* Dropoff Marker */}
                        <Marker
                            coordinate={dropoffCoords}
                            title="Drop-off Location"
                            pinColor="#174EA6"
                        >
                            <Ionicons name="flag" size={24} color="#174EA6" />
                        </Marker>

                        {/* Route Line */}
                        <Polyline
                            coordinates={[pickupCoords, dropoffCoords]}
                            strokeColor="#174EA6"
                            strokeWidth={4}
                        />
                    </MapView>
                </View>
            </View>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.completeButton, isLoading && styles.disabledButton]}
                    onPress={handleCompleteTrip}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.buttonText}>Complete Trip</Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        padding: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    title: {
        fontSize: 24,
        fontWeight: '600',
        color: '#333',
        textAlign: 'center',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    locationCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        marginBottom: 16,
    },
    locationIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#f0f7ff',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    locationDetails: {
        flex: 1,
    },
    locationLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    locationAddress: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    mapContainer: {
        flex: 1,
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    map: {
        width: Dimensions.get('window').width - 32,
        height: '100%',
    },
    footer: {
        padding: 16,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    completeButton: {
        backgroundColor: '#174EA6',
        height: 48,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    disabledButton: {
        opacity: 0.5,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    mapError: {
        flex: 1,
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
    },
    mapErrorText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        fontSize: 18,
        color: '#dc2626',
        marginTop: 12,
        marginBottom: 24,
        textAlign: 'center',
    },
    retryButton: {
        backgroundColor: '#174EA6',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default DropOffScreen; 