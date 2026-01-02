import React, { useEffect, useState } from 'react';
import { Tabs } from 'expo-router';
import { Users, Calendar, Home, User } from 'lucide-react-native';
import { supabase } from '../../api/supabase';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';

export default function TabLayout() {
  const [role, setRole] = useState<'doctor' | 'patient' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserRole();
  }, []);

  const fetchUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (data) {
          console.log("Rôle détecté :", data.role); // Pour déboguer
          setRole(data.role);
        }
      }
    } catch (error) {
      console.error("Erreur récupération rôle:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#246BFD" />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#246BFD',
        tabBarInactiveTintColor: '#999',
        headerShown: false,
        tabBarHideOnKeyboard: true, // Évite que la barre monte avec le clavier
        tabBarStyle: {
          position: 'absolute',      // Supprime la bande blanche en intégrant la barre
          bottom: 0,
          left: 0,
          right: 0,
          height: 95,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,         // Supprime la ligne de bordure
          elevation: 20,             // Ombre sur Android
          shadowColor: '#000',       // Ombre sur iOS
          shadowOffset: { width: 0, height: -10 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          paddingBottom: Platform.OS === 'ios' ? 20 : 10,
          paddingTop: 10,
        },
      }}
    >
      {/* ACCUEIL */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Accueil",
          tabBarIcon: ({ color }) => <Home color={color} size={24} />,
        }}
      />

      {/* PLANNING (Visible pour les Docteurs) */}
      <Tabs.Screen
        name="appointments"
        options={{
          title: "Planning",
          tabBarIcon: ({ color }) => <Calendar color={color} size={24} />,
          href: role === 'doctor' ? '/appointments' : null,
        }}
      />

      {/* PATIENTS (Visible pour les Docteurs) */}
      <Tabs.Screen
        name="patients"
        options={{
          title: "Patients",
          tabBarIcon: ({ color }) => <Users color={color} size={24} />,
          href: role === 'doctor' ? '/patients' : null,
        }}
      />

      {/* MES RDV (Visible pour les Patients) */}
      <Tabs.Screen
  name="appointmentsPatient"
  options={{
    title: "Mes RDV",
    tabBarIcon: ({ color }) => <Calendar color={color} size={24} />,
    // FORCE L'AFFICHAGE POUR TESTER
    href: role === 'patient' ? '/appointmentsPatient' : null, 
  }}
/>

      {/* PROFIL */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ color }) => <User color={color} size={24} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});