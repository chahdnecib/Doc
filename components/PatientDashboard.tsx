import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  Modal,
  TouchableOpacity, 
  ActivityIndicator, 
  Image, 
  ScrollView, 
  Alert, 
  Linking,
  FlatList,
  Platform 
} from 'react-native';
import { 
  Search, 
  Bell, 
  Stethoscope, 
  Brain, 
  Bone, 
  Baby, 
  X, 
  MapPin, 
  Phone, 
  Info, 
  Video, 
  User,
  Star,
  FileText
} from 'lucide-react-native';
import { supabase } from '../api/supabase';
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import * as Location from 'expo-location'; // Ajouté pour la localisation

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
  const [locationName, setLocationName] = useState('Chargement...');

  // --- ÉTATS NOTIFICATIONS & APPELS ---
  const [hasNotif, setHasNotif] = useState(false);
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [callModalVisible, setCallModalVisible] = useState(false);

  // --- ÉTATS NOTES MÉDICALES (Bouton Consulter) ---
  const [notesModalVisible, setNotesModalVisible] = useState(false);
  const [medicalNotes, setMedicalNotes] = useState<any[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);

  // --- ÉTATS DÉTAILS MÉDECIN ---
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedDocInfo, setSelectedDocInfo] = useState<any>(null);

  // --- ÉTATS RÉSERVATION ---
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [appointmentType, setAppointmentType] = useState<'in-person' | 'teleconsultation'>('in-person');

  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['85%', '95%'], []);

  // --- OUVERTURE GPS ---
