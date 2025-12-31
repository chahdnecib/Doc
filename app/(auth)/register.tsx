import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Stethoscope,
} from 'lucide-react-native';

// 1. IMPORTATION DE SUPABASE
import { supabase } from '../../api/supabase';

export default function RegisterScreen() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'patient' | 'doctor'>('patient');
  const [specialty, setSpecialty] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const isFormValid = () => {
    if (!fullName.trim() || !email.trim() || !password.trim()) return false;
    if (role === 'doctor' && (!specialty.trim() || !licenseNumber.trim())) return false;
    return true;
  };

  // 2. LOGIQUE D'INSERTION SUPABASE
  const handleRegister = async () => {
    if (!isFormValid()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);

    try {
      // ÉTAPE A : Créer l'utilisateur dans Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            full_name: fullName,
            role: role,
          },
        },
      });

      if (authError) throw authError;

      // ÉTAPE B : Insérer les infos complémentaires dans la table 'profiles'
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: authData.user.id, // Lien direct avec l'ID d'authentification
              full_name: fullName,
              phone: phone,
              role: role,
              specialty: role === 'doctor' ? specialty : null,
              license_number: role === 'doctor' ? licenseNumber : null,
            },
          ]);

        if (profileError) throw profileError;
      }

      Alert.alert(
        'Succès !',
        'Votre compte a été créé. Vous pouvez maintenant vous connecter.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
      );

    } catch (error: any) {
      Alert.alert('Erreur d\'inscription', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.headerTitle}>Créer un compte</Text>
        <Text style={styles.headerSubtitle}>Rejoignez DOC pour gérer votre santé</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Vous êtes :</Text>
          <View style={styles.roleButtons}>
            <TouchableOpacity
              style={[styles.roleButton, role === 'patient' && styles.roleButtonActive]}
              onPress={() => setRole('patient')}
            >
              <Text style={[styles.roleButtonText, role === 'patient' && styles.roleButtonTextActive]}>
                Patient
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.roleButton, role === 'doctor' && styles.roleButtonActive]}
              onPress={() => setRole('doctor')}
            >
              <Text style={[styles.roleButtonText, role === 'doctor' && styles.roleButtonTextActive]}>
                Docteur
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Nom Complet *</Text>
          <View style={styles.inputContainer}>
            <User size={20} color="#9E9E9E" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Ex: Jean Dupont"
              value={fullName}
              onChangeText={setFullName}
            />
          </View>

          <Text style={styles.label}>Adresse Email *</Text>
          <View style={styles.inputContainer}>
            <Mail size={20} color="#9E9E9E" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="votre@email.com"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
            />
          </View>

          <Text style={styles.label}>Numéro de téléphone</Text>
          <View style={styles.inputContainer}>
            <Phone size={20} color="#9E9E9E" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="+213 XXXXXXXX"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
          </View>

          {role === 'doctor' && (
            <>
              <Text style={styles.label}>Spécialité *</Text>
              <View style={styles.inputContainer}>
                <Stethoscope size={20} color="#9E9E9E" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Cardiologue, Généraliste..."
                  value={specialty}
                  onChangeText={setSpecialty}
                />
              </View>

              <Text style={styles.label}>Numéro d'ordre / Licence *</Text>
              <View style={styles.inputContainer}>
                <Lock size={20} color="#9E9E9E" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Numéro d'ordre médical"
                  value={licenseNumber}
                  onChangeText={setLicenseNumber}
                />
              </View>
            </>
          )}

          <Text style={styles.label}>Mot de passe *</Text>
          <View style={styles.inputContainer}>
            <Lock size={20} color="#9E9E9E" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Créer un mot de passe sécurisé"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff size={20} color="#9E9E9E" /> : <Eye size={20} color="#9E9E9E" />}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.registerButton,
              (!isFormValid() || loading) && styles.registerButtonDisabled,
            ]}
            onPress={handleRegister}
            disabled={!isFormValid() || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.registerButtonText}>S'inscrire</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => router.back()} style={styles.footer}>
          <Text style={styles.footerText}>
            Déjà un compte ? <Text style={styles.loginLink}>Se connecter</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Les styles restent identiques à votre code d'origine...
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { padding: 25, paddingTop: 50 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#246BFD', marginBottom: 10 },
  headerSubtitle: { fontSize: 16, color: '#9E9E9E', marginBottom: 30 },
  form: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, height: 55, color: '#333' },
  roleButtons: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  roleButton: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingVertical: 16,
    borderRadius: 12,
    marginHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEE',
  },
  roleButtonActive: {
    backgroundColor: '#246BFD',
    borderColor: '#246BFD',
  },
  roleButtonText: { fontSize: 16, fontWeight: '600', color: '#333' },
  roleButtonTextActive: { color: '#fff' },
  registerButton: {
    backgroundColor: '#246BFD',
    height: 55,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    elevation: 2,
  },
  registerButtonDisabled: { backgroundColor: '#A0C4FF', elevation: 0 },
  registerButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  footer: { marginTop: 20, alignItems: 'center' },
  footerText: { color: '#9E9E9E', fontSize: 14 },
  loginLink: { color: '#246BFD', fontWeight: 'bold' },
});