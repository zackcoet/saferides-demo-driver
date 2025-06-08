import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    Alert,
    ScrollView,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';
import { 
    doc, 
    onSnapshot, 
    query, 
    collection, 
    where,
    QuerySnapshot,
    DocumentData
} from 'firebase/firestore';
import { SafeAreaView } from 'react-native-safe-area-context';

interface DriverCar {
    make: string;
    model: string;
    color: string;
    year: string;
}

interface Ride {
    id: string;
    status: string;
    driverName: string;
    driverPhone: string;
    driverCar: DriverCar;
    pickup: string;
    dropoff: string;
    price: number;
}

const ActiveRideScreen = () => {
    const { user } = useAuth();
    const [ride, setRide] = useState<Ride | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        // Listen for active ride
        const unsubscribe = onSnapshot(
            query(
                collection(db, 'rides'),
                where('riderId', '==', user.uid),
                where('status', '==', 'accepted')
            ),
            (snapshot) => {
                if (!snapshot.empty) {
                    const rideData = snapshot.docs[0].data() as Ride;
                    setRide({ ...rideData, id: snapshot.docs[0].id });
                } else {
                    setRide(null);
                }
                setLoading(false);
            },
            (error) => {
                console.error('Error fetching active ride:', error);
                Alert.alert('Error', 'Failed to load ride information');
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [user]);

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    if (!ride) {
        return (
            <View style={styles.centered}>
                <Text style={styles.noRideText}>No active ride found</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Driver Information</Text>
                    <View style={styles.infoCard}>
                        <Text style={styles.label}>Driver Name</Text>
                        <Text style={styles.value}>
                            {ride.driverName || 'Driver details unavailable'}
                        </Text>

                        <Text style={styles.label}>Phone Number</Text>
                        <Text style={styles.value}>
                            {ride.driverPhone || 'Not available'}
                        </Text>

                        <Text style={styles.label}>Vehicle</Text>
                        <Text style={styles.value}>
                            {ride.driverCar
                                ? `${ride.driverCar.year} ${ride.driverCar.make} ${ride.driverCar.model} (${ride.driverCar.color})`
                                : 'Vehicle details unavailable'}
                        </Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Trip Details</Text>
                    <View style={styles.infoCard}>
                        <Text style={styles.label}>Pickup Location</Text>
                        <Text style={styles.value}>{ride.pickup}</Text>

                        <Text style={styles.label}>Dropoff Location</Text>
                        <Text style={styles.value}>{ride.dropoff}</Text>

                        <Text style={styles.label}>Estimated Price</Text>
                        <Text style={styles.value}>
                            ${ride.price?.toFixed(2) || 'N/A'}
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    noRideText: {
        fontSize: 18,
        color: '#666',
    },
    section: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#333',
    },
    infoCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    label: {
        fontSize: 14,
        color: '#666',
        marginTop: 12,
        marginBottom: 4,
    },
    value: {
        fontSize: 16,
        color: '#333',
        marginBottom: 8,
    },
});

export default ActiveRideScreen; 