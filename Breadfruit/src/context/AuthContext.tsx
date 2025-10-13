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

type User = {
  uid: string;
  name: string;
  email: string;
  role: string;
  status: string;
  image: string | null;
  joined: any;
};

type AuthContextType = {
  user: User | null;
  login: (email: string, password: string) => Promise<User | null>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  initialized: boolean;
  fetchUserData: (firebaseUser: any) => Promise<User | null>;
  updateLocalUser: (updatedData: Partial<User>) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const KEYCHAIN_SERVICE = 'com.breadfruit.usersession';

export function AuthProvider({ children }) {
  const [user, setUser] = useState<User | null>(null);
  const [initialized, setInitialized] = useState(false);

  const isAuthenticated = !!user;

  // ✅ FIXED: Added guard for undefined user
  const fetchUserData = useCallback(async (firebaseUser) => {
    if (!firebaseUser || !firebaseUser.uid) {
      console.warn('⚠️ fetchUserData called without a valid Firebase user.');
      return null;
    }

    try {
      const docSnap = await firestore().collection('users').doc(firebaseUser.uid).get();
      if (docSnap.exists) {
        const data = docSnap.data();
        return {
          uid: firebaseUser.uid,
          name: data?.name || '',
          email: data?.email || '',
          role: data?.role || '',
          status: data?.status || '',
          image: data?.image || null,
          joined: data?.joined || null,
        };
      } else {
        console.warn('⚠️ User document not found in Firestore.');
        return null;
      }
    } catch (error) {
      console.error('❌ Failed to fetch user data:', error);
      return null;
    }
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const credential = await auth().signInWithEmailAndPassword(email, password);
      const firebaseUser = credential.user;
      const userData = await fetchUserData(firebaseUser);

      if (userData && userData.status === 'pending') {
        await auth().signOut();
        const error = new Error('Your account is pending approval.');
        (error as any).code = 'auth/pending-approval';
        throw error;
      }

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

  const updateLocalUser = useCallback((updatedData: Partial<User>) => {
    setUser(prevUser => (prevUser ? { ...prevUser, ...updatedData } : null));
  }, []);

  // ✅ FIXED: Added guard for undefined firebaseUser on initial load
  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setInitialized(true);
        return;
      }

      const userData = await fetchUserData(firebaseUser);
      setUser(userData);
      setInitialized(true);
    });

    return unsubscribe;
  }, [fetchUserData]);

  const value = useMemo(
    () => ({
      user,
      login,
      logout,
      isAuthenticated,
      initialized,
      fetchUserData,
      updateLocalUser,
    }),
    [user, login, logout, initialized, isAuthenticated, fetchUserData, updateLocalUser]
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
