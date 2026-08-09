import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { getTournaments } from '../../src/services/tournaments';
import { LoadingSpinner } from '../../src/components/LoadingSpinner';
import { formatCurrency } from '../../src/utils/formatting';

export default function PlayerTournamentsScreen() {
  const [tournaments, setTournaments] = useState([]);
  const [filteredTournaments, setFilteredTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    loadTournaments();
  }, []);

  useEffect(() => {
    filterTournaments();
  }, [tournaments, searchQuery, selectedStatus]);

  const loadTournaments = async () => {
    const result = await getTournaments();
    if (result.success) {
      setTournaments(result.data);
    }
    setLoading(false);
  };

  const filterTournaments = () => {
    let filtered = tournaments;

    if (searchQuery) {
      filtered = filtered.filter((t) =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter((t) => t.status === selectedStatus);
    }

    setFilteredTournaments(filtered);
  };

  if (loading) return <LoadingSpinner />;

  const statusOptions = [
    { key: 'all', label: 'All' },
    { key: 'registration_open', label: 'Open' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'live', label: 'Live' },
    { key: 'completed', label: 'Completed' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search tournaments..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView horizontal style={styles.filterContainer} showsHorizontalScrollIndicator={false}>
        {statusOptions.map((status) => (
          <TouchableOpacity
            key={status.key}
            style={[
              styles.filterButton,
              selectedStatus === status.key && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedStatus(status.key)}
          >
            <Text
              style={[
                styles.filterText,
                selectedStatus === status.key && styles.filterTextActive,
              ]}
            >
              {status.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.contentContainer}>
        {filteredTournaments.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No tournaments found</Text>
          </View>
        ) : (
          filteredTournaments.map((tournament) => (
            <View key={tournament.id} style={styles.card}>
              <Text style={styles.cardTitle}>{tournament.name}</Text>
              <Text style={styles.cardSubtitle}>{tournament.organizer}</Text>

              <View style={styles.info}>
                <Text style={styles.infoLabel}>Entry: {formatCurrency(tournament.entryFee)}</Text>
                <Text style={styles.infoLabel}>Prize: {formatCurrency(tournament.prizeMoney)}</Text>
              </View>

              <Text style={styles.status}>Status: {tournament.status.toUpperCase()}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  searchContainer: {
    padding: 15,
  },
  searchInput: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
  },
  filterContainer: {
    paddingHorizontal: 15,
    paddingBottom: 10,
  },
  filterButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  filterButtonActive: {
    backgroundColor: '#ff6b35',
    borderColor: '#ff6b35',
  },
  filterText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#fff',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 15,
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
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#999',
    marginBottom: 10,
  },
  info: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    color: '#ff6b35',
    fontSize: 12,
    fontWeight: '600',
  },
  status: {
    color: '#666',
    fontSize: 11,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
  },
});
