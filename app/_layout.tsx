// 1. IMPORT OBLIGATOIRE TOUT EN HAUT
import 'react-native-gesture-handler'; 
import { Stack } from 'expo-router';
import { ThemeProvider } from '../api/ThemeContext';
import { NotifProvider } from '../api/NotifContext';
// 2. IMPORT DU GESTURE HANDLER ROOT
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  return (
    // 3. ENVELOPPER TOUTE L'APPLICATION ICI
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <NotifProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
          </Stack>
        </NotifProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}