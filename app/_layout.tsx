import { Stack } from 'expo-router';
import { ThemeProvider } from '../api/ThemeContext';
import { NotifProvider } from '../api/NotifContext';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <NotifProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
        </Stack>
      </NotifProvider>
    </ThemeProvider>
  );
}