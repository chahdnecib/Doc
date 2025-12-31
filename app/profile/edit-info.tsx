import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../api/supabase';
import { User, Phone, Briefcase, Save, ArrowLeft } from 'lucide-react-native';

export default function EditInfoScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ full_name: '', phone: '', specialty: '' });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) setFormData({ 
        full_name: data.full_name || '', 
        phone: data.phone || '', 
        specialty: data.specialty || '' 
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('profiles').update(formData).eq('id', user?.id);
    
    if (!error) {
      Alert.alert("Succès", "Profil mis à jour");
      router.back();
    } else {
      Alert.alert("Erreur", "Échec de la mise à jour");
    }
    setSaving(false);
  };

  if (loading) return <ActivityIndicator style={{flex: 1}} color="#246BFD" />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><ArrowLeft color="#333" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Modifier Infos</Text>
        <View style={{width: 24}} />
      </View>

      <View style={styles.form}>
        <InputField label="Nom complet" icon={User} value={formData.full_name} 
          onChange={(val) => setFormData({...formData, full_name: val})} />
        
        <InputField label="Spécialité" icon={Briefcase} value={formData.specialty} 
          onChange={(val) => setFormData({...formData, specialty: val})} />

        <InputField label="Téléphone" icon={Phone} value={formData.phone} keyboard="phone-pad"
          onChange={(val) => setFormData({...formData, phone: val})} />

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Enregistrer</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const InputField = ({ label, icon: Icon, value, onChange, keyboard = 'default' }: any) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inputContainer}>
      <Icon size={20} color="#666" />
      <TextInput value={value} onChangeText={onChange} style={styles.input} keyboardType={keyboard} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF', padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 40, marginBottom: 30 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  form: { gap: 20 },
  inputGroup: { gap: 8 },
  label: { fontSize: 14, fontWeight: '600', color: '#666' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', padding: 15, borderRadius: 15, borderWidth: 1, borderColor: '#EEE' },
  input: { flex: 1, marginLeft: 10, fontSize: 16 },
  saveBtn: { backgroundColor: '#246BFD', padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 10 },
  saveText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});