import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    ImageBackground,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import PrimaryButton from '../components/PrimaryButton';

export default function SignupScreen({ navigation }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    return (
        <ImageBackground
            source={require('../assets/solar_bg.jpg')}
            style={styles.background}
            resizeMode="cover"
        >
            <LinearGradient
                colors={[
                    'rgba(46,125,50,0.15)',
                    'rgba(46,125,50,0.30)',
                ]}
                style={styles.overlay}
            />

            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <View style={styles.card}>
                    <Text style={styles.title}>Create account</Text>
                    <Text style={styles.subtitle}>
                        Start your solar savings journey with Sunlytics
                    </Text>

                    <TextInput
                        placeholder="Name"
                        placeholderTextColor="#777"
                        style={styles.input}
                        autoCapitalize="words"
                        value={name}
                        onChangeText={setName}
                    />

                    <TextInput
                        placeholder="Email"
                        placeholderTextColor="#777"
                        style={styles.input}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                    />

                    {/* Password */}
                    <View style={styles.passwordWrapper}>
                        <TextInput
                            placeholder="Password"
                            placeholderTextColor="#777"
                            style={styles.passwordInput}
                            secureTextEntry={!showPassword}
                            value={password}
                            onChangeText={setPassword}
                        />
                        <TouchableOpacity
                            onPress={() => setShowPassword(!showPassword)}
                        >
                            <Text style={styles.eye}>
                                {showPassword ? '🙈' : '👁️'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View style={{ marginTop: 6 }}>
                        <PrimaryButton
                            title="Sign Up"
                            onPress={() => navigation.replace('Home')}
                        />
                    </View>

                    <Text
                        style={styles.link}
                        onPress={() => navigation.navigate('Login')}
                    >
                        Already have an account?{' '}
                        <Text style={styles.linkBold}>Login</Text>
                    </Text>
                </View>
            </KeyboardAvoidingView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
    },

    overlay: {
        ...StyleSheet.absoluteFillObject,
    },

    container: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 20,
    },

    card: {
        backgroundColor: 'rgba(255,255,255,0.80)',
        borderRadius: 24,
        paddingVertical: 20,
        paddingHorizontal: 20,
        shadowColor: '#000',
        shadowOpacity: 0.18,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 8,
    },

    title: {
        fontSize: 26,
        fontWeight: '800',
        marginBottom: 6,
        color: '#111',
    },

    subtitle: {
        fontSize: 14,
        color: '#555',
        marginBottom: 20,
    },

    input: {
        backgroundColor: 'rgba(244,246,245,0.9)',
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 16,
        marginBottom: 14,
        fontSize: 15,
        color: '#111',
    },

    passwordWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(244,246,245,0.9)',
        borderRadius: 14,
        paddingHorizontal: 16,
    },

    passwordInput: {
        flex: 1,
        paddingVertical: 14,
        fontSize: 15,
        color: '#111',
    },

    eye: {
        fontSize: 16,
        opacity: 0.45,
    },

    link: {
        marginTop: 18,
        textAlign: 'center',
        color: '#555',
    },

    linkBold: {
        color: '#2e7d32',
        fontWeight: '700',
    },
});
