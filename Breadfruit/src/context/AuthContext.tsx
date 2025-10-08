import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { View } from 'react-native';
import Keychain from 'react-native-keychain';
import { ActivityIndicator } from 'react-native-paper';

import { auth, fireStore } from '../firebaseConfig'; // 👈 use relative path instead of @/
import { AuthContextType, User } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const KEYCHAIN_SERVICE = 'com.breadfruit.usersession';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initialized, setInitialized] = useState(false);

  const isAuthenticated = !!user;

  const fetchUserData = useCallback(async (firebaseUser: FirebaseUser): Promise<User | null> => {
    try {
      const docRef = doc(fireStore, 'users', firebaseUser.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          uid: firebaseUser.uid,
          name: data.name,
          email: data.email,
          role: data.role,
          status: data.status,
          image: data.image,
          joined: data.joined,
        };
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    }
    return null;
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<User | null> => {
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = credential.user;
      const userData = await fetchUserData(firebaseUser);

      if (userData) {
        setUser(userData);
        await Keychain.setGenericPassword(
          'user',
          JSON.stringify(userData),
          { service: KEYCHAIN_SERVICE }
        );
        return userData;
      }
      return null;
    } catch (err) {
      console.error('Login error:', err);
      throw err;
    }
  }, [fetchUserData]);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      await Keychain.resetGenericPassword({ service: KEYCHAIN_SERVICE });
      setUser(null);
    } catch (err) {
      console.error('Logout failed:', err);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userData = await fetchUserData(firebaseUser);
        if (userData) {
          setUser(userData);
          await Keychain.setGenericPassword(
            'user',
            JSON.stringify(userData),
            { service: KEYCHAIN_SERVICE }
          );
        }
      } else {
        setUser(null);
        await Keychain.resetGenericPassword({ service: KEYCHAIN_SERVICE });
      }
      setInitialized(true);
    });

    return unsubscribe;
  }, [fetchUserData]);

  const value = useMemo(
    () => ({ user, login, logout, isAuthenticated, initialized }),
    [user, login, logout, initialized, isAuthenticated]
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

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
