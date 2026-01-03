import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView 
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../api/supabase';
import { User, Phone, Briefcase, ArrowLeft } from 'lucide-react-native';

interface FormData {
  full_name: string;
  phone: string;
  specialty: string;
}

interface InputFieldProps {
  label: string;
  icon: any;
  value: string;
  onChange: (text: string) => void;
  keyboard?: 'default' | 'phone-pad' | 'email-address' | 'numeric';
}

export default function EditInfoScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null); // Pour stocker 'doctor' ou 'patient'
  const [formData, setFormData] = useState<FormData>({ 
    full_name: '', 
    phone: '', 
    specialty: '' 
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, phone, specialty, role') // On récupère aussi le rôle
          .eq('id', user.id)
          .single();

        if (error) throw error;

        if (data) {
          setUserRole(data.role); // On stocke le rôle ('doctor' ou 'patient')
          setFormData({ 
            full_name: data.full_name || '', 
            phone: data.phone || '', 
            specialty: data.specialty || '' 
          });
        }
      }
    } catch (error) {
      console.error("Erreur profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          // On n'envoie la spécialité que si c'est un docteur
          ...(userRole === 'doctor' && { specialty: formData.specialty })
        })
        .eq('id', user.id);
      
      if (error) throw error;
      Alert.alert("Succès", "Profil mis à jour");
      router.back();
    } catch (error) {
      Alert.alert("Erreur", "Échec de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <ActivityIndicator style={{flex: 1}} color="#246BFD" />;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}><ArrowLeft color="#333" size={24} /></TouchableOpacity>
          <Text style={styles.headerTitle}>Modifier Profil</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.form}>
          <InputField 
            label="Nom complet" 
            icon={User} 
            value={formData.full_name} 
            onChange={(val) => setFormData({...formData, full_name: val})} 
          />
          
          {/* CONDITION : On affiche seulement si le rôle est 'doctor' */}
          {userRole === 'doctor' && (
            <InputField 
              label="Spécialité" 
              icon={Briefcase} 
              value={formData.specialty} 
              onChange={(val) => setFormData({...formData, specialty: val})} 
            />
          )}

          <InputField 
            label="Téléphone" 
            icon={Phone} 
            value={formData.phone} 
            keyboard="phone-pad"
            onChange={(val) => setFormData({...formData, phone: val})} 
          />

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Enregistrer</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const InputField = ({ label, icon: Icon, value, onChange, keyboard = 'default' }: InputFieldProps) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inputContainer}>
      <Icon size={20} color="#246BFD" />
      <TextInput value={value} onChangeText={onChange} style={styles.input} keyboardType={keyboard} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF', padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 40, marginBottom: 30 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  form: { gap: 20 },
  inputGroup: { gap: 8 },
  label: { fontSize: 14, fontWeight: '600', color: '#666' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', padding: 15, borderRadius: 15, borderWidth: 1, borderColor: '#EEE' },
  input: { flex: 1, marginLeft: 10, fontSize: 16 },
  saveBtn: { backgroundColor: '#246BFD', padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 20 },
  saveText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});