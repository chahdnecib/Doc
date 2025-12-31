import React, { useState, useCallback, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Image, TextInput, 
  TouchableOpacity, ScrollView, RefreshControl, Linking 
} from 'react-native';
import { Search, MapPin, Bell, Video, Clock } from 'lucide-react-native';
import { supabase } from '../api/supabase';

export default function PatientDashboard({ profile }: { profile: any }) {
  const [refreshing, setRefreshing] = useState(false);
  const [nextAppointment, setNextAppointment] = useState<any>(null);

  const fetchNextAppointment = async () => {
    try {
      if (!profile?.id) return;
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('appointments')
        .select('*')
        .eq('patient_id', profile.id)
        .eq('appointment_date', today)
        .eq('status', 'pending')
        .limit(1)
        .maybeSingle();

      setNextAppointment(data);
    } catch (error) {
      console.error("Erreur RDV patient:", error);
    }
  };

  useEffect(() => {
    fetchNextAppointment();
  }, [profile]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNextAppointment();
    setRefreshing(false);
  }, [profile]);

  const handleJoinCall = () => {
    if (nextAppointment) {
      const roomName = `DocConsult-${nextAppointment.id}`;
      Linking.openURL(`https://meet.jit.si/${roomName}`);
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#246BFD']} />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.welcome}>Hello, {profile?.full_name || 'Patient'} 👋</Text>
          <View style={styles.location}>
            <MapPin size={14} color="#666" />
            <Text style={styles.locationText}>Batna, Algérie</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.notifBtn}>
          <Bell size={22} color="#333" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Search size={20} color="#999" />
        <TextInput placeholder="Chercher un docteur..." style={styles.input} />
      </View>

      

      <View style={styles.banner}>
        <View style={styles.bannerText}>
          <Text style={styles.bannerTitle}>Medical Checks</Text>
          <Text style={styles.bannerSub}>Vérifiez votre état de santé régulièrement.</Text>
          <TouchableOpacity style={styles.bannerBtn}>
            <Text style={styles.bannerBtnText}>Voir plus</Text>
          </TouchableOpacity>
        </View>
        <Image source={require('../assets/images/logo.png')} style={styles.bannerImg} />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Spécialités</Text>
        <TouchableOpacity><Text style={styles.seeAll}>Voir tout</Text></TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  welcome: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  location: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  locationText: { fontSize: 13, color: '#666', marginLeft: 4 },
  notifBtn: { padding: 10, backgroundColor: '#F8F9FA', borderRadius: 12 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', paddingHorizontal: 15, height: 55, borderRadius: 15, marginBottom: 25 },
  input: { flex: 1, marginLeft: 10, fontSize: 15 },
  appointmentBanner: { backgroundColor: '#4CAF50', borderRadius: 20, padding: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  appInfo: { flex: 1 },
  appTitle: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  appTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 },
  appTime: { color: '#FFF', opacity: 0.9 },
  joinButton: { backgroundColor: '#FFF', flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 15, borderRadius: 12 },
  joinButtonText: { color: '#246BFD', fontWeight: 'bold' },
  banner: { backgroundColor: '#246BFD', borderRadius: 25, padding: 20, flexDirection: 'row', alignItems: 'center' },
  bannerText: { flex: 1 },
  bannerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  bannerSub: { color: '#fff', opacity: 0.8, fontSize: 13, marginVertical: 8 },
  bannerBtn: { backgroundColor: '#fff', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 10, alignSelf: 'flex-start' },
  bannerBtnText: { color: '#246BFD', fontWeight: 'bold', fontSize: 12 },
  bannerImg: { width: 80, height: 80, marginLeft: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 30 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  seeAll: { color: '#246BFD', fontWeight: '600' }
});