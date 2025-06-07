import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../services/AuthContext';
import { query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { tripsCol } from '../firebase/collections';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';

const PRIMARY_BLUE = '#174EA6';
const GRAY = '#888';

interface Trip {
    id: string;
    driverId: string;
    riderId: string;
    destination: string;
    pickup: string;
    price: number;
    date: any; // Firestore Timestamp
}

interface TripDocument {
    driverId: string;
    riderId: string;
    destination: string;
    pickup: string;
    price: number;
    date: any;
}

const TripsScreen = () => {
    const { user } = useAuth();
    const [trips, setTrips] = useState<Trip[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, currentUser => {
            if (!currentUser) return;

            const q = query(
                tripsCol,
                where('driverId', '==', currentUser.uid),
                orderBy('date', 'desc')
            );

            return onSnapshot(q, 
                snap => {
                    const data = snap.docs.map(d => ({
                        id: d.id,
                        ...(d.data() as TripDocument)
                    })) as Trip[];
                    setTrips(data);
                    setIsLoading(false);
                },
                error => {
                    console.error('Error fetching trips:', error);
                    Alert.alert('Error', 'Failed to load trips. Please try again.');
                    setIsLoading(false);
                }
            );
        });

        return () => unsub && unsub();
    }, []);

    const handleCompleteRide = async (riderId: string, destination: string, pickup: string, price: number) => {
        if (!user) return;

        try {
            await addDoc(tripsCol, {
                driverId: user.uid,
                riderId,
                destination,
                pickup,
                price,
                date: serverTimestamp(),
            });
        } catch (error) {
            console.error('Error saving trip:', error);
            Alert.alert('Error', 'Failed to save trip. Please try again.');
        }
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return '';
        const date = timestamp.toDate();
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const renderTrip = ({ item }: { item: Trip }) => (
        <View style={styles.tripCard}>
            <View style={styles.tripHeader}>
                <View style={styles.driverInfo}>
                    <Image
                        source={{ uri: 'https://via.placeholder.com/40' }}
                        style={styles.driverPhoto}
                    />
                    <View>
                        <Text style={styles.driverName}>Driver Name</Text>
                        <Text style={styles.tripDate}>{formatDate(item.date)}</Text>
                    </View>
                </View>
                <Text style={styles.tripPrice}>${item.price.toFixed(2)}</Text>
            </View>
            <View style={styles.tripDetails}>
                <View style={styles.locationRow}>
                    <Ionicons name="location" size={20} color={PRIMARY_BLUE} />
                    <Text style={styles.locationText}>{item.pickup}</Text>
                </View>
                <View style={styles.locationRow}>
                    <Ionicons name="location" size={20} color={PRIMARY_BLUE} />
                    <Text style={styles.locationText}>{item.destination}</Text>
                </View>
            </View>
        </View>
    );

    if (isLoading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>SafeRides</Text>
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={PRIMARY_BLUE} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>SafeRides</Text>
            </View>
            <FlatList
                data={trips}
                renderItem={renderTrip}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No trips yet</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        backgroundColor: PRIMARY_BLUE,
        alignItems: 'center',
        paddingTop: 0,
        paddingBottom: 10,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 28,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    contentContainer: {
        padding: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tripCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    tripHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    driverInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    driverPhoto: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    driverName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#222',
    },
    tripDate: {
        fontSize: 14,
        color: GRAY,
        marginTop: 2,
    },
    tripPrice: {
        fontSize: 18,
        fontWeight: 'bold',
        color: PRIMARY_BLUE,
    },
    tripDetails: {
        gap: 8,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    locationText: {
        fontSize: 15,
        color: '#222',
        marginLeft: 8,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 32,
    },
    emptyText: {
        fontSize: 16,
        color: GRAY,
    },
});

export default TripsScreen; 