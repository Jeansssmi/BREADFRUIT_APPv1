import { User } from '@/types';
import { collection, doc, getDoc, getDocs, getFirestore, query, where } from "firebase/firestore";
import { useEffect, useState } from 'react';

type FetchType =
  | { mode: 'all' }
  | { mode: 'criteria'; field: string; operator: FirebaseFirestore.WhereFilterOp; value: any }
  | { mode: 'single'; uid: string };

export const useUserData = (fetchConfig: FetchType = { mode: 'all' }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const db = getFirestore();
    const usersRef = collection(db, 'users');

    const getUsers = async () => {
      try {
        let userData: User[] = [];

        if (fetchConfig.mode === 'all') {
          const snapshot = await getDocs(usersRef);
          userData = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
        }

        else if (fetchConfig.mode === 'criteria') {
          const q = query(usersRef, where(fetchConfig.field, fetchConfig.operator, fetchConfig.value));
          const snapshot = await getDocs(q);
          userData = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
        }

        else if (fetchConfig.mode === 'single') {
          const docRef = doc(db, 'users', fetchConfig.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            userData = [{ uid: docSnap.id, ...docSnap.data() } as User];
          } else {
            throw new Error("User not found");
          }
        }

        setUsers(userData); 
        setError(null);
        
        } catch (error: any) {
          console.error('Error fetching users:', error);
          setError(error.message);
        } finally {
          setIsLoading(false);
        }
      };

    getUsers();
  }, []);

  return { users, isLoading, error };
};