import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';
import { useRouter } from 'expo-router';

export default function SplashScreen() {
  const router = useRouter();
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8); // Pour un petit effet de zoom au début

  useEffect(() => {
    // Animation d'apparition (Opacité + Zoom)
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      })
    ]).start();

    // Redirection vers le Login après 2.5 secondes
    const timer = setTimeout(() => {
      router.replace('/(auth)/login');
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.logoContainer, 
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
        ]}
      >
        {/* L'IMAGE DU LOGO */}
        <Image 
          source={require('../assets/images/logo.png')} // Vérifiez bien le nom du fichier
          style={styles.logoImage}
          resizeMode="contain"
        />
        
        {/* Slogan sous l'image */}
        <Text style={styles.tagline}>Votre santé, simplement.</Text>
      </Animated.View>
    </View>
  );
}


const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#5D91FF', // Bleu identique à votre maquette
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  logoContainer: { 
    alignItems: 'center' 
  },
  logoImage: { 
    width: 200,  // Ajustez la taille selon votre image
    height: 200, 
    marginBottom: 20 
  },
  tagline: { 
    color: '#fff', 
    marginTop: 10, 
    fontSize: 18, 
    fontWeight: '500',
    opacity: 0.9 
  },
});