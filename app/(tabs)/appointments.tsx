import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Linking, Alert } from 'react-native';
import { Video, Calendar, Clock, User } from 'lucide-react-native';
import { supabase } from '../../api/supabase';
import { appointmentService } from '../../api/appointmentService';

export default function DoctorAppointments() {
  const [appointments, setAppointments] = useState<any[]>([]);

  useEffect(() => {
    fetchDoctorData();
  }, []);

  const fetchDoctorData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase
      .from('appointments')
      .select('*')
      .eq('doctor_id', user?.id)
      .order('appointment_date', { ascending: true });
    setAppointments(data || []);
  };

  const handleStartCall = async (appointmentId: string) => {
    // 1. Notifier le patient en changeant le statut
    await appointmentService.updateStatus(appointmentId, 'in_progress');
    
    // 2. Rejoindre la salle avec l'ID unique du RDV
    const roomName = `Consultation-${appointmentId}`;
    Linking.openURL(`https://meet.jit.si/${roomName}`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mon Planning</Text>
      <FlatList
        data={appointments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.info}>
              <Text style={styles.patientName}>{item.patient_name}</Text>
              <Text style={styles.dateText}>{item.appointment_date} à {item.appointment_time.slice(0,5)}</Text>
            </View>
            
            {item.type === 'teleconsultation' && (
              <TouchableOpacity 
                style={styles.btnVideo} 
                onPress={() => handleStartCall(item.id)}
              >
                <Video size={20} color="#FFF" />
                <Text style={styles.btnText}>Lancer Visio</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F8F9FA', paddingTop: 50 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  card: { backgroundColor: '#FFF', padding: 15, borderRadius: 12, marginBottom: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2 },
  info: { flex: 1 },
  patientName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  dateText: { color: '#666', marginTop: 4 },
  btnVideo: { backgroundColor: '#246BFD', padding: 10, borderRadius: 8, flexDirection: 'row', alignItems: 'center' },
  btnText: { color: '#FFF', marginLeft: 8, fontWeight: 'bold' }
});