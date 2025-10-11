import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { View } from 'react-native';
import Keychain from 'react-native-keychain';
import { ActivityIndicator } from 'react-native-paper';

import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const AuthContext = createContext<any>(null);
const KEYCHAIN_SERVICE = 'com.breadfruit.usersession';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [initialized, setInitialized] = useState(false);

  const isAuthenticated = !!user;

  const fetchUserData = useCallback(async (firebaseUser: any) => {
    if (!firebaseUser) return null;
    try {
      const docSnap = await firestore().collection('users').doc(firebaseUser.uid).get();
      if (docSnap.exists) {
        const data = docSnap.data();
        return {
          uid: firebaseUser.uid,
          name: data?.name,
          email: data?.email,
          role: data?.role,
          status: data?.status,
          image: data?.image,
          joined: data?.joined,
        };
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    }
    return null;
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const credential = await auth().signInWithEmailAndPassword(email, password);
      const firebaseUser = credential.user;
      const userData = await fetchUserData(firebaseUser);

      // ✅ FIX: Check user status after fetching data
      if (userData && userData.status === 'pending') {
        // If pending, sign out immediately and throw a specific error
        await auth().signOut();
        throw new Error('auth/pending-approval');
      }

      if (userData) {
        setUser(userData);
        await Keychain.setGenericPassword('user', JSON.stringify(userData), { service: KEYCHAIN_SERVICE });
        return userData;
      }

      // If no user data is found in Firestore, something is wrong
      await auth().signOut();
      throw new Error('auth/user-data-not-found');

    } catch (err) {
      console.error('Login error:', err);
      throw err; // Re-throw the error for the login screen to handle
    }
  }, [fetchUserData]);

  const logout = useCallback(async () => {
    try {
      await auth().signOut();
      await Keychain.resetGenericPassword({ service: KEYCHAIN_SERVICE });
      setUser(null);
    } catch (err) {
      console.error('Logout failed:', err);
    }
  }, []);

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const userData = await fetchUserData(firebaseUser);
          // Only set the user if they are verified
          if (userData && userData.status === 'verified') {
            setUser(userData);
          } else {
            // If user is pending or has no data, ensure they are logged out of the app state
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Auth state change error:", error);
      } finally {
        setInitialized(true);
      }
    });
    return subscriber;
  }, [fetchUserData]);

  const value = useMemo(
    () => ({ user, login, logout, isAuthenticated, initialized, fetchUserData }),
    [user, login, logout, initialized, isAuthenticated, fetchUserData]
  );

  if (!initialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2ecc71" />
      </View>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
