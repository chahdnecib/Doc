import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NotifContext = createContext({
  isNotifEnabled: true,
  toggleNotifs: async (val: boolean) => {},
});

export const NotifProvider = ({ children }: any) => {
  const [isNotifEnabled, setIsNotifEnabled] = useState(true);

  // Charger la sauvegarde au démarrage de l'app
  useEffect(() => {
    const loadSettings = async () => {
      const val = await AsyncStorage.getItem('notifEnabled');
      if (val !== null) {
        setIsNotifEnabled(val === 'true'); // Convertit le texte "true"/"false" en booléen
      }
    };
    loadSettings();
  }, []);

  const toggleNotifs = async (val: boolean) => {
    setIsNotifEnabled(val);
    await AsyncStorage.setItem('notifEnabled', val.toString());
  };

  return (
    <NotifContext.Provider value={{ isNotifEnabled, toggleNotifs }}>
      {children}
    </NotifContext.Provider>
  );
};

export const useNotifs = () => useContext(NotifContext);