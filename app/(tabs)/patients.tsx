import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator,
  StatusBar
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Search, User, ChevronRight, Users } from 'lucide-react-native';
import { supabase } from '../../api/supabase';
import { useTheme } from '../../api/ThemeContext';

export default function PatientsScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  
  // États
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  // Recharger la liste quand l'onglet devient actif
  useFocusEffect(
    useCallback(() => {
      fetchPatients();
    }, [])
  );

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Récupérer tous les patients ayant eu un RDV avec ce docteur
        const { data, error } = await supabase
          .from('appointments')
          .select('patient_id, patient_name')
          .eq('doctor_id', user.id);
        
        if (error) throw error;

        if (data) {
          // Filtrer pour n'avoir que des patients uniques (par ID)
          const uniqueMap = new Map();
          data.forEach(item => {
            if (!uniqueMap.has(item.patient_id)) {
              uniqueMap.set(item.patient_id, item);
            }
          });
          setPatients(Array.from(uniqueMap.values()));
        }
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des patients:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrage par recherche
  const filteredPatients = patients.filter(p => 
    p.patient_name?.toLowerCase().includes(search.toLowerCase())
  );

  // Styles dynamiques selon le mode sombre
  const themeStyles = {
    container: { backgroundColor: isDarkMode ? '#121212' : '#F8F9FA' },
    card: { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFF' },
    text: { color: isDarkMode ? '#FFF' : '#333' },
    subText: { color: isDarkMode ? '#AAA' : '#666' },
    searchBar: { backgroundColor: isDarkMode ? '#2C2C2C' : '#FFF' }
  };

  return (
    <View style={[styles.container, themeStyles.container]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      <View style={styles.header}>
        <Text style={[styles.title, themeStyles.text]}>Mes Patients</Text>
        <Text style={[styles.subtitle, themeStyles.subText]}>
          {patients.length} patient{patients.length > 1 ? 's' : ''} au total
        </Text>
      </View>

      {/* Barre de recherche */}
      <View style={[styles.searchContainer, themeStyles.searchBar]}>
        <Search size={20} color={isDarkMode ? "#AAA" : "#666"} />
        <TextInput 
          style={[styles.searchInput, { color: themeStyles.text.color }]} 
          placeholder="Rechercher par nom..." 
          placeholderTextColor={isDarkMode ? "#666" : "#999"}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#246BFD" />
        </View>
      ) : (
        <FlatList 
          data={filteredPatients}
          keyExtractor={(item) => item.patient_id.toString()}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[styles.patientCard, themeStyles.card]}
              onPress={() => router.push({
                pathname: "/patients/[id]",
                params: { id: item.patient_id, name: item.patient_name }
              })}
            >
              <View style={[styles.avatar, { backgroundColor: isDarkMode ? '#2C2C2C' : '#F0F5FF' }]}>
                <User color="#246BFD" size={24} />
              </View>
              
              <View style={styles.info}>
                <Text style={[styles.patientName, themeStyles.text]}>{item.patient_name}</Text>
                <Text style={[styles.historyLabel, { color: '#246BFD' }]}>Voir l'historique médical</Text>
              </View>

              <ChevronRight color={isDarkMode ? "#555" : "#CCC"} size={20} />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Users size={50} color={isDarkMode ? "#333" : "#EEE"} />
              <Text style={[styles.emptyText, themeStyles.subText]}>
                {search ? "Aucun résultat pour cette recherche." : "Vous n'avez pas encore de patients."}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60 },
  header: { paddingHorizontal: 20, marginBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold' },
  subtitle: { fontSize: 14, marginTop: 4 },
  searchContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginHorizontal: 20, 
    paddingHorizontal: 15, 
    borderRadius: 15, 
    height: 50, 
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16 },
  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  patientCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 15, 
    borderRadius: 15, 
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2
  },
  avatar: { 
    width: 55, 
    height: 55, 
    borderRadius: 27.5, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  info: { flex: 1, marginLeft: 15 },
  patientName: { fontSize: 17, fontWeight: 'bold' },
  historyLabel: { fontSize: 13, marginTop: 4, fontWeight: '500' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  emptyText: { marginTop: 15, fontSize: 16, textAlign: 'center' }
});