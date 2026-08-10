import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/stores/authStore';

export default function IndexScreen() {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.replace('/(player)/home');
      } else {
        router.replace('/(auth)/login');
      }
    }
  }, [user, isLoading]);

  return null;
}