const openMaps = (address: string) => {
  if (!address) {
    Alert.alert("Information", "L'adresse n'est pas renseignée pour ce cabinet.");
    return;
  }
  
  // Prépare l'URL selon le système d'exploitation
  const url = Platform.select({
    ios: `maps:0,0?q=${encodeURIComponent(address)}`,
    android: `geo:0,0?q=${encodeURIComponent(address)}`,
  });

  if (url) {
    Linking.openURL(url).catch(() => 
      Alert.alert("Erreur", "Impossible d'ouvrir l'application de navigation.")
    );
  }
};
  

  // --- LOCALISATION DYNAMIQUE ---
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationName('Algérie (Gps désactivé)');
        return;
      }

      try {
        let location = await Location.getCurrentPositionAsync({});
        let reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        if (reverseGeocode.length > 0) {
          let address = reverseGeocode[0];
          setLocationName(`${address.city || address.region}, ${address.country}`);
        }
      } catch (error) {
        setLocationName('Batna, Algérie');
      }
    })();
  }, []);

  // --- RÉCUPÉRATION DES NOTES (Bouton Consulter) ---
  const fetchMedicalNotes = async () => {
  if (!profile?.id) return;
  
  setLoadingNotes(true);
  setNotesModalVisible(true);
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        appointment_date,
        notes,
        doctor:doctor_id (
          full_name
        )
      `)
      .eq('patient_id', profile.id)
      .not('notes', 'is', null)
      .order('appointment_date', { ascending: false });

    if (error) throw error;
    setMedicalNotes(data || []);
  } catch (err) {
    console.error("Erreur notes:", err);
    Alert.alert("Erreur", "Impossible de charger vos notes.");
  } finally {
    setLoadingNotes(false);
  }
};
  // --- LOGIQUE TEMPS RÉEL (RING) ---
  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel('patient_alerts')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications', 
          filter: `patient_id=eq.${profile.id}` 
        },
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

  // --- RECHERCHE DES DOCTEURS ---
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

  // --- CONFIRMATION DU RDV ---
  const handleConfirmBooking = async () => {
    if (!selectedTime || !selectedDoctor) {
      Alert.alert("Sélection incomplète", "Veuillez choisir une heure.");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase.from('appointments').insert([{
      patient_id: user?.id,
      patient_name: profile?.full_name || "Patient",
      doctor_id: selectedDoctor.id,
      appointment_date: selectedDate,
      appointment_time: selectedTime,
      type: appointmentType,
      status: 'confirmed'
    }]);

    if (error) {
      Alert.alert("Erreur", "Impossible d'enregistrer le rendez-vous.");
    } else {
      Alert.alert("Succès", "Votre rendez-vous a été confirmé !");
      bottomSheetRef.current?.close();
    }
  };

  const renderBackdrop = useCallback((p: any) => (
    <BottomSheetBackdrop {...p} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
  ), []);

  return (
    <View style={styles.container}>
      {/* --- HEADER --- */}
      <View style={styles.blueHeader}>
        <View style={styles.headerTop}>
          <View style={styles.userInfo}>
            <Image 
              source={{ uri: `https://ui-avatars.com/api/?name=${profile?.full_name || 'U'}&background=random` }} 
              style={styles.avatar} 
            />
            <View>
              <Text style={styles.helloText}>Bonjour, {profile?.full_name || 'Patient'} 👋</Text>
              <Text style={styles.locationText}>{locationName}</Text>
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
            placeholder="Rechercher un médecin, une spécialité..." 
            style={styles.searchInput} 
            value={searchQuery} 
            onChangeText={setSearchQuery} 
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* --- BANNIERE PROMO (Bouton Consulter corrigé) --- */}
        <View style={styles.banner}>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>Bilan Médical</Text>
            <Text style={styles.bannerSub}>Consultez vos derniers résultats d'examens en ligne.</Text>
            <TouchableOpacity style={styles.bannerBtn} onPress={fetchMedicalNotes}>
              <Text style={styles.bannerBtnText}>Consulter</Text>
            </TouchableOpacity>
          </View>
          <Image source={require('../assets/images/logo.png')} style={styles.bannerImg} />
        </View>

        {/* --- SECTION SPÉCIALITÉS --- */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Spécialités</Text>
          <TouchableOpacity><Text style={styles.seeAll}>Voir tout</Text></TouchableOpacity>
        </View>
        <View style={styles.specialtiesGrid}>
          {SPECIALTIES.map((item) => (
            <TouchableOpacity key={item.id} style={styles.specialtyItem} onPress={() => setSearchQuery(item.name)}>
              <View style={styles.iconBox}><item.icon size={26} color="#246BFD" /></View>
              <Text style={styles.specialtyName}>{item.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* --- LISTE DES DOCTEURS --- */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Médecins à proximité</Text>
        </View>
        
        {loading ? (
          <ActivityIndicator size="large" color="#246BFD" style={{marginTop: 20}} />
        ) : (
          doctors.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.doctorCard} 
              onPress={() => { setSelectedDocInfo(item); setDetailVisible(true); }}
            >
              <Image source={{ uri: `https://ui-avatars.com/api/?name=${item.full_name}&background=random` }} style={styles.docAvatar} />
              <View style={styles.docInfo}>
                <View style={styles.docHeaderRow}>
                  <Text style={styles.docName}>Dr. {item.full_name}</Text>
                </View>
                <Text style={styles.docSpec}>{item.specialty}</Text>
        
                <TouchableOpacity 
                  style={styles.bookBtn} 
                  onPress={() => { setSelectedDoctor(item); bottomSheetRef.current?.expand(); }}
                >
                  <Text style={styles.bookBtnText}>Prendre RDV</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* --- MODALE DES NOTES MÉDICALES --- */}
      <Modal visible={notesModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.detailModal, { height: '70%', width: '90%' }]}>
            <View style={styles.sectionHeader}>
               <Text style={styles.sectionTitle}>Mes Bilans & Notes</Text>
               <TouchableOpacity onPress={() => setNotesModalVisible(false)}>
                 <X size={24} color="#333" />
               </TouchableOpacity>
            </View>
            
            {loadingNotes ? (
              <ActivityIndicator size="large" color="#246BFD" />
            ) : (
              <FlatList
  data={medicalNotes}
  keyExtractor={(item, index) => index.toString()}
  renderItem={({ item }) => (
    <View style={styles.noteCard}>
      <View style={styles.noteHeader}>
        <FileText size={18} color="#246BFD" />
        <Text style={styles.noteDate}>
          {new Date(item.appointment_date).toLocaleDateString('fr-FR')}
        </Text>
      </View>
      
      {/* Affichage du nom du docteur récupéré par la jointure */}
      <Text style={styles.noteDoc}>
        Dr. {item.doctor?.full_name || "Médecin partenaire"}
      </Text>
      
      <View style={styles.dividerSmall} />
      <Text style={styles.noteText}>{item.notes}</Text>
    </View>
  )}
  ListEmptyComponent={<Text style={styles.emptyText}>Aucun bilan médical trouvé.</Text>}
  style={{ width: '100%' }}
/>
            )}
          </View>
        </View>
      </Modal>

      {/* --- MODALE APPEL ENTRANT (RING) --- */}
      <Modal visible={callModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.callCard}>
            <View style={styles.callIconBox}><Video size={35} color="#FFF" /></View>
            <Text style={styles.callTitle}>Appel Vidéo Entrant</Text>
            <Text style={styles.callSub}>Le Dr. {incomingCall?.doctor_name} souhaite démarrer la téléconsultation.</Text>
            
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
                <Text style={styles.acceptText}>ACCEPTER</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- MODALE DÉTAILS DU MÉDECIN --- */}
      <Modal visible={detailVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.detailModal}>
            <TouchableOpacity style={styles.closeModalBtn} onPress={() => setDetailVisible(false)}>
              <X size={24} color="#333" />
            </TouchableOpacity>
            
            <Image 
              source={{ uri: `https://ui-avatars.com/api/?name=${selectedDocInfo?.full_name}&background=random` }} 
              style={styles.modalAvatar} 
            />
            <Text style={styles.modalDocName}>Dr. {selectedDocInfo?.full_name}</Text>
            <Text style={styles.modalDocSpec}>{selectedDocInfo?.specialty}</Text>
            
            <View style={styles.divider} />
            
            <View style={styles.infoRow}>
              <View style={styles.infoIconBox}><Phone size={20} color="#246BFD" /></View>
              <View>
                <Text style={styles.infoLabel}>Téléphone</Text>
                <Text style={styles.infoValue}>{selectedDocInfo?.phone || "05 50 -- -- --"}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoIconBox}><Info size={20} color="#246BFD" /></View>
              <View style={{flex: 1}}>
                <Text style={styles.infoLabel}>Bio</Text>
                <Text style={styles.infoValue} numberOfLines={2}>Médecin spécialiste avec plus de 10 ans d'expérience...</Text>
              </View>
            </View>

            {/* AJOUT ADRESSE CLIQUABLE */}
<TouchableOpacity 
  style={styles.infoRow} 
  onPress={() => openMaps(selectedDocInfo?.address)}
>
  <View style={[styles.infoIconBox, { backgroundColor: '#E7F0FF' }]}>
    <MapPin size={20} color="#246BFD" />
  </View>
  <View style={{ flex: 1 }}>
    <Text style={styles.infoLabel}>Adresse du cabinet</Text>
    <Text style={[styles.infoValue, { color: '#246BFD', textDecorationLine: 'underline' }]}>
      {selectedDocInfo?.address || "Cliquer pour localiser"}
    </Text>
  </View>
</TouchableOpacity>

            <TouchableOpacity 
              style={styles.modalBookBtn} 
              onPress={() => { 
                setDetailVisible(false); 
                setSelectedDoctor(selectedDocInfo); 
                bottomSheetRef.current?.expand(); 
              }}
            >
              <Text style={styles.modalBookBtnText}>Prendre un rendez-vous</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* --- BOTTOM SHEET RÉSERVATION --- */}
      <BottomSheet 
        ref={bottomSheetRef} 
        index={-1} 
        snapPoints={snapPoints} 
        enablePanDownToClose 
        backdropComponent={renderBackdrop}
      >
        <BottomSheetScrollView style={{ padding: 20 }}>
          <Text style={styles.sheetTitle}>Planifier un RDV</Text>
          
          <Text style={styles.subLabel}>Mode de consultation :</Text>
          <View style={styles.typeContainer}>
            <TouchableOpacity 
              style={[styles.typeCard, appointmentType === 'in-person' && styles.activeTypeCard]} 
              onPress={() => setAppointmentType('in-person')}
            >
              <User size={20} color={appointmentType === 'in-person' ? '#FFF' : '#246BFD'} />
              <Text style={[styles.typeText, appointmentType === 'in-person' && styles.activeTypeText]}>Au Cabinet</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.typeCard, appointmentType === 'teleconsultation' && styles.activeTypeCard]} 
              onPress={() => setAppointmentType('teleconsultation')}
            >
              <Video size={20} color={appointmentType === 'teleconsultation' ? '#FFF' : '#246BFD'} />
              <Text style={[styles.typeText, appointmentType === 'teleconsultation' && styles.activeTypeText]}>Vidéo</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.subLabel}>Choisir la date :</Text>
          <Calendar 
            minDate={new Date().toISOString().split('T')[0]} 
            onDayPress={(d) => setSelectedDate(d.dateString)} 
            markedDates={{ [selectedDate]: { selected: true, selectedColor: '#246BFD' } }} 
            theme={{
                todayTextColor: '#246BFD',
                arrowColor: '#246BFD',
                selectedDayBackgroundColor: '#246BFD',
            }}
          />

          <Text style={[styles.subLabel, {marginTop: 20}]}>Heures disponibles :</Text>
          <View style={styles.timeGrid}>
            {TIME_SLOTS.map((t) => (
              <TouchableOpacity 
                key={t} 
                style={[styles.slot, selectedTime === t && styles.activeSlot]} 
                onPress={() => setSelectedTime(t)}
              >
                <Text style={{ color: selectedTime === t ? '#FFF' : '#333', fontWeight: 'bold' }}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirmBooking}>
            <Text style={styles.confirmBtnText}>Confirmer la réservation</Text>
          </TouchableOpacity>
          <View style={{height: 50}} />
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FE' },
  blueHeader: { 
    backgroundColor: '#246BFD', 
    padding: 20, 
    paddingTop: 50, 
    borderBottomLeftRadius: 35, 
    borderBottomRightRadius: 35,
    elevation: 10
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 55, height: 55, borderRadius: 27.5, borderWidth: 2, borderColor: '#FFF' },
  helloText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },
  locationText: { color: '#D1E3FF', fontSize: 13 },
  notifBtn: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 12, borderRadius: 15, position: 'relative' },
  ringBadge: { 
    position: 'absolute', 
    top: 10, 
    right: 10, 
    width: 12, 
    height: 12, 
    backgroundColor: '#FF3B30', 
    borderRadius: 6, 
    borderWidth: 2, 
    borderColor: '#246BFD' 
  },
  searchBar: { 
    backgroundColor: '#FFF', 
    borderRadius: 18, 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 15, 
    height: 55,
    shadowOpacity: 0.1
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15 },
  scrollContent: { paddingBottom: 40 },
  banner: { 
    backgroundColor: '#5D9CEC', 
    margin: 20, 
    borderRadius: 25, 
    padding: 20, 
    flexDirection: 'row', 
    alignItems: 'center',
    elevation: 5
  },
  bannerTitle: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
  bannerSub: { color: '#FFF', fontSize: 13, marginVertical: 8, opacity: 0.9 },
  bannerBtn: { backgroundColor: '#FFF', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 12, alignSelf: 'flex-start' },
  bannerBtnText: { color: '#246BFD', fontWeight: 'bold', fontSize: 14 },
  bannerImg: { width: 90, height: 90, resizeMode: 'contain' },
  sectionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    marginTop: 10, 
    marginBottom: 15 
  },
  sectionTitle: { fontSize: 19, fontWeight: 'bold', color: '#333' },
  seeAll: { color: '#246BFD', fontWeight: '600' },
  specialtiesGrid: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 20 },
  specialtyItem: { alignItems: 'center', width: '22%' },
  iconBox: { 
    backgroundColor: '#FFF', 
    padding: 16, 
    borderRadius: 20, 
    marginBottom: 8,
    elevation: 2,
    shadowOpacity: 0.05
  },
  specialtyName: { fontSize: 12, fontWeight: 'bold', color: '#555' },
  doctorCard: { 
    flexDirection: 'row', 
    backgroundColor: '#FFF', 
    padding: 15, 
    borderRadius: 24, 
    marginHorizontal: 20, 
    marginBottom: 15, 
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1
  },
  docAvatar: { width: 100, height: 110, borderRadius: 20 },
  docInfo: { flex: 1, marginLeft: 15, justifyContent: 'space-between' },
  docHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  docName: { fontWeight: 'bold', fontSize: 17, color: '#333' },
  docSpec: { color: '#246BFD', fontSize: 14, fontWeight: '600' },
  bookBtn: { backgroundColor: '#246BFD', padding: 10, borderRadius: 12, marginTop: 5, alignItems: 'center' },
  bookBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
  
  // NOTES & MODALES
  noteCard: { backgroundColor: '#F0F6FF', padding: 15, borderRadius: 15, marginBottom: 12, width: '100%' },
  noteHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  noteDate: { fontSize: 12, color: '#246BFD', fontWeight: 'bold' },
  noteDoc: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  noteText: { fontSize: 14, color: '#666', lineHeight: 20 },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 40 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  callCard: { width: '85%', backgroundColor: '#FFF', borderRadius: 35, padding: 30, alignItems: 'center' },
  callIconBox: { backgroundColor: '#2ECC71', padding: 25, borderRadius: 30, marginBottom: 20 },
  callTitle: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  callSub: { textAlign: 'center', color: '#666', marginTop: 10, marginBottom: 30, lineHeight: 20 },
  callActionRow: { flexDirection: 'row', gap: 20 },
  declineBtn: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center' },
  acceptBtn: { flex: 1, height: 70, borderRadius: 35, backgroundColor: '#2ECC71', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12 },
  acceptText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  dividerSmall: { 
    width: '30%', 
    height: 2, 
    backgroundColor: '#D1E3FF', 
    marginVertical: 8, 
    borderRadius: 1 
  },
  

  detailModal: { width: '88%', backgroundColor: '#FFF', borderRadius: 35, padding: 25, alignItems: 'center' },
  closeModalBtn: { alignSelf: 'flex-end', padding: 5 },
  modalAvatar: { width: 110, height: 110, borderRadius: 55, marginBottom: 15, borderWidth: 4, borderColor: '#F0F6FF' },
  modalDocName: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  modalDocSpec: { fontSize: 17, color: '#246BFD', marginBottom: 20, fontWeight: '600' },
  divider: { width: '100%', height: 1, backgroundColor: '#F0F0F0', marginBottom: 20 },
  infoRow: { flexDirection: 'row', width: '100%', alignItems: 'center', marginBottom: 15, gap: 15 },
  infoIconBox: { width: 50, height: 50, backgroundColor: '#F0F6FF', borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  infoLabel: { fontSize: 13, color: '#999', fontWeight: '500' },
  infoValue: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  modalBookBtn: { backgroundColor: '#246BFD', width: '100%', padding: 18, borderRadius: 20, alignItems: 'center', marginTop: 15, elevation: 5 },
  modalBookBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 17 },

  sheetTitle: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 25, color: '#333' },
  subLabel: { fontSize: 15, fontWeight: 'bold', color: '#444', marginBottom: 12, marginTop: 5 },
  typeContainer: { flexDirection: 'row', gap: 15, marginBottom: 25 },
  typeCard: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16, borderRadius: 18, borderWidth: 2, borderColor: '#F0F0F0' },
  activeTypeCard: { backgroundColor: '#246BFD', borderColor: '#246BFD' },
  typeText: { color: '#666', fontWeight: 'bold', fontSize: 15 },
  activeTypeText: { color: '#FFF' },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 15 },
  slot: { width: '30%', padding: 14, borderRadius: 15, borderWidth: 1, borderColor: '#EEE', alignItems: 'center', backgroundColor: '#F9F9F9' },
  activeSlot: { backgroundColor: '#246BFD', borderColor: '#246BFD' },
  confirmBtn: { backgroundColor: '#246BFD', padding: 20, borderRadius: 22, marginTop: 35, alignItems: 'center', elevation: 8, shadowColor: '#246BFD', shadowOpacity: 0.3 },
  confirmBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 }
});