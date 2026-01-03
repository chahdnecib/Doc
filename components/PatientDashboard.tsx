import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  View, Text, StyleSheet, TextInput, Modal,
  TouchableOpacity, ActivityIndicator, Image, ScrollView, Alert, Linking
} from 'react-native';
import { 
  Search, Bell, Stethoscope, Brain, Bone, Baby, X, MapPin, Phone, Info, Video
} from 'lucide-react-native';
import { supabase } from '../api/supabase';
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Calendar, LocaleConfig } from 'react-native-calendars';

// Configuration FR pour le calendrier
LocaleConfig.locales['fr'] = {
  monthNames: ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'],
  monthNamesShort: ['Janv.','Févr.','Mars','Avril','Mai','Juin','Juil.','Août','Sept.','Oct.','Nov.','Déc.'],
  dayNames: ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'],
  dayNamesShort: ['Dim.','Lun.','Mar.','Mer.','Jeu.','Ven.','Sam.'],
  today: "Aujourd'hui"
};
LocaleConfig.defaultLocale = 'fr';

const SPECIALTIES = [
  { id: '1', name: 'Dentiste', icon: Stethoscope },
  { id: '2', name: 'Neurologue', icon: Brain },
  { id: '3', name: 'Orthopédiste', icon: Bone },
  { id: '4', name: 'Pédiatre', icon: Baby },
];

const TIME_SLOTS = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];

