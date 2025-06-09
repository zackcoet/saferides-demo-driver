import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    LayoutAnimation,
    Platform,
    UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

interface FAQItem {
    question: string;
    answer: string;
}

interface FAQDropdownProps {
    title: string;
    items: FAQItem[];
}

const FAQDropdown: React.FC<FAQDropdownProps> = ({ title, items }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [rotateAnimation] = useState(new Animated.Value(0));

    const toggleExpand = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsExpanded(!isExpanded);
        Animated.timing(rotateAnimation, {
            toValue: isExpanded ? 0 : 1,
            duration: 300,
            useNativeDriver: true,
        }).start();
    };

    const rotate = rotateAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg'],
    });

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.header}
                onPress={toggleExpand}
                activeOpacity={0.7}
            >
                <Text style={styles.title}>{title}</Text>
                <Animated.View style={{ transform: [{ rotate }] }}>
                    <Ionicons name="chevron-down" size={24} color="#0A3AFF" />
                </Animated.View>
            </TouchableOpacity>

            {isExpanded && (
                <View style={styles.content}>
                    {items.map((item, index) => (
                        <View key={index} style={styles.item}>
                            <Text style={styles.question}>{item.question}</Text>
                            <Text style={styles.answer}>{item.answer}</Text>
                            {index < items.length - 1 && <View style={styles.divider} />}
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        borderRadius: 12,
        marginHorizontal: 16,
        marginVertical: 8,
        overflow: 'hidden',
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#F8F9FA',
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#0A3AFF',
    },
    content: {
        padding: 16,
    },
    item: {
        marginBottom: 16,
    },
    question: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    answer: {
        fontSize: 15,
        color: '#666',
        lineHeight: 22,
    },
    divider: {
        height: 1,
        backgroundColor: '#E0E0E0',
        marginVertical: 16,
    },
});

export default FAQDropdown; 