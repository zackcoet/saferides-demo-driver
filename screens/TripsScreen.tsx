import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const trips = [
  {
    id: '1',
    status: 'Completed',
    statusColor: '#2ecc40',
    pickup: '123 Main St',
    dropoff: '456 Oak Ave',
    date: '2024-04-23',
    fare: 25.5,
  },
  {
    id: '2',
    status: 'Cancelled',
    statusColor: '#ff4136',
    pickup: '789 Pine Rd',
    dropoff: '321 Elm St',
    date: '2024-04-22',
    fare: 0.0,
  },
  {
    id: '3',
    status: 'Completed',
    statusColor: '#2ecc40',
    pickup: 'USC Campus',
    dropoff: 'Five Points',
    date: '2024-04-21',
    fare: 15.75,
  },
  {
    id: '4',
    status: 'Completed',
    statusColor: '#2ecc40',
    pickup: 'Williams Brice Stadium',
    dropoff: 'The Vista',
    date: '2024-04-20',
    fare: 18.0,
  },
];

const statusDot = (color: string) => (
  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color, marginRight: 6 }} />
);

export default function TripsScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Trips</Text>
      </View>
      <FlatList
        data={trips}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {statusDot(item.statusColor)}
                <Text style={[styles.status, { color: '#222', fontWeight: 'bold' }]}>{item.status}</Text>
              </View>
              <Text style={styles.date}>{item.date}</Text>
            </View>
            <View style={styles.locationRow}>
              <Ionicons name="location-sharp" size={18} color="#1976D2" style={{ marginRight: 4 }} />
              <Text style={styles.locationText}>{item.pickup}</Text>
            </View>
            <View style={styles.locationRow}>
              <Ionicons name="location-sharp" size={18} color="#ff4136" style={{ marginRight: 4 }} />
              <Text style={styles.locationText}>{item.dropoff}</Text>
            </View>
            <View style={styles.fareRow}>
              <Text style={styles.fareLabel}>Fare:</Text>
              <Text style={styles.fareValue}>${item.fare.toFixed(2)}</Text>
            </View>
          </View>
        )}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  header: {
    backgroundColor: '#232e7a',
    paddingTop: 48,
    paddingBottom: 18,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 18,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  status: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  date: {
    color: '#888',
    fontSize: 15,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    marginLeft: 2,
  },
  locationText: {
    fontSize: 16,
    color: '#222',
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  fareLabel: {
    color: '#888',
    fontSize: 16,
  },
  fareValue: {
    color: '#232e7a',
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 