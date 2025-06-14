import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TouchableWithoutFeedback,
    Keyboard,
    Linking,
    StatusBar
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { doc, onSnapshot, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import VerificationCodeInput from '../components/VerificationCodeInput';

type RideDetailsRouteProp = RouteProp<RootStackParamList, 'RideDetails'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const PRIMARY_BLUE = '#174EA6';

const RideDetailsScreen = () => {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<RideDetailsRouteProp>();
    const { ride } = route.params;
    
    const [pickupCode, setPickupCode] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isCodeVerified, setIsCodeVerified] = useState(false);
    const [codeError, setCodeError] = useState('');

    // Fetch pickup code
    useEffect(() => {
        const rideRef = doc(db, 'rides', ride.id);
        const unsubscribe = onSnapshot(rideRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                const code = data.pickupCode?.toString() || null;
                setPickupCode(code);
            }
        });

        return () => unsubscribe();
    }, [ride.id]);

    const handleCodeComplete = (code: string) => {
        setCodeError('');
        setIsCodeVerified(false);
    };

    const handleVerifyCode = () => {
        if (!pickupCode) {
            setCodeError('No pickup code available');
            return;
        }

        const trimmedPickupCode = pickupCode.trim();
        
        console.log('Comparing codes:', {
            pickup: trimmedPickupCode
        });

        if (trimmedPickupCode) {
            setIsCodeVerified(true);
            setCodeError('');
            Keyboard.dismiss();
        } else {
            setCodeError('Incorrect code. Ask rider for the correct code.');
            setIsCodeVerified(false);
        }
    };

    const handlePickedUpRider = async () => {
        if (!isCodeVerified) return;

        try {
            setIsLoading(true);
            
            // Get latest ride data
            const rideRef = doc(db, 'rides', ride.id);
            const rideSnap = await getDoc(rideRef);
            
            if (!rideSnap.exists()) {
                console.error('Ride not found');
                Alert.alert('Error', 'Ride not found.');
                return;
            }

            const rideData = rideSnap.data();
            const { pickupLocation, dropoffLocation, dropoff } = rideData;

            // Validate pickup coordinates
            if (!pickupLocation?.latitude || !pickupLocation?.longitude) {
                console.error('Missing pickup coordinates', pickupLocation);
                Alert.alert('Error', 'Missing pickup coordinates.');
                return;
            }

            // Check drop-off location format
            const hasDropoffCoords = !!dropoffLocation?.latitude;
            const hasDropoffAddress = typeof dropoffLocation === 'string';

            if (!hasDropoffCoords && !hasDropoffAddress) {
                console.error('Missing drop-off location', dropoffLocation);
                Alert.alert('Error', 'Missing drop-off location.');
                return;
            }

            // Log navigation data
            console.log('Navigating to DropOffScreen with data:', {
                rideId: ride.id,
                pickupLocation,
                dropoffLocation: hasDropoffCoords ? dropoffLocation : null,
                dropoffAddress: hasDropoffAddress ? dropoffLocation : dropoff ?? '',
            });

            // Update ride status
            await updateDoc(rideRef, {
                status: 'in_progress'
            });

            // Navigate with validated data
            navigation.replace('DropOffScreen', {
                rideId: ride.id,
                pickupLocation,
                dropoffLocation: hasDropoffCoords ? dropoffLocation : null,
                dropoffAddress: hasDropoffAddress ? dropoffLocation : dropoff ?? '',
            });
        } catch (error) {
            console.error('Error updating ride status:', error);
            Alert.alert('Error', 'Failed to update ride status');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={{flex: 1, backgroundColor: '#0A3AFF'}}>
            <StatusBar barStyle="light-content" backgroundColor="#0A3AFF" />
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoid}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <ScrollView 
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={styles.card}>
                            {/* Pickup Location */}
                            <View style={styles.locationRow}>
                                <Ionicons name="location" size={24} color={PRIMARY_BLUE} />
                                <View style={styles.locationText}>
                                    <Text style={styles.locationLabel}>Pickup</Text>
                                    <Text style={styles.locationValue}>
                                        {ride.pickupAddress || 'Location not available'}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.divider} />

                            {/* Rider Information */}
                            <View style={styles.infoSection}>
                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>Name</Text>
                                    <Text style={styles.infoValue}>{ride.riderName || '—'}</Text>
                                </View>
                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>Phone</Text>
                                    {ride.riderPhone ? (
                                        <TouchableOpacity onPress={() => Linking.openURL(`tel:${ride.riderPhone}`)}>
                                            <Text style={styles.infoValueLink}>{ride.riderPhone}</Text>
                                        </TouchableOpacity>
                                    ) : (
                                        <Text style={styles.infoValue}>—</Text>
                                    )}
                                </View>
                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>Gender</Text>
                                    <Text style={styles.infoValue}>{ride.riderGender || '—'}</Text>
                                </View>
                            </View>

                            <View style={styles.divider} />

                            {/* Code Input Section */}
                            <VerificationCodeInput
                                onCodeComplete={handleCodeComplete}
                                onVerify={handleVerifyCode}
                                error={codeError}
                            />

                            {/* Picked Up Button - Only show after verification */}
                            {isCodeVerified && (
                                <TouchableOpacity
                                    style={[
                                        styles.pickedUpButton,
                                        isLoading && styles.disabledButton
                                    ]}
                                    onPress={handlePickedUpRider}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <Text style={styles.buttonText}>Picked Up Rider</Text>
                                    )}
                                </TouchableOpacity>
                            )}
                        </View>
                    </ScrollView>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    outerContainer: {
        flex: 1,
        backgroundColor: PRIMARY_BLUE,
    },
    keyboardAvoid: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 16,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
        marginHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    locationText: {
        marginLeft: 12,
        flex: 1,
    },
    locationLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 2,
    },
    locationValue: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: '#eee',
        marginVertical: 20,
    },
    infoSection: {
        marginBottom: 8,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 4,
    },
    infoLabel: {
        fontSize: 16,
        color: '#666',
        flex: 1,
    },
    infoValue: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
        flex: 1,
        textAlign: 'right',
    },
    infoValueLink: {
        fontSize: 16,
        color: PRIMARY_BLUE,
        fontWeight: '500',
        flex: 1,
        textAlign: 'right',
        textDecorationLine: 'underline',
    },
    codeTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
        textAlign: 'center',
    },
    codeInput: {
        fontSize: 32,
        textAlign: 'center',
        letterSpacing: 12,
        borderBottomWidth: 2,
        borderColor: PRIMARY_BLUE,
        paddingVertical: 12,
        marginBottom: 8,
        backgroundColor: '#f8fafc',
        borderRadius: 8,
    },
    helperText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 8,
    },
    errorText: {
        fontSize: 14,
        color: '#dc2626',
        textAlign: 'center',
        marginBottom: 16,
    },
    submitButton: {
        backgroundColor: PRIMARY_BLUE,
        height: 48,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
    },
    pickedUpButton: {
        backgroundColor: PRIMARY_BLUE,
        height: 48,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
    },
    disabledButton: {
        opacity: 0.35,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default RideDetailsScreen; 