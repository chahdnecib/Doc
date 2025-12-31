import React, { useEffect, useState } from 'react';
import { Tabs } from 'expo-router';
import { Users, Calendar, Home, User, Search } from 'lucide-react-native';
import { supabase } from '../../api/supabase';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

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
        tabBarStyle: {
          height: 85,
          paddingBottom: 10,
          paddingTop: 5,
        },
      }}
    >
      {/* --- ONGLET ACCUEIL (Commun aux deux) --- */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Accueil",
          tabBarIcon: ({ color }) => <Home color={color} size={24} />,
        }}
      />

      {/* --- ONGLETS DOCTEUR --- */}
      <Tabs.Screen
        name="appointments"
        options={{
          title: "Planning",
          tabBarIcon: ({ color }) => <Calendar color={color} size={24} />,
          // Affiché seulement si Docteur, sinon caché
          href: role === 'doctor' ? '/appointments' : null,
        }}
      />

      <Tabs.Screen
        name="patients"
        options={{
          title: "Mes Patients",
          tabBarIcon: ({ color }) => <Users color={color} size={24} />,
          href: role === 'doctor' ? '/patients' : null,
        }}
      />

      {/* --- ONGLETS PATIENT --- */}

      <Tabs.Screen
        name="appointmentsPatient"
        options={{
          title: "Mes RDV",
          tabBarIcon: ({ color }) => <Calendar color={color} size={24} />,
          href: role === 'patient' ? '/appointmentsPatient' : null,
        }}
      />

      {/* --- ONGLET PROFIL (Commun aux deux) --- */}
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