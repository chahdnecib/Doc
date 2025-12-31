import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { supabase } from '../../api/supabase'; // Import direct depuis la racine

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      Alert.alert('Erreur de connexion', error.message);
      setLoading(false);
    } else {
      setLoading(false);
      router.replace('/(tabs)'); // Redirection vers l'accueil
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Se connecter</Text>

      <View style={styles.form}>
        <Text style={styles.label}>Adresse Email</Text>
        <View style={styles.inputContainer}>
          <Mail size={20} color="#9E9E9E" style={styles.inputIcon} />
          <TextInput 
            style={styles.input} 
            placeholder="votre@email.com" 
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />
        </View>

        <Text style={styles.label}>Mot de passe</Text>
        <View style={styles.inputContainer}>
          <Lock size={20} color="#9E9E9E" style={styles.inputIcon} />
          <TextInput 
            style={styles.input} 
            placeholder="Entrez votre mot de passe" 
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            {showPassword ? <EyeOff size={20} color="#9E9E9E" /> : <Eye size={20} color="#9E9E9E" />}
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginButtonText}>Connexion</Text>}
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => router.push('/(auth)/register')} style={styles.footer}>
        <Text style={styles.footerText}>Pas encore de compte ? <Text style={styles.link}>S'inscrire</Text></Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 25, justifyContent: 'center' },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#246BFD', textAlign: 'center', marginBottom: 40 },
  form: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', borderRadius: 12, paddingHorizontal: 15, marginBottom: 20, borderWidth: 1, borderColor: '#EEE' },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, height: 55, color: '#333' },
  loginButton: { backgroundColor: '#246BFD', height: 55, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  loginButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  footer: { marginTop: 20, alignItems: 'center' },
  footerText: { color: '#9E9E9E' },
  link: { color: '#246BFD', fontWeight: 'bold' }
});