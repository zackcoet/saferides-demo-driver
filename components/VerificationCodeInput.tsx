import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    TextInput,
    StyleSheet,
    Text,
    Animated,
    TouchableOpacity,
    Platform,
} from 'react-native';

interface VerificationCodeInputProps {
    onCodeComplete: (code: string) => void;
    onVerify: () => void;
    error?: string;
}

const VerificationCodeInput: React.FC<VerificationCodeInputProps> = ({
    onCodeComplete,
    onVerify,
    error,
}) => {
    const [code, setCode] = useState(['', '', '', '']);
    const inputRefs = useRef<Array<TextInput | null>>([]);
    const shakeAnimation = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (error) {
            // Shake animation
            Animated.sequence([
                Animated.timing(shakeAnimation, {
                    toValue: 10,
                    duration: 100,
                    useNativeDriver: true,
                }),
                Animated.timing(shakeAnimation, {
                    toValue: -10,
                    duration: 100,
                    useNativeDriver: true,
                }),
                Animated.timing(shakeAnimation, {
                    toValue: 10,
                    duration: 100,
                    useNativeDriver: true,
                }),
                Animated.timing(shakeAnimation, {
                    toValue: 0,
                    duration: 100,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [error]);

    const handleCodeChange = (text: string, index: number) => {
        const newCode = [...code];
        newCode[index] = text;
        setCode(newCode);

        // Auto-focus next input
        if (text && index < 3) {
            inputRefs.current[index + 1]?.focus();
        }

        // Check if all digits are entered
        if (newCode.every(digit => digit !== '')) {
            onCodeComplete(newCode.join(''));
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    return (
        <Animated.View style={[
            styles.container,
            { transform: [{ translateX: shakeAnimation }] }
        ]}>
            <Text style={styles.label}>Enter rider's 4-digit verification code</Text>
            <View style={styles.inputContainer}>
                {[0, 1, 2, 3].map((index) => (
                    <TextInput
                        key={index}
                        ref={(ref) => {
                            inputRefs.current[index] = ref;
                        }}
                        style={[
                            styles.input,
                            error && styles.inputError,
                            code[index] && styles.inputFilled
                        ]}
                        maxLength={1}
                        keyboardType="number-pad"
                        value={code[index]}
                        onChangeText={(text) => handleCodeChange(text, index)}
                        onKeyPress={(e) => handleKeyPress(e, index)}
                        selectTextOnFocus
                        autoFocus={index === 0}
                    />
                ))}
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
            {code.every(digit => digit !== '') && (
                <TouchableOpacity
                    style={styles.verifyButton}
                    onPress={onVerify}
                >
                    <Text style={styles.verifyButtonText}>Verify</Text>
                </TouchableOpacity>
            )}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        padding: 20,
    },
    label: {
        fontSize: 16,
        color: '#666',
        marginBottom: 16,
        textAlign: 'center',
    },
    inputContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
    },
    input: {
        width: 50,
        height: 50,
        borderWidth: 2,
        borderColor: '#E0E0E0',
        borderRadius: 12,
        fontSize: 24,
        textAlign: 'center',
        color: '#333',
        backgroundColor: '#fff',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    inputFilled: {
        borderColor: '#0A3AFF',
        backgroundColor: '#F0F4FF',
    },
    inputError: {
        borderColor: '#FF3B30',
    },
    errorText: {
        color: '#FF3B30',
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
    },
    verifyButton: {
        backgroundColor: '#0A3AFF',
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 8,
        marginTop: 20,
    },
    verifyButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default VerificationCodeInput; 