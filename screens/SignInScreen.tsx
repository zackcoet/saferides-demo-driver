import React, { useState } from 'react';
import {
    View,
    TextInput,
    TouchableOpacity,
    Text,
    StyleSheet,
    Alert,
} from 'react-native';
import { useAuth } from '../services/AuthContext';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/AuthNavigator';

type SignInScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'SignIn'>;

export default function SignInScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { signIn } = useAuth();
    const navigation = useNavigation<SignInScreenNavigationProp>();

    const handleSignIn = async () => {
        try {
            await signIn(email, password);
        } catch (error) {
            Alert.alert('Error', 'Failed to sign in. Please check your credentials.');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Sign In</Text>
            <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
            />
            <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />
            <TouchableOpacity style={styles.button} onPress={handleSignIn}>
                <Text style={styles.buttonText}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity 
                style={styles.signUpButton} 
                onPress={() => navigation.navigate('SignUp')}
            >
                <Text style={styles.signUpButtonText}>Don't have an account? Sign Up</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 30,
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
    signUpButton: {
        marginTop: 16,
        alignItems: 'center',
    },
    signUpButtonText: {
        color: '#174EA6',
        fontSize: 16,
    },
}); 