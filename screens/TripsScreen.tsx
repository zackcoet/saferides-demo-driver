import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../services/AuthContext';
import { query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { tripsCol } from '../firebase/collections';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import { collection } from 'firebase/firestore';
import { db } from '../config/firebase';

const PRIMARY_BLUE = '#174EA6';
const GRAY = '#888';

interface Trip {
    id: string;
    riderFirstName: string;
    riderLastName: string;
    pickup: string;
    dropoff: string;
    price: number;
    date: any; // Firestore Timestamp
    status: 'completed' | 'picked_up' | 'accepted';
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
        if (!user) {
            setIsLoading(false);
            return;
        }

        const q = query(
            collection(db, 'rides'),
            where('driverId', '==', user.uid),
            where('status', '==', 'completed')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const tripData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Trip[];
            setTrips(tripData);
            setIsLoading(false);
        }, (error) => {
            console.error('Error fetching trips:', error);
            Alert.alert('Error', 'Failed to load trips. Please try again.');
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

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

    const formatPrice = (price: number | undefined) => {
        if (typeof price === 'number') {
            return `$${price.toFixed(2)}`;
        }
        return 'N/A';
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp?.toDate) return 'N/A';
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
                <Text style={styles.riderName}>
                    {item.riderFirstName} {item.riderLastName}
                </Text>
                <Text style={styles.tripDate}>
                    {formatDate(item.date)}
                </Text>
            </View>
            <View style={styles.tripDetails}>
                <View style={styles.locationRow}>
                    <Ionicons name="location" size={20} color="#1976D2" />
                    <Text style={styles.locationText}>{item.pickup}</Text>
                </View>
                <View style={styles.locationRow}>
                    <Ionicons name="location" size={20} color="#4CAF50" />
                    <Text style={styles.locationText}>{item.dropoff}</Text>
                </View>
            </View>
            <View style={styles.tripFooter}>
                <Text style={styles.price}>{formatPrice(item.price)}</Text>
                <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>Completed</Text>
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
                    <ActivityIndicator size="large" color="#1976D2" />
                </View>
            </SafeAreaView>
        );
    }

    if (!user) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>SafeRides</Text>
                </View>
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Please sign in to view your trips</Text>
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
                        <Text style={styles.emptyText}>No completed trips yet</Text>
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
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    tripHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    riderName: {
        fontSize: 18,
        fontWeight: '600',
    },
    tripDate: {
        color: '#666',
        fontSize: 14,
    },
    tripDetails: {
        marginBottom: 12,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    locationText: {
        marginLeft: 8,
        fontSize: 16,
        color: '#333',
    },
    tripFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 12,
    },
    price: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1976D2',
    },
    statusBadge: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    statusText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 32,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
    },
});

export default TripsScreen; 