import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useAuthStore } from '../../src/stores/authStore';
import { updateUserName, updatePlayerProfile } from '../../src/services/auth';
import { logout } from '../../src/services/auth';
import { useRouter } from 'expo-router';
import { LoadingSpinner } from '../../src/components/LoadingSpinner';
import { ErrorMessage } from '../../src/components/ErrorMessage';

export default function PlayerProfileScreen() {
  const router = useRouter();
  const { user, logout: logoutStore } = useAuthStore();
  const [fullName, setFullName] = useState(user?.name || '');
  const [gameName, setGameName] = useState('');
  const [gameUid, setGameUid] = useState('');
  const [upiId, setUpiId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSaveProfile = async () => {
    setError('');
    setSuccess('');

    if (!fullName || !gameName || !gameUid || !upiId) {
      setError('All fields are required');
      return;
    }

    setLoading(true);

    // Update full name
    await updateUserName(user!.id, fullName);

    // Update player profile
    const result = await updatePlayerProfile(user!.id, gameName, gameUid, upiId);

    setLoading(false);

    if (!result.success) {
      setError(result.error);
    } else {
      setSuccess('Profile updated successfully!');
    }
  };

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      logoutStore();
      router.replace('/(auth)/login');
    }
  };

  if (!user) return <LoadingSpinner />;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user.name?.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.email}>{user.email}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Information</Text>

        {error && <ErrorMessage message={error} />}
        {success && <View style={styles.successBox}><Text style={styles.successText}>✓ {success}</Text></View>}

        <TextInput
          style={styles.input}
          placeholder="Full Name"
          placeholderTextColor="#666"
          value={fullName}
          onChangeText={setFullName}
        />

        <Text style={styles.sectionTitle}>Game Information</Text>

        <TextInput
          style={styles.input}
          placeholder="Game Name"
          placeholderTextColor="#666"
          value={gameName}
          onChangeText={setGameName}
        />

        <TextInput
          style={styles.input}
          placeholder="Game UID"
          placeholderTextColor="#666"
          value={gameUid}
          onChangeText={setGameUid}
        />

        <Text style={styles.sectionTitle}>Payment Information</Text>

        <TextInput
          style={styles.input}
          placeholder="UPI ID (e.g., name@upi)"
          placeholderTextColor="#666"
          value={upiId}
          onChangeText={setUpiId}
        />

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSaveProfile}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'SAVING...' : 'SAVE PROFILE'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>LOGOUT</Text>
        </TouchableOpacity>
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
    alignItems: 'center',
    paddingVertical: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ff6b35',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
  },
  email: {
    color: '#999',
    fontSize: 14,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
    marginBottom: 15,
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
  },
  successBox: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  successText: {
    color: '#fff',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#ff6b35',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: '#333',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  logoutButtonText: {
    color: '#ff6b35',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
