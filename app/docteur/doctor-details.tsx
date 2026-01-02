import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Star, Clock, MapPin, Phone } from 'lucide-react-native';

export default function DoctorDetails() {
  const router = useRouter();
  const params = useLocalSearchParams(); // Récupère id, name, specialty

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER BAR */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Doctor Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* PROFILE CARD */}
        <View style={styles.profileSection}>
          <Image 
            source={{ uri: `https://ui-avatars.com/api/?name=${params.name}&bold=true&size=200` }} 
            style={styles.bigAvatar} 
          />
          <Text style={styles.docName}>Dr. {params.name}</Text>
          <Text style={styles.docSpec}>{params.specialty}</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>4.8</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>127</Text>
              <Text style={styles.statLabel}>Reviews</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>10+</Text>
              <Text style={styles.statLabel}>Exp.</Text>
            </View>
          </View>
        </View>

        {/* ABOUT SECTION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Doctor</Text>
          <Text style={styles.aboutText}>
            Dr. {params.name} is a highly experienced specialist in {params.specialty} with over 10 years of practice in Batna.
          </Text>
        </View>

        {/* INFO CARDS */}
        <View style={styles.infoRow}>
          <View style={styles.infoCard}>
            <Clock size={20} color="#246BFD" />
            <Text style={styles.infoText}>09:00 - 17:00</Text>
          </View>
          <View style={styles.infoCard}>
            <MapPin size={20} color="#246BFD" />
            <Text style={styles.infoText}>Batna Center</Text>
          </View>
        </View>
      </ScrollView>

      {/* BOTTOM BUTTON */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.confirmBtn} onPress={() => alert("Appointment Request Sent!")}>
          <Text style={styles.confirmBtnText}>Confirm Appointment</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  backBtn: { padding: 8, backgroundColor: '#F5F5F5', borderRadius: 12 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  scrollContent: { padding: 20 },
  profileSection: { alignItems: 'center', marginBottom: 30 },
  bigAvatar: { width: 120, height: 120, borderRadius: 30, backgroundColor: '#F0F5FF', marginBottom: 15 },
  docName: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  docSpec: { fontSize: 16, color: '#246BFD', fontWeight: '600', marginTop: 5 },
  statsRow: { flexDirection: 'row', gap: 30, marginTop: 20 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: 'bold' },
  statLabel: { fontSize: 12, color: '#999' },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  aboutText: { color: '#666', lineHeight: 22 },
  infoRow: { flexDirection: 'row', gap: 15, marginTop: 25 },
  infoCard: { flex: 1, backgroundColor: '#F8FAFF', padding: 15, borderRadius: 20, alignItems: 'center', gap: 8 },
  infoText: { fontSize: 13, fontWeight: '600', color: '#333' },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#F5F5F5' },
  confirmBtn: { backgroundColor: '#246BFD', padding: 18, borderRadius: 20, alignItems: 'center' },
  confirmBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});