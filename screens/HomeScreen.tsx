import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Platform, SafeAreaView, Dimensions, FlatList, TouchableOpacity, Button } from 'react-native';
import MapView from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface RideRequest {
  id: string;
  destination?: string;
  riderName?: string;
  [key: string]: any;
}

export default function HomeScreen() {
  const [rideRequests, setRideRequests] = useState<RideRequest[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  const [acceptedRide, setAcceptedRide] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setRideRequests([]);
      return;
    }
    const q = query(collection(db, 'rides'), where('status', '==', 'waiting'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const rides = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setRideRequests(rides);
    });
    return () => unsubscribe();
  }, [isOnline]);

  const acceptRide = async (rideId: string, rideData: any) => {
    try {
      const rideRef = doc(db, 'rides', rideId);
      await updateDoc(rideRef, {
        status: 'accepted',
        driverId: 'driver123',
      });
      setAcceptedRide({ id: rideId, ...rideData });
      setShowModal(true);
      console.log('✅ Ride accepted');
    } catch (e) {
      console.error('❌ Failed to accept ride:', e);
    }
  };

  const declineRide = (rideId: string) => {
    setRideRequests((prev) => prev.filter((ride) => ride.id !== rideId));
    console.log('❌ Ride declined:', rideId);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Map as background */}
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: 34.0007,
            longitude: -81.0348,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          showsUserLocation
          showsMyLocationButton
        />
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>SafeRides Driver</Text>
          <Text style={styles.headerSubtitle}>Welcome back!</Text>
        </View>
        {/* Ride Requests Overlay (only when online) */}
        {isOnline && rideRequests.length > 0 && (
          <View style={styles.requestsOverlay}>
            <Text style={styles.requestsTitle}>Incoming Ride Requests:</Text>
            <FlatList
              data={rideRequests}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={{ marginBottom: 15, padding: 10, backgroundColor: '#f0f0f0', borderRadius: 8 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600' }}>
                    Rider going to: {item.destination}
                  </Text>
                  <View style={{ flexDirection: 'row', marginTop: 10, gap: 10 }}>
                    <TouchableOpacity
                      onPress={() => acceptRide(item.id, item)}
                      style={{ backgroundColor: '#4CAF50', padding: 10, borderRadius: 5 }}
                    >
                      <Text style={{ color: 'white' }}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => declineRide(item.id)}
                      style={{ backgroundColor: '#FF5E5E', padding: 10, borderRadius: 5 }}
                    >
                      <Text style={{ color: 'white' }}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          </View>
        )}
        {/* Card and Stats at Bottom */}
        <View style={styles.bottomContainer} pointerEvents="box-none">
          <View style={styles.statusRow}>
            <Ionicons name={isOnline ? 'ellipse' : 'ellipse-outline'} size={16} color={isOnline ? '#4CAF50' : '#888'} style={{ marginRight: 8 }} />
            <Text style={[styles.statusText, { color: isOnline ? '#4CAF50' : '#888' }]}>
              {isOnline ? 'You are Online' : 'You are Offline'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setIsOnline(!isOnline)}
            style={[
              styles.goOnlineBtn,
              { backgroundColor: isOnline ? '#FF5E5E' : '#4CAF50' },
            ]}
          >
            <Text style={styles.goOnlineText}>{isOnline ? 'Go Offline' : 'Go Online'}</Text>
          </TouchableOpacity>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Today's Trips</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>$0</Text>
              <Text style={styles.statLabel}>Today's Earnings</Text>
            </View>
          </View>
        </View>
        {/* Rider Info Modal */}
        {showModal && acceptedRide && (
          <View style={styles.modalContainer}>
            {/* Drag indicator */}
            <View style={styles.dragIndicator} />
            <Text style={styles.modalTitle}>Rider Info</Text>
            <View style={styles.modalInfoRow}>
              <Ionicons name="person-circle" size={32} color="#1976D2" style={{ marginRight: 10 }} />
              <Text style={styles.modalInfoText}>
                {acceptedRide.riderName || 'Student'}
              </Text>
            </View>
            <View style={styles.modalInfoRow}>
              <Ionicons name="location" size={28} color="#4CAF50" style={{ marginRight: 10 }} />
              <Text style={styles.modalInfoText}>
                Destination: {acceptedRide.destination}
              </Text>
            </View>
            <View style={{ flex: 1 }} />
            <TouchableOpacity style={styles.closeModalBtn} onPress={() => setShowModal(false)}>
              <Text style={styles.closeModalBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const HEADER_HEIGHT = 90;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A3D91',
  },
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
    justifyContent: 'flex-start',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  header: {
    backgroundColor: '#0A3D91',
    paddingTop: Platform.OS === 'ios' ? 16 : 24,
    paddingBottom: 16,
    paddingHorizontal: 20,
    justifyContent: 'center',
    zIndex: 2,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: '#fff',
    fontSize: 16,
  },
  requestsOverlay: {
    position: 'absolute',
    top: HEADER_HEIGHT + 10,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.95)',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 12,
    zIndex: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  requestsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#232e7a',
  },
  requestCard: {
    backgroundColor: '#f2f6ff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  requestText: {
    fontSize: 16,
    color: '#222',
  },
  bottomContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: Platform.OS === 'ios' ? 24 : 16,
    alignItems: 'center',
    zIndex: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  goOnlineBtn: {
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    width: '90%',
    marginBottom: 16,
  },
  goOnlineText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    width: '90%',
    justifyContent: 'space-between',
    marginBottom: 0,
  },
  statBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    flex: 1,
    alignItems: 'center',
    padding: 18,
    marginHorizontal: 6,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  statValue: {
    color: '#1976D2',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statLabel: {
    color: '#888',
    fontSize: 14,
  },
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 10,
    elevation: 10,
    zIndex: 10,
    height: Math.round(SCREEN_HEIGHT * 0.65),
    justifyContent: 'flex-start',
  },
  dragIndicator: {
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#e0e0e0',
    alignSelf: 'center',
    marginBottom: 18,
    marginTop: 2,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#232e7a',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  modalInfoText: {
    fontSize: 18,
    color: '#222',
    fontWeight: '500',
  },
  closeModalBtn: {
    backgroundColor: '#1976D2',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  closeModalBtnText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
}); 