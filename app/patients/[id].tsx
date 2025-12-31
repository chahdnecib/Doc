import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../api/supabase';
import { useTheme } from '../../api/ThemeContext';
import { ArrowLeft, Activity, Pill, AlertTriangle, ClipboardList } from 'lucide-react-native';

export default function MedicalRecordScreen() {
  const { id, name } = useLocalSearchParams();
  const router = useRouter();
  const { isDarkMode } = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    fetchMedicalData();
  }, [id]);

  const fetchMedicalData = async () => {
    try {
      // 1. Récupérer les infos de base (Allergies, Groupe Sanguin)
      const { data: recordData } = await supabase
        .from('medical_records')
        .select('*')
        .eq('patient_id', id)
        .single();
      
      // 2. Récupérer l'historique des consultations
      const { data: historyData } = await supabase
        .from('appointments')
        .select('*')
        .eq('patient_id', id)
        .order('appointment_date', { ascending: false });

      setRecord(recordData);
      setHistory(historyData || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const themeStyles = {
    container: { backgroundColor: isDarkMode ? '#121212' : '#F8F9FA' },
    card: { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFF' },
    text: { color: isDarkMode ? '#FFF' : '#333' },
  };

  if (loading) return <ActivityIndicator style={{flex: 1}} color="#246BFD" />;

  return (
    <ScrollView style={[styles.container, themeStyles.container]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><ArrowLeft color={themeStyles.text.color} /></TouchableOpacity>
        <Text style={[styles.title, themeStyles.text]}>Dossier Médical</Text>
      </View>

      {/* Carte Patient (Vitals) */}
      <View style={[styles.patientInfoCard, themeStyles.card]}>
        <Text style={[styles.patientName, themeStyles.text]}>{name}</Text>
        <View style={styles.vitalsRow}>
          <View style={styles.vitalItem}>
            <Activity size={18} color="#FF4D4D" />
            <Text style={themeStyles.text}>Gr. Sanguin: {record?.blood_type || 'N/A'}</Text>
          </View>
          <View style={styles.vitalItem}>
            <AlertTriangle size={18} color="#FFD700" />
            <Text style={themeStyles.text}>Allergies: {record?.allergies || 'Aucune'}</Text>
          </View>
        </View>
      </View>

      {/* Section Historique */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <ClipboardList size={20} color="#246BFD" />
          <Text style={[styles.sectionTitle, themeStyles.text]}>Consultations Passées</Text>
        </View>

        {history.map((item, index) => (
          <View key={index} style={[styles.historyItem, themeStyles.card]}>
            <Text style={styles.dateText}>{item.appointment_date}</Text>
            <Text style={[styles.diagnosisTitle, themeStyles.text]}>Diagnostic :</Text>
            <Text style={styles.descriptionText}>{item.notes || "Pas de compte-rendu."}</Text>
            {item.prescription && (
              <View style={styles.prescriptionTag}>
                <Pill size={14} color="#246BFD" />
                <Text style={styles.prescriptionText}>Ordonnance délivrée</Text>
              </View>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 15, marginTop: 40, marginBottom: 25 },
  title: { fontSize: 22, fontWeight: 'bold' },
  patientInfoCard: { padding: 20, borderRadius: 20, elevation: 3 },
  patientName: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  vitalsRow: { gap: 10 },
  vitalItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  section: { marginTop: 30 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  historyItem: { padding: 15, borderRadius: 15, marginBottom: 15, borderLeftWidth: 4, borderLeftColor: '#246BFD' },
  dateText: { color: '#246BFD', fontWeight: 'bold', marginBottom: 5 },
  diagnosisTitle: { fontSize: 14, fontWeight: '600', marginTop: 5 },
  descriptionText: { color: '#666', marginTop: 4, fontSize: 14 },
  prescriptionTag: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10, backgroundColor: '#F0F5FF', padding: 5, borderRadius: 5, alignSelf: 'flex-start' },
  prescriptionText: { color: '#246BFD', fontSize: 12, fontWeight: '600' }
});