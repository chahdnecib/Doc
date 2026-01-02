import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';

interface DoctorMapProps {
  doctors: any[];
}

export default function DoctorMap({ doctors }: DoctorMapProps) {
  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 35.5559, // Batna
          longitude: 6.1743,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {doctors.map((doc) => (
          <Marker
            key={doc.id}
            coordinate={{ 
              latitude: parseFloat(doc.latitude), 
              longitude: parseFloat(doc.longitude) 
            }}
          >
            <Callout>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle}>Dr. {doc.full_name}</Text>
                <Text style={styles.calloutSub}>{doc.specialty}</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: '100%', height: '100%' },
  callout: { padding: 5, minWidth: 120 },
  calloutTitle: { fontWeight: 'bold', fontSize: 14 },
  calloutSub: { color: '#666', fontSize: 12 }
});