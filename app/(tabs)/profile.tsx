import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Switch, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../api/ThemeContext'; 
import { useNotifs } from '../../api/NotifContext'; // On utilise le context ici
import { supabase } from '../../api/supabase';
import { User, Moon, Bell, LogOut, ChevronRight } from 'lucide-react-native';

export default function ProfileScreen() {
  const router = useRouter();
  const { isDarkMode, toggleTheme } = useTheme();
  const { isNotifEnabled, toggleNotifs } = useNotifs(); // Récupération globale
  
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [])
  );

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const themeStyles = {
    container: { backgroundColor: isDarkMode ? '#121212' : '#F8F9FA' },
    card: { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFF' },
    text: { color: isDarkMode ? '#FFF' : '#333' },
    subText: { color: isDarkMode ? '#AAA' : '#666' }
  };

  if (loading) return <ActivityIndicator style={{flex: 1}} color="#246BFD" size="large" />;

  return (
    <ScrollView style={[styles.container, themeStyles.container]}>
      {/* Header */}
      <View style={[styles.header, themeStyles.card]}>
        <Image source={require('../../assets/images/logo.png')} style={styles.avatar} />
        <Text style={[styles.userName, themeStyles.text]}>{profile?.full_name || 'Chargement...'}</Text>
        <Text style={[styles.userRole, themeStyles.subText]}>
           {profile?.role === 'doctor' ? `Docteur - ${profile?.specialty}` : 'Patient'}
        </Text>
      </View>

      {/* Paramètres */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, themeStyles.text]}>Paramètres</Text>
        
        {/* Infos Personnelles */}
        <TouchableOpacity 
          style={[styles.item, themeStyles.card]} 
          onPress={() => router.push('/profile/edit-info')}
        >
          <View style={styles.itemLeft}>
            <View style={styles.iconContainer}><User size={20} color="#246BFD" /></View>
            <Text style={[styles.itemLabel, themeStyles.text]}>Informations personnelles</Text>
          </View>
          <ChevronRight size={20} color="#CCC" />
        </TouchableOpacity>

        {/* Notifications - UTILISE toggleNotifs du context */}
        <View style={[styles.item, themeStyles.card]}>
          <View style={styles.itemLeft}>
            <View style={styles.iconContainer}><Bell size={20} color="#246BFD" /></View>
            <Text style={[styles.itemLabel, themeStyles.text]}>Notifications</Text>
          </View>
          <Switch 
            value={isNotifEnabled} 
            onValueChange={toggleNotifs} 
            trackColor={{ false: "#EEE", true: "#246BFD" }}
            thumbColor="#FFF"
          />
        </View>

        {/* Mode Sombre */}
        <View style={[styles.item, themeStyles.card]}>
          <View style={styles.itemLeft}>
            <View style={styles.iconContainer}><Moon size={20} color="#246BFD" /></View>
            <Text style={[styles.itemLabel, themeStyles.text]}>Mode sombre</Text>
          </View>
          <Switch 
            value={isDarkMode} 
            onValueChange={toggleTheme} 
            trackColor={{ false: "#EEE", true: "#246BFD" }}
            thumbColor="#FFF"
          />
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.logoutBtn, themeStyles.card]} 
        onPress={() => supabase.auth.signOut().then(() => router.replace('/(auth)/login'))}
      >
        <LogOut size={20} color="#FF4D4D" />
        <Text style={styles.logoutText}>Déconnexion</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'center', padding: 30, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, elevation: 2 },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 15, borderWidth: 3, borderColor: '#246BFD' },
  userName: { fontSize: 22, fontWeight: 'bold' },
  userRole: { fontSize: 14, marginTop: 5 },
  section: { marginTop: 25, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
  item: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, borderRadius: 15, marginBottom: 10 },
  itemLeft: { flexDirection: 'row', alignItems: 'center' },
  iconContainer: { width: 40, height: 40, backgroundColor: '#F0F5FF', borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  itemLabel: { fontSize: 15, fontWeight: '500' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 40, padding: 15, marginHorizontal: 20, borderRadius: 15, marginBottom: 40 },
  logoutText: { color: '#FF4D4D', fontWeight: 'bold', marginLeft: 10 }
});