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

import { auth, fireStore as db } from '@/firebaseConfig';
import { AuthContextType, User } from '@/types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);
// EDITED: Made the service name unique to your app
const KEYCHAIN_SERVICE = 'com.breadfruit.usersession';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initialized, setInitialized] = useState(false);

  const isAuthenticated = !!user;

  const fetchUserData = useCallback(
    async (firebaseUser: FirebaseUser): Promise<User | null> => {
      try {
        const docRef = doc(db, 'users', firebaseUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          // Ensure all fields are present, providing defaults if necessary
          return {
            uid: data.uid || firebaseUser.uid,
            name: data.name || 'No Name',
            email: data.email || firebaseUser.email,
            role: data.role || 'viewer',
            status: data.status || 'verified',
            image: data.image || null,
            joined: data.joined || new Date().toISOString(),
          };
        }
        return null; // Return null if user document doesn't exist
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        return null; // EDITED: Ensure null is returned on error
      }
    },
    []
  );

  const login = useCallback(
    async (email: string, password: string): Promise<User | null> => {
      try {
        const credential = await signInWithEmailAndPassword(auth, email, password);
        const userData = await fetchUserData(credential.user);

        if (userData) {
          setUser(userData);
          await Keychain.setGenericPassword('user', JSON.stringify(userData), { service: KEYCHAIN_SERVICE });
          return userData;
        }
        return null;
      } catch (err) {
        console.error('Login error:', err);
        throw err;
      }
    },
    [fetchUserData]
  );

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      setUser(null); // Set user to null immediately for faster UI response
      await Keychain.resetGenericPassword({ service: KEYCHAIN_SERVICE });
    } catch (err) {
      console.error('Logout failed:', err);
    }
  }, []);

  // ADDED: This effect tries to load the user from the keychain on initial app load
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const credentials = await Keychain.getGenericPassword({ service: KEYCHAIN_SERVICE });
        if (credentials) {
          const sessionUser = JSON.parse(credentials.password);
          setUser(sessionUser);
        }
      } catch (e) {
        console.error("Could not load user from session", e);
      } finally {
        // The onAuthStateChanged listener below will still run and sync with Firebase,
        // so we set initialized to true there.
      }
    };
    bootstrapAsync();
  }, []);

  // This effect listens for live Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userData = await fetchUserData(firebaseUser);
        setUser(userData);
        if (userData) {
          await Keychain.setGenericPassword('user', JSON.stringify(userData), { service: KEYCHAIN_SERVICE });
        }
      } else {
        setUser(null);
        await Keychain.resetGenericPassword({ service: KEYCHAIN_SERVICE });
      }
      setInitialized(true); // Firebase is now initialized
    });

    return unsubscribe;
  }, [fetchUserData]);

  const value = useMemo(
    () => ({ user, login, logout, isAuthenticated, initialized }),
    [user, login, logout, initialized, isAuthenticated]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};