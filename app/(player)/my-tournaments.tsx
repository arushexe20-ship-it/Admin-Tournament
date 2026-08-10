import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { getMyTournaments } from '../../src/services/tournaments';
import { useAuthStore } from '../../src/stores/authStore';
import { LoadingSpinner } from '../../src/components/LoadingSpinner';
import { ErrorMessage } from '../../src/components/ErrorMessage';
import { formatDate } from '../../src/utils/formatting';

export default function PlayerMyTournamentsScreen() {
  const { user } = useAuthStore();
  const [myTournaments, setMyTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadMyTournaments();
  }, [user]);

  const loadMyTournaments = async () => {
    if (!user?.id) return;

    const result = await getMyTournaments(user.id);
    if (result.success) {
      setMyTournaments(result.data);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>My Tournaments</Text>

      {error && <ErrorMessage message={error} />}

      {myTournaments.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>You haven't joined any tournaments yet</Text>
        </View>
      ) : (
        myTournaments.map((tournament) => (
          <TouchableOpacity key={tournament.id} style={styles.card}>
            <Text style={styles.cardTitle}>{tournament.tournaments?.name}</Text>
            <Text style={styles.joinId}>ID: {tournament.joinId}</Text>

            <View style={styles.details}>
              <View>
                <Text style={styles.label}>Slot</Text>
                <Text style={styles.value}>{tournament.slotNumber}</Text>
              </View>
              <View>
                <Text style={styles.label}>Payment Status</Text>
                <Text style={[styles.value, { color: '#ff6b35' }]}>
                  {tournament.paymentStatus.toUpperCase()}
                </Text>
              </View>
              <View>
                <Text style={styles.label}>Verification</Text>
                <Text style={[styles.value, { color: '#4CAF50' }]}>
                  {tournament.verificationStatus.toUpperCase()}
                </Text>
              </View>
            </View>

            {tournament.tournaments?.roomReleased ? (
              <TouchableOpacity style={styles.viewRoomButton}>
                <Text style={styles.viewRoomText}>VIEW ROOM DETAILS</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.lockedBadge}>
                <Text style={styles.lockedText}>🔒 ROOM LOCKED</Text>
              </View>
            )}
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  joinId: {
    color: '#ff6b35',
    fontSize: 12,
    marginBottom: 10,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  label: {
    color: '#666',
    fontSize: 11,
    marginBottom: 3,
  },
  value: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  viewRoomButton: {
    backgroundColor: '#ff6b35',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  viewRoomText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  lockedBadge: {
    backgroundColor: '#333',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  lockedText: {
    color: '#666',
    fontWeight: 'bold',
    fontSize: 12,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 14,
  },
});
