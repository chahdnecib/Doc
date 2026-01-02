import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image, StatusBar } from 'react-native';

export function SplashView() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Animated.View style={[styles.logoContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <Image 
          source={require('../assets/images/logo.png')} 
          style={styles.logoImage}
          resizeMode="contain"
        />
        <Text style={styles.tagline}>Votre santé, simplement.</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#5D91FF', justifyContent: 'center', alignItems: 'center' },
  logoContainer: { alignItems: 'center' },
  logoImage: { width: 180, height: 180, marginBottom: 20 },
  tagline: { color: '#fff', fontSize: 18, fontWeight: '600', opacity: 0.9 },
});