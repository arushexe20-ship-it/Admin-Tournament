import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { getTournaments } from '../../src/services/tournaments';
import { LoadingSpinner } from '../../src/components/LoadingSpinner';
import { ErrorMessage } from '../../src/components/ErrorMessage';
import { formatCurrency, formatDate } from '../../src/utils/formatting';

export default function PlayerHomeScreen() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    setError('');
    const result = await getTournaments('registration_open');
    if (result.success) {
      setTournaments(result.data);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Admin Tournament</Text>
        <Text style={styles.subText}>Join exciting tournaments and win prizes!</Text>
      </View>

      {error && <ErrorMessage message={error} />}

      <Text style={styles.sectionTitle}>Open Tournaments</Text>

      {tournaments.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No open tournaments right now</Text>
        </View>
      ) : (
        <FlatList
          data={tournaments}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push({
                pathname: '/(player)/tournament-details',
                params: { id: item.id },
              })}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>OPEN</Text>
                </View>
              </View>

              <Text style={styles.organizer}>{item.organizer}</Text>

              <View style={styles.cardDetails}>
                <View style={styles.detail}>
                  <Text style={styles.detailLabel}>Entry Fee</Text>
                  <Text style={styles.detailValue}>{formatCurrency(item.entryFee)}</Text>
                </View>
                <View style={styles.detail}>
                  <Text style={styles.detailLabel}>Prize Pool</Text>
                  <Text style={styles.detailValue}>{formatCurrency(item.prizeMoney)}</Text>
                </View>
              </View>

              <View style={styles.slots}>
                <Text style={styles.slotText}>{item.joinedSlots}/{item.totalSlots} Slots</Text>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${(item.joinedSlots / item.totalSlots) * 100}%` },
                    ]}
                  />
                </View>
              </View>

              <TouchableOpacity style={styles.joinButton}>
                <Text style={styles.joinButtonText}>JOIN NOW</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )}
          scrollEnabled={false}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subText: {
    fontSize: 14,
    color: '#999',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    paddingHorizontal: 20,
    marginVertical: 20,
  },
  card: {
    backgroundColor: '#2a2a2a',
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 12,
    padding: 15,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  statusBadge: {
    backgroundColor: '#ff6b35',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  organizer: {
    color: '#999',
    fontSize: 12,
    marginBottom: 10,
  },
  cardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  detail: {
    flex: 1,
  },
  detailLabel: {
    color: '#666',
    fontSize: 12,
    marginBottom: 4,
  },
  detailValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  slots: {
    marginBottom: 10,
  },
  slotText: {
    color: '#999',
    fontSize: 12,
    marginBottom: 5,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#1a1a1a',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ff6b35',
  },
  joinButton: {
    backgroundColor: '#ff6b35',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  joinButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
  },
});
