import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, FlatList, Image, 
  TouchableOpacity, RefreshControl, Alert 
} from 'react-native';
import { Users, Clock, CheckCircle, Video } from 'lucide-react-native'; // Ajout de Video
import { appointmentService } from '../api/appointmentService';
import { useRouter } from 'expo-router'; // Ajout pour la navigation

export default function DoctorDashboard({ profile }: { profile: any }) {
  const router = useRouter(); // Initialisation du router
  const [appointments, setAppointments] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const data = await appointmentService.getTodayAppointments(profile.id);
      setAppointments(data);
    } catch (error: any) {
      console.error("Erreur de chargement:", error.message);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, []);

  const handleComplete = async (id: string) => {
    try {
      await appointmentService.completeAppointment(id);
      setAppointments(prev => 
        prev.map(app => app.id === id ? { ...app, status: 'completed' } : app)
      );
    } catch (error: any) {
      Alert.alert("Erreur", "Impossible de valider.");
    }
  };

  const total = appointments.length;
  const done = appointments.filter(a => a.status === 'completed').length;
  const remaining = total - done;

  const renderHeader = () => (
    <View style={styles.headerSection}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.welcome}>Hello, {profile?.full_name} 👋</Text>
          <Text style={styles.roleText}>{profile?.specialty || 'Médecin Généraliste'}</Text>
        </View>
        <Image source={require('../assets/images/logo.png')} style={styles.avatar} />
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Users color="#246BFD" size={20} />
          <Text style={styles.statNum}>{total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#E7F9F0' }]}>
          <CheckCircle color="#2ECC71" size={20} />
          <Text style={styles.statNum}>{done}</Text>
          <Text style={styles.statLabel}>Fait</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#FFF4E5' }]}>
          <Clock color="#FF9500" size={20} />
          <Text style={styles.statNum}>{remaining}</Text>
          <Text style={styles.statLabel}>Reste</Text>
        </View>
      </View>
      <Text style={styles.sectionTitle}>Patients du jour</Text>
    </View>
  );

  return (
    <FlatList
      data={appointments}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={renderHeader}
      contentContainerStyle={styles.listPadding}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#246BFD']} />
      }
      renderItem={({ item }) => (
        <View style={styles.appointmentCard}>
          <View style={styles.cardInfo}>
            <View style={styles.timeContainer}>
              <Clock size={14} color="#246BFD" />
              <Text style={styles.timeText}>{item.appointment_time.slice(0, 5)}</Text>
            </View>
            <Text style={styles.patientName}>{item.patient_name}</Text>
          </View>
          
          {/* --- ZONE DES BOUTONS --- */}
          <View style={styles.actionsRow}>
            {/* Bouton Vidéo : seulement si c'est une téléconsultation et pas encore fini */}
            {item.type === 'teleconsultation' && item.status !== 'completed' && (
              <TouchableOpacity 
                style={styles.videoBtn}
                onPress={() => router.push({
                  pathname: "/teleconsult/[id]",
                  params: { id: item.id, name: item.patient_name }
                })}
              >
                <Video size={18} color="#246BFD" />
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={[styles.actionBtn, item.status === 'completed' && styles.actionBtnDone]}
              onPress={() => handleComplete(item.id)}
              disabled={item.status === 'completed'}
            >
              <Text style={styles.actionBtnText}>
                {item.status === 'completed' ? 'Consulté' : 'Valider'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      ListEmptyComponent={
        <Text style={styles.emptyText}>Aucun patient aujourd'hui.</Text>
      }
    />
  );
}

const styles = StyleSheet.create({
  listPadding: { padding: 20 },
  headerSection: { marginBottom: 10 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  welcome: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  roleText: { fontSize: 14, color: '#666' },
  avatar: { width: 55, height: 55, borderRadius: 28, borderWidth: 2, borderColor: '#F0F5FF' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  statCard: { 
    backgroundColor: '#F0F5FF', width: '31%', padding: 12, borderRadius: 18, 
    alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5,
  },
  statNum: { fontSize: 20, fontWeight: 'bold', color: '#333', marginTop: 5 },
  statLabel: { fontSize: 10, color: '#666', fontWeight: '600', textTransform: 'uppercase' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  
  // Design de la carte et des boutons alignés
  appointmentCard: { 
    backgroundColor: '#fff', padding: 15, borderRadius: 15, marginBottom: 12, 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: '#F0F0F0'
  },
  cardInfo: { flex: 1 },
  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 }, // Aligne Vidéo + Valider
  
  timeContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  timeText: { color: '#246BFD', fontWeight: 'bold', marginLeft: 5, fontSize: 13 },
  patientName: { fontSize: 16, fontWeight: '600', color: '#333' },
  
  videoBtn: { 
    backgroundColor: '#F0F5FF', padding: 8, borderRadius: 10, 
    borderWidth: 1, borderColor: '#246BFD' 
  },
  actionBtn: { backgroundColor: '#246BFD', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 10 },
  actionBtnDone: { backgroundColor: '#2ECC71' },
  actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 30 }
});