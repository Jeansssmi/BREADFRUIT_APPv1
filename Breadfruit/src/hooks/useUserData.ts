import { User } from '@/types';
import { useEffect, useState } from 'react';

// ✅ Correct import for react-native-firebase
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

type FetchType =
  | { mode: 'all' }
  | { mode: 'criteria'; field: string; operator: FirebaseFirestoreTypes.WhereFilterOp; value: any }
  | { mode: 'single'; uid: string };

export const useUserData = (fetchConfig: FetchType = { mode: 'all' }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // ✅ Correct syntax for react-native-firebase
    const usersRef = firestore().collection('users');
    setIsLoading(true);

    const getUsers = async () => {
      try {
        let userData: User[] = [];

        if (fetchConfig.mode === 'all') {
          const snapshot = await usersRef.get();
          userData = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
        } else if (fetchConfig.mode === 'criteria') {
          // ✅ Correct query chaining syntax
          const snapshot = await usersRef
            .where(fetchConfig.field, fetchConfig.operator, fetchConfig.value)
            .get();
          userData = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
        } else if (fetchConfig.mode === 'single') {
          const docSnap = await usersRef.doc(fetchConfig.uid).get();
          if (docSnap.exists) {
            userData = [{ uid: docSnap.id, ...docSnap.data() } as User];
          } else {
            throw new Error("User not found");
          }
        }
        setUsers(userData);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching users:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    getUsers();
    // ✅ FIX: The hook will now re-run when the fetchConfig object changes.
  }, [JSON.stringify(fetchConfig)]);

  return { users, isLoading, error };
};