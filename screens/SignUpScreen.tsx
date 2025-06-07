import React, { useState } from 'react';
import {
    View,
    TextInput,
    TouchableOpacity,
    Text,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/AuthNavigator';

const GENDERS = ['Male', 'Female', 'Prefer not to say'];

type SignUpScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'SignUp'>;

export default function SignUpScreen() {
    const navigation = useNavigation<SignUpScreenNavigationProp>();
    const [isLoading, setIsLoading] = useState(false);

    // Form state
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [vehicleMake, setVehicleMake] = useState('');
    const [vehicleModel, setVehicleModel] = useState('');
    const [vehicleYear, setVehicleYear] = useState('');
    const [licensePlate, setLicensePlate] = useState('');
    const [vehicleColor, setVehicleColor] = useState('');
    const [gender, setGender] = useState(GENDERS[0]);

    const validateForm = () => {
        if (!fullName.trim()) {
            Alert.alert('Error', 'Please enter your full name');
            return false;
        }
        if (!email.trim()) {
            Alert.alert('Error', 'Please enter your email');
            return false;
        }
        if (!password) {
            Alert.alert('Error', 'Please enter a password');
            return false;
        }
        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return false;
        }
        if (!vehicleMake.trim()) {
            Alert.alert('Error', 'Please enter your vehicle make');
            return false;
        }
        if (!vehicleModel.trim()) {
            Alert.alert('Error', 'Please enter your vehicle model');
            return false;
        }
        if (!vehicleYear.trim()) {
            Alert.alert('Error', 'Please enter your vehicle year');
            return false;
        }
        if (!licensePlate.trim()) {
            Alert.alert('Error', 'Please enter your license plate');
            return false;
        }
        if (!vehicleColor.trim()) {
            Alert.alert('Error', 'Please enter your vehicle color');
            return false;
        }
        return true;
    };

    const handleCreateAccount = async () => {
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        try {
            // Create user with Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Store additional user data in Firestore
            await setDoc(doc(db, 'drivers', user.uid), {
                fullName,
                email,
                gender,
                vehicle: {
                    make: vehicleMake,
                    model: vehicleModel,
                    year: vehicleYear,
                    plate: licensePlate,
                    color: vehicleColor
                },
                createdAt: new Date().toISOString()
            });

            // Navigate to ProfileScreen
            navigation.reset({
                index: 0,
                routes: [{ name: 'SignIn' }],
            });
        } catch (error: any) {
            let errorMessage = 'Failed to create account. Please try again.';
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'This email is already registered. Please use a different email.';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'Password is too weak. Please use a stronger password.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Invalid email address. Please enter a valid email.';
            }
            Alert.alert('Error', errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Create Account</Text>
                    </View>
                    
                    <TextInput
                        style={styles.input}
                        placeholder="Full Name *"
                        value={fullName}
                        onChangeText={setFullName}
                        placeholderTextColor="#888"
                    />
                    
                    <TextInput
                        style={styles.input}
                        placeholder="Student Email *"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        placeholderTextColor="#888"
                    />
                    
                    <TextInput
                        style={styles.input}
                        placeholder="Password *"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        placeholderTextColor="#888"
                    />
                    
                    <TextInput
                        style={styles.input}
                        placeholder="Confirm Password *"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry
                        placeholderTextColor="#888"
                    />
                    
                    <TextInput
                        style={styles.input}
                        placeholder="Vehicle Make *"
                        value={vehicleMake}
                        onChangeText={setVehicleMake}
                        placeholderTextColor="#888"
                    />
                    
                    <TextInput
                        style={styles.input}
                        placeholder="Vehicle Model *"
                        value={vehicleModel}
                        onChangeText={setVehicleModel}
                        placeholderTextColor="#888"
                    />
                    
                    <TextInput
                        style={styles.input}
                        placeholder="Vehicle Year *"
                        value={vehicleYear}
                        onChangeText={setVehicleYear}
                        keyboardType="numeric"
                        placeholderTextColor="#888"
                    />
                    
                    <TextInput
                        style={[styles.input, { textTransform: 'uppercase' }]}
                        placeholder="License Plate *"
                        value={licensePlate}
                        onChangeText={(text) => setLicensePlate(text.toUpperCase())}
                        placeholderTextColor="#888"
                    />
                    
                    <TextInput
                        style={styles.input}
                        placeholder="Vehicle Color *"
                        value={vehicleColor}
                        onChangeText={setVehicleColor}
                        placeholderTextColor="#888"
                    />
                    
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={gender}
                            onValueChange={(itemValue: string) => setGender(itemValue)}
                            style={styles.picker}
                        >
                            {GENDERS.map((g) => (
                                <Picker.Item key={g} label={g} value={g} />
                            ))}
                        </Picker>
                    </View>

                    <TouchableOpacity 
                        style={[styles.button, isLoading && styles.buttonDisabled]} 
                        onPress={handleCreateAccount}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Create Account</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
    },
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    header: {
        marginTop: 20,
        marginBottom: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#174EA6',
    },
    input: {
        backgroundColor: '#f6f6f6',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 16,
        marginBottom: 12,
        color: '#222',
    },
    pickerContainer: {
        backgroundColor: '#f6f6f6',
        borderRadius: 12,
        marginBottom: 12,
        overflow: 'hidden',
    },
    picker: {
        height: 50,
        width: '100%',
    },
    button: {
        backgroundColor: '#174EA6',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 8,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
}); 