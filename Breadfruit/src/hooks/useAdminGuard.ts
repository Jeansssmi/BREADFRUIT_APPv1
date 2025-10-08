// hooks/useAdminGuard.ts
import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';
import { useEffect } from 'react';

export const useAdminGuard = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role !== 'admin') {
      router.replace('/(auth)/login'); // Redirect to login if not admin
    }
  }, [user?.role]);
};