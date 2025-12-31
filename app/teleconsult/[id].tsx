import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Linking from 'expo-linking'; // Indispensable pour ouvrir le lien
import { Video, X, ShieldCheck } from 'lucide-react-native';

export default function TeleconsultScreen() {
  const { id, name } = useLocalSearchParams();
  const router = useRouter();

  // On crée un nom de salle unique basé sur l'ID du rendez-vous
  const roomName = `DocConsult-${id}`;
  const jitsiUrl = `https://meet.jit.si/${roomName}`;

  const startCall = () => {
    Linking.openURL(jitsiUrl);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
        <X color="#333" size={30} />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.iconCircle}>
           <Video size={50} color="#246BFD" />
        </View>
        
        <Text style={styles.title}>Visioconférence</Text>
        <Text style={styles.patientName}>Patient : {name}</Text>
        
        <View style={styles.securityBox}>
          <ShieldCheck size={20} color="#4CAF50" />
          <Text style={styles.securityText}>Appel sécurisé et privé</Text>
        </View>

        <TouchableOpacity style={styles.mainButton} onPress={startCall}>
          <Video color="#FFF" size={24} />
          <Text style={styles.buttonText}>Lancer l'appel vidéo</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', alignItems: 'center', justifyContent: 'center' },
  closeBtn: { position: 'absolute', top: 50, left: 20 },
  content: { width: '85%', alignItems: 'center', backgroundColor: '#FFF', padding: 30, borderRadius: 30, elevation: 8 },
  iconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#F0F5FF', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold' },
  patientName: { fontSize: 18, color: '#666', marginVertical: 15 },
  securityBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#E8F5E9', padding: 12, borderRadius: 12, marginBottom: 30 },
  securityText: { color: '#2E7D32', fontWeight: '600' },
  mainButton: { backgroundColor: '#246BFD', flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 15, paddingHorizontal: 30, borderRadius: 15, width: '100%', justifyContent: 'center' },
  buttonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' }
});