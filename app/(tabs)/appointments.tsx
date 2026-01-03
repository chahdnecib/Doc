import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  Linking, ActivityIndicator, TextInput, Alert, KeyboardAvoidingView, Platform 
} from 'react-native';
import { Video, Calendar, Clock, Save, FileEdit } from 'lucide-react-native';
import { supabase } from '../../api/supabase';
import { appointmentService } from '../../api/appointmentService';

export default function DoctorAppointments() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [doctorProfile, setDoctorProfile] = useState<any>(null);
  const [localNotes, setLocalNotes] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchDoctorData();
  }, []);

  const fetchDoctorData = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: prof } = await supabase.from('profiles').select('full_name').eq('id', user?.id).single();
    setDoctorProfile(prof);

    // RÉCUPÉRATION DE LA DATE DU JOUR (Format YYYY-MM-DD)
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('doctor_id', user?.id)
      .gte('appointment_date', today) // FILTRE : Date supérieure ou égale à aujourd'hui
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true }); // Trié par jour puis par heure
    
    if (error) throw error;
    setAppointments(data || []);

    const initialNotes: { [key: string]: string } = {};
    data?.forEach(app => { initialNotes[app.id] = app.notes || ""; });
    setLocalNotes(initialNotes);
  } catch (e) {
    console.error(e);
  } finally {
    setLoading(false);
  }
};

  const handleStartCall = async (appointment: any) => {
  try {
    // .replace(/-/g, '') supprime TOUS les tirets de l'UUID
    const cleanId = appointment.id.replace(/-/g, '');
    const meetUrl = `https://meet.jit.si/RDV${cleanId}`; 

    await appointmentService.updateStatus(appointment.id, 'in_progress');

    // On insère l'URL propre dans la table notifications
    await supabase.from('notifications').insert([{
      patient_id: appointment.patient_id,
      doctor_name: doctorProfile?.full_name || "Votre docteur",
      zoom_url: meetUrl 
    }]);

    Linking.openURL(meetUrl);
    fetchDoctorData();
  } catch (error) {
    Alert.alert("Erreur", "Impossible de lancer l'appel.");
  }
};

  const handleSaveNotes = async (appointmentId: string) => {
    try {
      const { error } = await supabase.from('appointments').update({ notes: localNotes[appointmentId] }).eq('id', appointmentId);
      if (error) throw error;
      Alert.alert("Succès", "Notes enregistrées.");
    } catch (error) {
      Alert.alert("Erreur", "Sauvegarde échouée.");
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const isTeleconsul = item.type === 'teleconsultation';
    const isInProgress = item.status === 'in_progress';

    return (
      <View style={styles.apptCard}>
        <View style={styles.apptHeader}>
          <View style={styles.row}>
            <Calendar size={14} color="#666" /><Text style={styles.headerText}>{item.appointment_date}</Text>
          </View>
          <View style={[styles.row, { marginLeft: 15 }]}>
            <Clock size={14} color="#666" /><Text style={styles.headerText}>{item.appointment_time?.slice(0, 5)}</Text>
          </View>
          <View style={{ flex: 1 }} />
          <View style={[styles.statusBadge, isInProgress && styles.statusBadgeLive]}>
            <Text style={[styles.statusText, isInProgress && { color: '#2ECC71' }]}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.apptDivider} />

        <View style={styles.apptBody}>
          <View style={{ flex: 1 }}>
            <Text style={styles.patientName}>{item.patient_name || "Patient"}</Text>
            <Text style={styles.typeText}>{isTeleconsul ? "🌐 Meet" : "🏥 Cabinet"}</Text>
          </View>

          {isTeleconsul && (
            <TouchableOpacity 
              style={[styles.btnVideo, isInProgress && { backgroundColor: '#2ECC71' }]} 
              onPress={() => handleStartCall(item)}
            >
              <Video size={18} color="#FFF" />
              <Text style={styles.btnText}>{isInProgress ? 'En direct' : 'Lancer Meet'}</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.notesContainer}>
          <TextInput
            style={styles.notesInput}
            placeholder="Observations médicales..."
            multiline
            value={localNotes[item.id]}
            onChangeText={(text) => setLocalNotes({ ...localNotes, [item.id]: text })}
          />
          <TouchableOpacity style={styles.saveBtn} onPress={() => handleSaveNotes(item.id)}>
            <Save size={14} color="#FFF" /><Text style={styles.saveBtnText}>Enregistrer la note</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <View style={styles.headerWrapper}><Text style={styles.title}>Mes Consultations</Text></View>
      {loading ? <ActivityIndicator size="large" color="#246BFD" style={{ marginTop: 50 }} /> : (
        <FlatList data={appointments} keyExtractor={(item) => item.id} renderItem={renderItem} contentContainerStyle={styles.listContent} />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  headerWrapper: { paddingTop: 60, paddingHorizontal: 20, backgroundColor: '#FFF', paddingBottom: 15 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  listContent: { padding: 20, paddingBottom: 40 },
  apptCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 15, marginBottom: 15, elevation: 3 },
  apptHeader: { flexDirection: 'row', alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerText: { color: '#888', fontSize: 13 },
  statusBadge: { backgroundColor: '#F0F0F0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusBadgeLive: { backgroundColor: '#E7F9F0' },
  statusText: { fontSize: 10, fontWeight: 'bold', color: '#666', textTransform: 'uppercase' },
  apptDivider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 12 },
  apptBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  patientName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  typeText: { fontSize: 12, color: '#246BFD', marginTop: 2 },
  btnVideo: { backgroundColor: '#246BFD', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, flexDirection: 'row', gap: 8, alignItems: 'center' },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  notesContainer: { marginTop: 15, backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#EEE' },
  notesInput: { backgroundColor: '#FFF', borderRadius: 8, padding: 10, fontSize: 14, minHeight: 60, textAlignVertical: 'top', borderWidth: 1, borderColor: '#E8E8E8' },
  saveBtn: { backgroundColor: '#246BFD', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 10, borderRadius: 8, marginTop: 10, gap: 8 },
  saveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 }
});