export default function PatientDashboard({ profile }: { profile: any }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // --- ÉTATS NOTIFICATIONS & APPELS ---
  const [hasNotif, setHasNotif] = useState(false);
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [callModalVisible, setCallModalVisible] = useState(false);

  // Détails docteur
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedDocInfo, setSelectedDocInfo] = useState<any>(null);

  // Réservation
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['75%', '95%'], []);

  // --- LOGIQUE TEMPS RÉEL (RING) ---
  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel('patient_alerts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `patient_id=eq.${profile.id}` },
        (payload) => {
          setIncomingCall(payload.new);
          setHasNotif(true);
          setCallModalVisible(true); 
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile]);

  // Recherche des docteurs
  useEffect(() => {
    const fetchDoctors = async () => {
      setLoading(true);
      let query = supabase.from('profiles').select('*').eq('role', 'doctor');
      if (searchQuery) {
        query = query.or(`full_name.ilike.%${searchQuery}%,specialty.ilike.%${searchQuery}%`);
      }
      const { data } = await query.limit(10);
      setDoctors(data || []);
      setLoading(false);
    };
    const timer = setTimeout(fetchDoctors, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleConfirmBooking = async () => {
    if (!selectedTime || !selectedDoctor) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('appointments').insert([{
      patient_id: user?.id,
      patient_name: profile?.full_name || "Patient",
      doctor_id: selectedDoctor.id,
      appointment_date: selectedDate,
      appointment_time: selectedTime,
      status: 'confirmed'
    }]);

    if (error) Alert.alert("Erreur", "Impossible de réserver.");
    else {
      Alert.alert("Succès", "Rendez-vous réservé !");
      bottomSheetRef.current?.close();
    }
  };

  const renderBackdrop = useCallback((p: any) => (
    <BottomSheetBackdrop {...p} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
  ), []);

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.blueHeader}>
        <View style={styles.headerTop}>
          <View style={styles.userInfo}>
            <Image source={{ uri: `https://ui-avatars.com/api/?name=${profile?.full_name || 'U'}` }} style={styles.avatar} />
            <View>
              <Text style={styles.helloText}>Bonjour, {profile?.full_name || 'Patient'} 👋</Text>
              <Text style={styles.locationText}>Batna, Algérie</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.notifBtn} 
            onPress={() => {
              if (incomingCall) setCallModalVisible(true);
              setHasNotif(false);
            }}
          >
            <Bell size={22} color="#FFF" />
            {hasNotif && <View style={styles.ringBadge} />}
          </TouchableOpacity>
        </View>

        <View style={styles.searchBar}>
          <Search size={20} color="#CCC" />
          <TextInput 
            placeholder="Rechercher un médecin..." 
            style={styles.searchInput} 
            value={searchQuery} 
            onChangeText={setSearchQuery} 
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* BANNIERE */}
        <View style={styles.banner}>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>Bilan Médical</Text>
            <Text style={styles.bannerSub}>Vérifiez vos résultats d'examens.</Text>
            <TouchableOpacity style={styles.bannerBtn}><Text style={styles.bannerBtnText}>Consulter</Text></TouchableOpacity>
          </View>
          <Image source={require('../assets/images/logo.png')} style={styles.bannerImg} />
        </View>

        {/* SPECIALITES */}
        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Spécialités</Text></View>
        <View style={styles.specialtiesGrid}>
          {SPECIALTIES.map((item) => (
            <TouchableOpacity key={item.id} style={styles.specialtyItem} onPress={() => setSearchQuery(item.name)}>
              <View style={styles.iconBox}><item.icon size={26} color="#246BFD" /></View>
              <Text style={styles.specialtyName}>{item.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* LISTE DOCTEURS */}
        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Médecins à proximité</Text></View>
        {loading ? <ActivityIndicator size="large" color="#246BFD" style={{marginTop: 20}} /> : doctors.map((item) => (
          <TouchableOpacity key={item.id} style={styles.doctorCard} onPress={() => { setSelectedDocInfo(item); setDetailVisible(true); }}>
            <Image source={{ uri: `https://ui-avatars.com/api/?name=${item.full_name}` }} style={styles.docAvatar} />
            <View style={styles.docInfo}>
              <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                <Text style={styles.docName}>Dr. {item.full_name}</Text>
                <Info size={18} color="#CCC" />
              </View>
              <Text style={styles.docSpec}>{item.specialty}</Text>
              <TouchableOpacity style={styles.bookBtn} onPress={() => { setSelectedDoctor(item); bottomSheetRef.current?.expand(); }}>
                <Text style={styles.bookBtnText}>Réserver</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* --- MODALE APPEL ENTRANT --- */}
      <Modal visible={callModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.callCard}>
            <View style={styles.callIconBox}><Video size={35} color="#FFF" /></View>
            <Text style={styles.callTitle}>Appel Vidéo</Text>
            <Text style={styles.callSub}>Le Dr. {incomingCall?.doctor_name} vous invite à une consultation.</Text>
            
            <View style={styles.callActionRow}>
              <TouchableOpacity style={styles.declineBtn} onPress={() => setCallModalVisible(false)}>
                <X size={24} color="#FF3B30" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.acceptBtn} 
                onPress={() => {
                  Linking.openURL(incomingCall?.zoom_url);
                  setCallModalVisible(false);
                }}
              >
                <Video size={24} color="#FFF" />
                <Text style={styles.acceptText}>REJOINDRE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODALE DÉTAILS DOCTEUR */}
      <Modal visible={detailVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.detailModal}>
            <TouchableOpacity style={styles.closeModalBtn} onPress={() => setDetailVisible(false)}><X size={24} color="#333" /></TouchableOpacity>
            <Image source={{ uri: `https://ui-avatars.com/api/?name=${selectedDocInfo?.full_name}` }} style={styles.modalAvatar} />
            <Text style={styles.modalDocName}>Dr. {selectedDocInfo?.full_name}</Text>
            <Text style={styles.modalDocSpec}>{selectedDocInfo?.specialty}</Text>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <View style={styles.infoIconBox}><Phone size={20} color="#246BFD" /></View>
              <View><Text style={styles.infoLabel}>Téléphone</Text><Text style={styles.infoValue}>{selectedDocInfo?.phone || "Non renseigné"}</Text></View>
            </View>
            <TouchableOpacity style={styles.modalBookBtn} onPress={() => { setDetailVisible(false); setSelectedDoctor(selectedDocInfo); bottomSheetRef.current?.expand(); }}>
              <Text style={styles.modalBookBtnText}>Prendre RDV maintenant</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* BOTTOM SHEET RÉSERVATION */}
      <BottomSheet ref={bottomSheetRef} index={-1} snapPoints={snapPoints} enablePanDownToClose backdropComponent={renderBackdrop}>
        <BottomSheetScrollView style={{ padding: 20 }}>
          <Text style={styles.sheetTitle}>Choisir un créneau</Text>
          <Calendar minDate={new Date().toISOString().split('T')[0]} onDayPress={(d) => setSelectedDate(d.dateString)} markedDates={{ [selectedDate]: { selected: true, selectedColor: '#246BFD' } }} />
          <View style={styles.timeGrid}>
            {TIME_SLOTS.map((t) => (
              <TouchableOpacity key={t} style={[styles.slot, selectedTime === t && styles.activeSlot]} onPress={() => setSelectedTime(t)}>
                <Text style={{ color: selectedTime === t ? '#FFF' : '#333' }}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirmBooking}><Text style={styles.confirmBtnText}>Confirmer RDV</Text></TouchableOpacity>
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  blueHeader: { backgroundColor: '#246BFD', padding: 20, paddingTop: 50, borderBottomLeftRadius: 35, borderBottomRightRadius: 35 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderColor: '#FFF' },
  helloText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  locationText: { color: '#D1E3FF', fontSize: 12 },
  notifBtn: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 12, position: 'relative' },
  ringBadge: { position: 'absolute', top: 8, right: 8, width: 10, height: 10, backgroundColor: '#FF3B30', borderRadius: 5, borderWidth: 1.5, borderColor: '#246BFD' },
  searchBar: { backgroundColor: '#FFF', borderRadius: 15, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, height: 50 },
  searchInput: { flex: 1, marginLeft: 10 },
  scrollContent: { paddingBottom: 50 },
  banner: { backgroundColor: '#5D9CEC', margin: 20, borderRadius: 25, padding: 20, flexDirection: 'row', alignItems: 'center' },
  bannerTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  bannerSub: { color: '#FFF', fontSize: 12, marginBottom: 10 },
  bannerBtn: { backgroundColor: '#FFF', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 10, alignSelf: 'flex-start' },
  bannerBtnText: { color: '#246BFD', fontWeight: 'bold', fontSize: 12 },
  bannerImg: { width: 80, height: 80 },
  sectionHeader: { paddingHorizontal: 20, marginVertical: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  specialtiesGrid: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20 },
  specialtyItem: { alignItems: 'center', width: '22%' },
  iconBox: { backgroundColor: '#F0F6FF', padding: 15, borderRadius: 18, marginBottom: 5 },
  specialtyName: { fontSize: 11, fontWeight: 'bold', color: '#444' },
  doctorCard: { flexDirection: 'row', backgroundColor: '#FFF', padding: 15, borderRadius: 20, marginHorizontal: 20, marginBottom: 15, elevation: 3, shadowOpacity: 0.1 },
  docAvatar: { width: 80, height: 100, borderRadius: 15 },
  docInfo: { flex: 1, marginLeft: 15, justifyContent: 'center' },
  docName: { fontWeight: 'bold', fontSize: 16 },
  docSpec: { color: '#246BFD', fontSize: 13, marginBottom: 5 },
  bookBtn: { backgroundColor: '#246BFD', padding: 10, borderRadius: 10, marginTop: 5, alignItems: 'center' },
  bookBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  callCard: { width: '85%', backgroundColor: '#FFF', borderRadius: 30, padding: 25, alignItems: 'center' },
  callIconBox: { backgroundColor: '#2ECC71', padding: 20, borderRadius: 25, marginBottom: 15 },
  callTitle: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  callSub: { textAlign: 'center', color: '#666', marginTop: 8, marginBottom: 25 },
  callActionRow: { flexDirection: 'row', gap: 15 },
  declineBtn: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center' },
  acceptBtn: { flex: 1, height: 60, borderRadius: 30, backgroundColor: '#2ECC71', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  acceptText: { color: '#FFF', fontWeight: 'bold' },
  detailModal: { width: '85%', backgroundColor: '#FFF', borderRadius: 30, padding: 20, alignItems: 'center' },
  closeModalBtn: { alignSelf: 'flex-end', padding: 5 },
  modalAvatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 15, borderWidth: 3, borderColor: '#F0F6FF' },
  modalDocName: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  modalDocSpec: { fontSize: 16, color: '#246BFD', marginBottom: 20 },
  divider: { width: '100%', height: 1, backgroundColor: '#EEE', marginBottom: 20 },
  infoRow: { flexDirection: 'row', width: '100%', alignItems: 'center', marginBottom: 20, gap: 15 },
  infoIconBox: { width: 45, height: 45, backgroundColor: '#F0F6FF', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  infoLabel: { fontSize: 12, color: '#999' },
  infoValue: { fontSize: 15, fontWeight: '600', color: '#333' },
  modalBookBtn: { backgroundColor: '#246BFD', width: '100%', padding: 15, borderRadius: 15, alignItems: 'center', marginTop: 10 },
  modalBookBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  sheetTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 15 },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 20 },
  slot: { width: '30%', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#EEE', alignItems: 'center' },
  activeSlot: { backgroundColor: '#246BFD', borderColor: '#246BFD' },
  confirmBtn: { backgroundColor: '#246BFD', padding: 16, borderRadius: 15, marginVertical: 30, alignItems: 'center' },
  confirmBtnText: { color: '#FFF', fontWeight: 'bold' }
});