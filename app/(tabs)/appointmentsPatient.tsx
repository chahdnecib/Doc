import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  Linking, ActivityIndicator 
} from 'react-native';
import { Video, Clock, Calendar, MapPin, ChevronRight } from 'lucide-react-native';
import { supabase } from '../../api/supabase';

export default function AppointmentsPatient() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Chargement des données avec jointure pour le nom du docteur
  const fetchPatientData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          appointment_time,
          status,
          doctor:doctor_id (full_name)
        `)
        .eq('patient_id', user.id)
        .order('appointment_date', { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (e) {
      console.error("Erreur fetch:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientData();

    // 2. Configuration du Realtime pour mettre à jour le statut (visio) en direct
    const channel = supabase
      .channel('appointments_status')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'appointments' },
        (payload) => {
          setAppointments((current) => 
            current.map((app) => 
              app.id === payload.new.id 
                ? { ...app, status: payload.new.status } 
                : app
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const renderItem = ({ item }: { item: any }) => {
    const isInProgress = item.status === 'in_progress';

    return (
      <View style={styles.apptCard}>
        {/* En-tête : Date et Heure */}
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

        {/* Corps : Docteur et Statut/Action */}
        <View style={styles.apptBody}>
          <View style={{ flex: 1 }}>
            <Text style={styles.doctorName}>Dr. {item.doctor?.full_name || "Médecin"}</Text>
            
            {/* Badge de type/lieu */}
            <View style={[styles.typeBadge, isInProgress ? styles.badgeLive : styles.badgeCabinet]}>
              {isInProgress ? (
                <Video size={14} color="#2ECC71" />
              ) : (
                <MapPin size={14} color="#246BFD" />
              )}
              <Text style={[styles.badgeText, { color: isInProgress ? '#2ECC71' : '#246BFD' }]}>
                {isInProgress ? 'Consultation en cours' : 'Cabinet'}
              </Text>
            </View>
          </View>

          {/* Bouton d'action Realtime */}
          {isInProgress && (
            <TouchableOpacity 
              style={styles.joinBtn} 
              onPress={() => Linking.openURL(`https://meet.jit.si/Consultation-${item.id}`)}
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
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Aucun rendez-vous trouvé.</Text>
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
  
  // Design des cartes (Inspiré de votre image)
  apptCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  apptHeader: { flexDirection: 'row', alignItems: 'center', paddingBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerText: { color: '#666', fontSize: 14, fontWeight: '500' },
  apptDivider: { height: 1, backgroundColor: '#F0F0F0', marginBottom: 12 },
  
  apptBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  doctorName: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 6 },
  
  typeBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 10, 
    paddingVertical: 5, 
    borderRadius: 10, 
    gap: 6,
    alignSelf: 'flex-start'
  },
  badgeCabinet: { backgroundColor: '#E8F1FF' },
  badgeLive: { backgroundColor: '#E7F9F0' },
  badgeText: { fontSize: 12, fontWeight: 'bold' },

  joinBtn: { 
    backgroundColor: '#2ECC71', 
    paddingHorizontal: 12, 
    paddingVertical: 10, 
    borderRadius: 12, 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8 
  },
  joinBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 50, fontStyle: 'italic' }
});