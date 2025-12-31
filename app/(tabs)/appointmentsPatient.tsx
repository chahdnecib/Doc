import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Linking, Vibration, Alert } from 'react-native';
import { Video, Clock, MapPin, RefreshCw } from 'lucide-react-native';
import { supabase } from '../../api/supabase';

export default function AppointmentsPatient() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Fonction pour charger les données (initiale ou manuelle)
  const fetchPatientData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('appointments')
        .select('*, doctor:doctor_id(full_name)')
        .eq('patient_id', user.id)
        .order('appointment_date', { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (err) {
      console.error("Erreur de chargement:", err);
    } finally {
      setLoading(false);
    }
  }, []);

 useEffect(() => {
  console.log("Tentative de connexion au Realtime...");

  const channel = supabase
    .channel('schema-db-changes')
    .on(
      'postgres_changes',
      { 
        event: '*', // On écoute TOUT (Insert, Update, Delete)
        schema: 'public', 
        table: 'appointments' 
      },
      (payload) => {
        // CE LOG DOIT APPARAÎTRE
        console.log("ALERTE : CHANGEMENT DÉTECTÉ !", payload);
        fetchPatientData(); // On recharge tout si on reçoit un signal
      }
    )
    .subscribe((status) => {
      // Si tu vois "SUBSCRIBED", le tunnel est ouvert.
      console.log("État du tunnel :", status);
    });

  return () => { supabase.removeChannel(channel); };
}, []);

  const joinCall = (id: string) => {
    const roomName = `Consultation-${id}`;
    const url = `https://meet.jit.si/${roomName}`;
    Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mes Rendez-vous</Text>
        <TouchableOpacity onPress={fetchPatientData}>
          <RefreshCw size={20} color="#246BFD" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={appointments}
        keyExtractor={(item) => item.id}
        extraData={appointments} // Aide FlatList à suivre les changements de statut
        renderItem={({ item }) => {
          const isLive = item.status === 'in_progress';

          return (
            <View style={[styles.card, isLive && styles.cardLive]}>
              <View style={styles.cardHeader}>
                <Text style={styles.doctorName}>Dr. {item.doctor?.full_name || "Médecin"}</Text>
                <View style={[styles.badge, { backgroundColor: isLive ? '#E8F8EF' : '#F2F2F2' }]}>
                  <Text style={[styles.badgeText, { color: isLive ? '#2ECC71' : '#888' }]}>
                    {item.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              <Text style={styles.dateText}>
                {item.appointment_date} à {item.appointment_time.slice(0, 5)}
              </Text>

              {item.type === 'teleconsultation' ? (
                <View style={styles.actionContainer}>
                  {isLive ? (
                    <TouchableOpacity 
                      style={styles.btnJoin} 
                      onPress={() => joinCall(item.id)}
                    >
                      <Video size={20} color="#FFF" />
                      <Text style={styles.btnText}>REJOINDRE LA VISIO</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.btnWait}>
                      <Clock size={18} color="#999" />
                      <Text style={styles.waitText}>En attente du docteur...</Text>
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.cabinetInfo}>
                  <MapPin size={16} color="#666" />
                  <Text style={styles.cabinetText}>Rendez-vous au cabinet</Text>
                </View>
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          !loading ? <Text style={styles.empty}>Aucun rendez-vous prévu</Text> : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F8F9FA', paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1A1A1A' },
  card: { backgroundColor: '#FFF', padding: 20, borderRadius: 16, marginBottom: 15, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  cardLive: { borderColor: '#2ECC71', borderWidth: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  doctorName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: 'bold' },
  dateText: { color: '#777', marginTop: 5, fontSize: 14 },
  actionContainer: { marginTop: 15 },
  btnJoin: { backgroundColor: '#2ECC71', flexDirection: 'row', padding: 16, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  btnWait: { backgroundColor: '#F2F2F2', flexDirection: 'row', padding: 16, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#FFF', fontWeight: 'bold', marginLeft: 10, fontSize: 15 },
  waitText: { color: '#999', marginLeft: 8, fontSize: 14 },
  cabinetInfo: { flexDirection: 'row', alignItems: 'center', marginTop: 15, padding: 10, backgroundColor: '#F0F0F0', borderRadius: 8 },
  cabinetText: { marginLeft: 8, color: '#666', fontSize: 13 },
  empty: { textAlign: 'center', marginTop: 50, color: '#999' }
});