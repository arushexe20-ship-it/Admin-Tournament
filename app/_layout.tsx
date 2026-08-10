import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '../src/stores/authStore';
import { getCurrentUser, isAdmin } from '../src/services/supabase';

// Import Screens
import LoginScreen from './(auth)/login';
import SignupScreen from './(auth)/signup';
import PlayerHomeScreen from './(player)/home';
import PlayerTournamentsScreen from './(player)/tournaments';
import PlayerMyTournamentsScreen from './(player)/my-tournaments';
import PlayerProfileScreen from './(player)/profile';
import AdminDashboardScreen from './(admin)/dashboard';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animationEnabled: true,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
  );
}

function PlayerStack() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#ff6b35',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: { backgroundColor: '#1a1a1a', borderTopColor: '#333' },
      }}
    >
      <Tab.Screen
        name="Home"
        component={PlayerHomeScreen}
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen
        name="Tournaments"
        component={PlayerTournamentsScreen}
        options={{
          title: 'Tournaments',
          tabBarLabel: 'Tournaments',
        }}
      />
      <Tab.Screen
        name="MyTournaments"
        component={PlayerMyTournamentsScreen}
        options={{
          title: 'My Games',
          tabBarLabel: 'My Games',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={PlayerProfileScreen}
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
}

function AdminStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#1a1a1a' },
        headerTintColor: '#ff6b35',
        headerTitleStyle: { color: '#fff', fontWeight: 'bold' },
      }}
    >
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ title: 'Dashboard' }} />
    </Stack.Navigator>
  );
}

export default function RootLayout() {
  const { user, setUser, setLoading } = useAuthStore();
  const [isAdminUser, setIsAdminUser] = React.useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setUser({
            id: currentUser.id,
            email: currentUser.email || '',
            name: 'User',
            role: 'player',
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          
          const adminStatus = await isAdmin(currentUser.id);
          setIsAdminUser(adminStatus);
        }
      } catch (error) {
        console.error('Auth init error:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  if (!user) {
    return <AuthStack />;
  }

  return isAdminUser ? <AdminStack /> : <PlayerStack />;
}
