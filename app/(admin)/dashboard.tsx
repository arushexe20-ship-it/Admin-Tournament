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
import { getPaymentStats } from '../../src/services/payments';
import { LoadingSpinner } from '../../src/components/LoadingSpinner';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    const tournamentsResult = await getTournaments();
    const statsResult = await getPaymentStats();

    if (tournamentsResult.success) {
      setTournaments(tournamentsResult.data);
    }

    if (statsResult.success) {
      setStats(statsResult.data);
    }

    setLoading(false);
  };

  if (loading) return <LoadingSpinner />;

  const activeTournaments = tournaments.filter(
    (t) => t.status === 'registration_open' || t.status === 'live'
  );

  const StatCard = ({ label, value, color }: any) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Dashboard</Text>
        <Text style={styles.subtitle}>Tournament Management</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsGrid}>
        <StatCard label="Active Tournaments" value={activeTournaments.length} color="#ff6b35" />
        <StatCard label="Total Tournaments" value={tournaments.length} color="#4CAF50" />
        <StatCard label="Pending Payments" value={stats.pending || 0} color="#FFC107" />
        <StatCard label="Verified Payments" value={stats.verified || 0} color="#4CAF50" />
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/(admin)/tournaments/create')}
        >
          <Text style={styles.actionButtonText}>➕ Create Tournament</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/(admin)/tournaments/manage')}
        >
          <Text style={styles.actionButtonText}>📋 Manage Tournaments</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/(admin)/payments')}
        >
          <Text style={styles.actionButtonText}>💳 Verify Payments</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/(admin)/players')}
        >
          <Text style={styles.actionButtonText}>👥 Manage Players</Text>
        </TouchableOpacity>
      </View>

      {/* Active Tournaments */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Active Tournaments</Text>

        {activeTournaments.length === 0 ? (
          <Text style={styles.emptyText}>No active tournaments</Text>
        ) : (
          <FlatList
            data={activeTournaments.slice(0, 5)}
            renderItem={({ item }) => (
              <View style={styles.tournamentItem}>
                <Text style={styles.itemTitle}>{item.name}</Text>
                <Text style={styles.itemSubtitle}>{item.joinedSlots}/{item.totalSlots} Joined</Text>
              </View>
            )}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        )}
      </View>
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
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    color: '#ff6b35',
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 8,
    margin: '1%',
    borderLeftWidth: 4,
  },
  statLabel: {
    color: '#999',
    fontSize: 12,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  actionButton: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#ff6b35',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  tournamentItem: {
    backgroundColor: '#2a2a2a',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  itemTitle: {
    color: '#fff',
    fontWeight: '600',
    marginBottom: 3,
  },
  itemSubtitle: {
    color: '#666',
    fontSize: 12,
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
    padding: 20,
  },
});
