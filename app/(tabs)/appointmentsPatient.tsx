import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  Linking, ActivityIndicator, Alert 
} from 'react-native';
import { Video, Clock, Calendar, MapPin, ChevronRight, ExternalLink } from 'lucide-react-native';
import { supabase } from '../../api/supabase';

export default function AppointmentsPatient() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPatientData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('appointments')
        .select(`id, appointment_date, appointment_time, status, doctor:doctor_id (full_name)`)
        .eq('patient_id', user.id)
        .order('appointment_date', { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (e) {
      console.error("Erreur chargement:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientData();

    // Listener de statut (Met à jour le badge "En cours" en temps réel)
    const statusChannel = supabase.channel('status_sync').on('postgres_changes', 
      { event: 'UPDATE', schema: 'public', table: 'appointments' }, 
      (payload) => {
        setAppointments(current => 
          current.map(app => app.id === payload.new.id ? { ...app, status: payload.new.status } : app)
        );
      }).subscribe();

    // Listener de Notifications (Alerte d'appel entrant Jitsi)
    const callChannel = supabase.channel('jitsi_calls').on('postgres_changes', 
      { event: 'INSERT', schema: 'public', table: 'notifications' }, 
      async (payload) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (payload.new.patient_id === user?.id) {
          Alert.alert(
            "📞 Appel Vidéo",
            `Le Dr. ${payload.new.doctor_name} vous invite à rejoindre la consultation sur Jitsi Meet.`,
            [
              { text: "Plus tard", style: "cancel" },
              { 
                text: "REJOINDRE", 
                onPress: () => Linking.openURL(payload.new.zoom_url), // Contient l'URL Jitsi
                style: 'default'
              }
            ]
          );
        }
      }).subscribe();

    return () => { 
      supabase.removeChannel(statusChannel); 
      supabase.removeChannel(callChannel); 
    };
  }, []);

  const renderItem = ({ item }: { item: any }) => {
    const isInProgress = item.status === 'in_progress';

    return (
      <View style={styles.apptCard}>
        <View style={styles.apptHeader}>
          <View style={styles.row}>
            <Calendar size={16} color="#666" />
            <Text style={styles.headerText}>{item.appointment_date}</Text>
          </View>
          <View style={[styles.row, { marginLeft: 15 }]}>
            <Clock size={16} color="#666" />
            <Text style={styles.headerText}>{item.appointment_time?.slice(0, 5)}</Text>
          </View>
          <View style={{ flex: 1 }} />
          <ChevronRight size={18} color="#CCC" />
        </View>

        <View style={styles.apptDivider} />

        <View style={styles.apptBody}>
          <View style={{ flex: 1 }}>
            <Text style={styles.doctorName}>Dr. {item.doctor?.full_name || "Médecin"}</Text>
            <View style={[styles.typeBadge, isInProgress ? styles.badgeLive : styles.badgeCabinet]}>
              {isInProgress ? (
                <Video size={14} color="#2ECC71" />
              ) : (
                <MapPin size={14} color="#246BFD" />
              )}
              <Text style={[styles.badgeText, { color: isInProgress ? '#2ECC71' : '#246BFD' }]}>
                {isInProgress ? 'Consultation en direct' : 'Cabinet'}
              </Text>
            </View>
          </View>

          {isInProgress && (
            <TouchableOpacity 
  style={styles.joinBtn} 
  onPress={() => {
    // ON DOIT NETTOYER L'ID ICI AUSSI
    const cleanId = item.id.replace(/-/g, '');
    const meetUrl = `https://meet.jit.si/RDV${cleanId}`;
    
    console.log("Lien Patient généré:", meetUrl); // Pour vérifier dans la console
    Linking.openURL(meetUrl);
  }}
>
  <Video size={20} color="#FFF" />
  <Text style={styles.joinBtnText}>REJOINDRE</Text>
</TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mes Rendez-vous</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#246BFD" style={{ marginTop: 50 }} />
      ) : (
        <FlatList 
          data={appointments} 
          keyExtractor={(item) => item.id.toString()} 
          renderItem={renderItem} 
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Aucun rendez-vous pour le moment.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', paddingTop: 60 },
  title: { fontSize: 24, fontWeight: 'bold', paddingHorizontal: 20, marginBottom: 20, color: '#333' },
  listContent: { paddingHorizontal: 20, paddingBottom: 30 },
  apptCard: { 
    backgroundColor: '#FFF', 
    borderRadius: 20, 
    padding: 15, 
    marginBottom: 15, 
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  apptHeader: { flexDirection: 'row', alignItems: 'center', paddingBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerText: { color: '#666', fontSize: 14, fontWeight: '500' },
  apptDivider: { height: 1, backgroundColor: '#F0F0F0', marginBottom: 12 },
  apptBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  doctorName: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  typeBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, gap: 6, alignSelf: 'flex-start' },
  badgeCabinet: { backgroundColor: '#E8F1FF' },
  badgeLive: { backgroundColor: '#E7F9F0' },
  badgeText: { fontSize: 12, fontWeight: 'bold' },
  joinBtn: { 
    backgroundColor: '#2ECC71', 
    paddingHorizontal: 15, 
    paddingVertical: 10, 
    borderRadius: 12, 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8 
  },
  joinBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 40, fontSize: 16 }
});