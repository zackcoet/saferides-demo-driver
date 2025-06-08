import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Platform, SafeAreaView, Dimensions, FlatList, TouchableOpacity, Button, Alert, ActivityIndicator, Modal, TextInput, StatusBar } from 'react-native';
import MapView from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../config/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../services/AuthContext';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface RideRequest {
  id: string;
  destination?: string;
  riderName?: string;
  riderCode?: string;
  [key: string]: any;
}

interface Trip {
    id: string;
    price: number;
    date: any; // Firestore Timestamp
}

interface DriverData {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    carMake: string;
    carModel: string;
    carColor: string;
    carYear: string;
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const PRIMARY_BLUE = '#0A3AFF';

const HomeScreen = () => {
    const { user } = useAuth();
    const [rideRequests, setRideRequests] = useState<RideRequest[]>([]);
    const [isOnline, setIsOnline] = useState(true);
    const [acceptedRide, setAcceptedRide] = useState<any>(null);
    const [showModal, setShowModal] = useState(false);
    const [todaysTrips, setTodaysTrips] = useState(0);
    const [todaysEarnings, setTodaysEarnings] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [driverData, setDriverData] = useState<DriverData | null>(null);
    const navigation = useNavigation<NavigationProp>();
    const [showCodeModal, setShowCodeModal] = useState(false);
    const [enteredCode, setEnteredCode] = useState('');
    const [selectedRide, setSelectedRide] = useState<RideRequest | null>(null);

    // Debug ride requests
    useEffect(() => {
        console.log('🔍 Current ride requests:', rideRequests);
    }, [rideRequests]);

    // Listen for ride requests when driver is online
    useEffect(() => {
        if (!isOnline || !user) {
            console.log('🚫 Not listening for rides - Driver offline or not authenticated');
            setRideRequests([]);
            return;
        }

        console.log('🎯 Setting up ride request listener...');
        const q = query(
            collection(db, 'rides'),
            where('status', '==', 'requested')
        );

        const unsubscribe = onSnapshot(q, 
            (snapshot) => {
                console.log('📥 Received ride request update');
                console.log('📊 Number of requests:', snapshot.docs.length);
                
                const rides = snapshot.docs.map(doc => {
                    const data = doc.data();
                    console.log('🚖 Ride request:', {
                        id: doc.id,
                        status: data.status,
                        pickup: data.pickup,
                        dropoff: data.dropoff
                    });
                    return {
                        id: doc.id,
                        ...data
                    };
                }) as RideRequest[];
                
                setRideRequests(rides);
            }, 
            (error) => {
                console.error('❌ Error in ride request listener:', error);
                Alert.alert('Error', 'Failed to load ride requests. Please try again.');
            }
        );

        console.log('✅ Ride request listener active');
        return () => {
            console.log('🛑 Cleaning up ride request listener');
            unsubscribe();
        };
    }, [isOnline, user]);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, currentUser => {
            if (!currentUser) return;

            // Get start of today (00:00:00)
            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);

            const q = query(
                collection(db, 'trips'),
                where('driverId', '==', currentUser.uid),
                where('date', '>=', startOfToday)
            );

            return onSnapshot(q, 
                snap => {
                    const trips = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Trip[];
                    setTodaysTrips(trips.length);
                    setTodaysEarnings(trips.reduce((sum, trip) => sum + (trip.price || 0), 0));
                    setIsLoading(false);
                },
                error => {
                    console.error('Error fetching trips:', error);
                    Alert.alert('Error', 'Failed to load trip data. Please try again.');
                    setIsLoading(false);
                }
            );
        });

        return () => unsub();
    }, []);

    // Fetch driver data when component mounts
    useEffect(() => {
        if (!user) return;

        const fetchDriverData = async () => {
            try {
                const driverDoc = await getDoc(doc(db, 'drivers', user.uid));
                if (driverDoc.exists()) {
                    const data = driverDoc.data();
                    setDriverData({
                        firstName: data.firstName || '',
                        lastName: data.lastName || '',
                        phoneNumber: data.phoneNumber || '',
                        carMake: data.carMake || '',
                        carModel: data.carModel || '',
                        carColor: data.carColor || '',
                        carYear: data.carYear || ''
                    });
                }
            } catch (error) {
                console.error('Error fetching driver data:', error);
                Alert.alert('Error', 'Failed to load driver information');
            }
        };

        fetchDriverData();
    }, [user]);

    const handleAcceptRide = async (rideId: string) => {
        try {
            setIsLoading(true);
            const currentUser = auth.currentUser;
            
            if (!currentUser) {
                Alert.alert('Error', 'You must be logged in to accept rides');
                return;
            }

            // Fetch driver's profile
            const driverSnap = await getDoc(doc(db, 'drivers', currentUser.uid));
            const driverData = driverSnap.data() ?? {};

            // Update ride with driver information
            await updateDoc(doc(db, 'rides', rideId), {
                driverId: currentUser.uid,
                driverName: `${driverData.firstName ?? ''} ${driverData.lastName ?? ''}`.trim(),
                driverPhone: driverData.phoneNumber ?? '',
                driverGender: driverData.gender ?? '',
                driverCar: {
                    make: driverData.carMake ?? '',
                    model: driverData.carModel ?? '',
                    color: driverData.carColor ?? '',
                    year: driverData.carYear ?? '',
                },
                driverPlate: driverData.licensePlate ?? '',
                status: 'accepted',
                acceptedAt: serverTimestamp(),
            }, { merge: true });

            // Navigate to ride details
            navigation.navigate('RideDetails', {
                ride: {
                    id: rideId,
                    riderId: currentUser.uid,
                    riderFirstName: '',
                    riderLastName: '',
                    pickup: '',
                    dropoff: '',
                    phoneNumber: '',
                    status: 'accepted'
                }
            });
        } catch (error) {
            console.error('Error accepting ride:', error);
            Alert.alert('Error', 'Failed to accept ride. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePickedUpRider = async (rideId: string, riderCode: string) => {
        setShowCodeModal(true);
        setSelectedRide({ id: rideId, riderCode });
    };

    const handleVerifyCode = async () => {
        if (!selectedRide) return;

        if (enteredCode === selectedRide.riderCode) {
            try {
                await updateDoc(doc(db, 'rides', selectedRide.id), {
                    status: 'in_progress'
                });
                setShowCodeModal(false);
                setEnteredCode('');
                // Navigate to drop-off screen or update UI
            } catch (error) {
                console.error('Error updating ride status:', error);
                Alert.alert('Error', 'Failed to update ride status');
            }
        } else {
            Alert.alert(
                'Invalid code',
                'Please ask the rider for the correct 4-digit code.'
            );
        }
    };

    const declineRide = (rideId: string) => {
        setRideRequests((prev) => prev.filter((ride) => ride.id !== rideId));
        console.log('❌ Ride declined:', rideId);
    };

    const handleToggleOnline = () => {
        if (isOnline) {
            // Going offline
            setTodaysTrips(0);
            setTodaysEarnings(0);
        }
        setIsOnline(!isOnline);
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>SafeRides</Text>
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#174EA6" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor={PRIMARY_BLUE} />
            <View style={styles.container}>
                {/* Map as background */}
                <MapView
                    style={styles.map}
                    initialRegion={{
                        latitude: 34.0007,
                        longitude: -81.0348,
                        latitudeDelta: 0.05,
                        longitudeDelta: 0.05,
                    }}
                    showsUserLocation
                    showsMyLocationButton
                />
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>SafeRides</Text>
                </View>
                {/* Ride Requests Overlay */}
                {isOnline && rideRequests.length > 0 && (
                    <View style={styles.requestsOverlay}>
                        <Text style={styles.requestsTitle}>Incoming Ride Requests:</Text>
                        <FlatList
                            data={rideRequests}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <View style={styles.requestCard}>
                                    <Text style={styles.requestText}>
                                        Rider going to: {item.destination}
                                    </Text>
                                    <View style={styles.requestButtons}>
                                        <TouchableOpacity
                                            onPress={() => handleAcceptRide(item.id)}
                                            style={styles.acceptButton}
                                        >
                                            <Text style={styles.acceptButtonText}>Accept</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => declineRide(item.id)}
                                            style={styles.declineButton}
                                        >
                                            <Text style={styles.declineButtonText}>Decline</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                        />
                    </View>
                )}
                {/* Bottom Container */}
                <View style={styles.bottomContainer} pointerEvents="box-none">
                    <View style={styles.statusRow}>
                        <Ionicons 
                            name={isOnline ? 'ellipse' : 'ellipse-outline'} 
                            size={16} 
                            color={isOnline ? '#4CAF50' : '#888'} 
                            style={styles.statusIcon} 
                        />
                        <Text style={[styles.statusText, { color: isOnline ? '#4CAF50' : '#888' }]}>
                            {isOnline ? 'You are Online' : 'You are Offline'}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.toggleButton, !isOnline && styles.toggleButtonOffline]}
                        onPress={handleToggleOnline}
                    >
                        <Ionicons
                            name={isOnline ? 'radio-button-on' : 'radio-button-off'}
                            size={24}
                            color={isOnline ? PRIMARY_BLUE : '#888'}
                            style={styles.toggleIcon}
                        />
                        <Text style={[styles.toggleText, !isOnline && styles.toggleTextOffline]}>
                            {isOnline ? 'Go Offline' : 'Go Online'}
                        </Text>
                    </TouchableOpacity>
                    <View style={styles.statsRow}>
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>{todaysTrips}</Text>
                            <Text style={styles.statLabel}>Today's Trips</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>${todaysEarnings.toFixed(2)}</Text>
                            <Text style={styles.statLabel}>Today's Earnings</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Code Verification Modal */}
            <Modal
                visible={showCodeModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowCodeModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.codeModalContainer}>
                        <Text style={styles.codeModalTitle}>Enter Pickup Code</Text>
                        <Text style={styles.codeModalSubtitle}>
                            Please ask the rider for their 4-digit code
                        </Text>
                        <TextInput
                            style={styles.codeInput}
                            value={enteredCode}
                            onChangeText={setEnteredCode}
                            keyboardType="number-pad"
                            maxLength={4}
                            placeholder="Enter 4-digit code"
                            placeholderTextColor="#999"
                        />
                        <View style={styles.codeModalButtons}>
                            <TouchableOpacity
                                style={[styles.codeModalButton, styles.cancelButton]}
                                onPress={() => {
                                    setShowCodeModal(false);
                                    setEnteredCode('');
                                }}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.codeModalButton, styles.continueButton]}
                                onPress={handleVerifyCode}
                            >
                                <Text style={styles.continueButtonText}>Continue</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const HEADER_HEIGHT = 90;

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: PRIMARY_BLUE,
    },
    container: {
        flex: 1,
        backgroundColor: '#F7F8FA',
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    header: {
        backgroundColor: PRIMARY_BLUE,
        paddingTop: Platform.OS === 'ios' ? 16 : 24,
        paddingBottom: 16,
        paddingHorizontal: 20,
        justifyContent: 'center',
        zIndex: 2,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 28,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    requestsOverlay: {
        position: 'absolute',
        top: HEADER_HEIGHT + 10,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(255,255,255,0.95)',
        marginHorizontal: 16,
        borderRadius: 12,
        padding: 12,
        zIndex: 3,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    requestsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
        color: PRIMARY_BLUE,
    },
    requestCard: {
        backgroundColor: '#f2f6ff',
        borderRadius: 8,
        padding: 10,
        marginBottom: 8,
    },
    requestText: {
        fontSize: 16,
        color: '#222',
    },
    requestButtons: {
        flexDirection: 'row',
        marginTop: 10,
        gap: 10,
    },
    acceptButton: {
        backgroundColor: PRIMARY_BLUE,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
        flex: 1,
    },
    acceptButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    declineButton: {
        backgroundColor: '#FF5E5E',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
        flex: 1,
    },
    declineButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    bottomContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: Platform.OS === 'ios' ? 24 : 16,
        alignItems: 'center',
        zIndex: 2,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    statusIcon: {
        marginRight: 8,
    },
    statusText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    toggleButton: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        width: '90%',
        marginBottom: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    toggleButtonOffline: {
        backgroundColor: '#F5F5F5',
        borderColor: '#E0E0E0',
    },
    toggleIcon: {
        marginRight: 8,
    },
    toggleText: {
        color: PRIMARY_BLUE,
        fontSize: 18,
        fontWeight: '600',
    },
    toggleTextOffline: {
        color: '#666',
    },
    statsRow: {
        flexDirection: 'row',
        width: '90%',
        justifyContent: 'space-between',
        marginBottom: 0,
    },
    statBox: {
        backgroundColor: '#fff',
        borderRadius: 12,
        flex: 1,
        alignItems: 'center',
        padding: 18,
        marginHorizontal: 6,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 1 },
        elevation: 1,
    },
    statValue: {
        color: PRIMARY_BLUE,
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    statLabel: {
        color: '#888',
        fontSize: 14,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    codeModalContainer: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 24,
        width: '90%',
        maxWidth: 400,
    },
    codeModalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
        textAlign: 'center',
    },
    codeModalSubtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 24,
        textAlign: 'center',
    },
    codeInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 16,
        fontSize: 24,
        textAlign: 'center',
        marginBottom: 24,
        letterSpacing: 8,
    },
    codeModalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    codeModalButton: {
        flex: 1,
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#f5f5f5',
    },
    continueButton: {
        backgroundColor: PRIMARY_BLUE,
    },
    cancelButtonText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '600',
    },
    continueButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default HomeScreen; 