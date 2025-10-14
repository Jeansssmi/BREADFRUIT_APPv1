import { Tree } from '@/types';
import { useEffect, useState } from 'react';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

type FetchType =
  | { mode: 'all' }
  | { mode: 'criteria'; field: string; operator: FirebaseFirestoreTypes.WhereFilterOp; value: any }
  | { mode: 'single'; treeID: string };

export const useTreeData = (fetchConfig: FetchType = { mode: 'all' }) => {
  // ✅ FIX: State is initialized as an empty array. The reference to 'cachedTrees' is removed.
  const [trees, setTrees] = useState<Tree[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const treesRef = firestore().collection('trees');
    setIsLoading(true);

    // This handles fetching a single document
    if (fetchConfig.mode === 'single') {
      const fetchSingle = async () => {
        try {
          const docSnap = await treesRef.doc(fetchConfig.treeID).get();
          if (docSnap.exists) {
            setTrees([{ treeID: docSnap.id, ...docSnap.data() } as Tree]);
          } else {
            throw new Error('Tree not found');
          }
          setError(null);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      };
      fetchSingle();
      return; // End the effect here for single fetches
    }

    // This section handles real-time listeners for lists of trees
    let query: FirebaseFirestoreTypes.Query = treesRef;
    if (fetchConfig.mode === 'all') {
      query = query.where('status', '==', 'verified');
    } else if (fetchConfig.mode === 'criteria') {
      if (fetchConfig.field !== 'status') {
        query = query.where('status', '==', 'verified');
      }
      query = query.where(fetchConfig.field, fetchConfig.operator, fetchConfig.value);
    }

    const unsubscribe = query.onSnapshot(
      (snapshot) => {
        const liveTrees = snapshot.docs.map(
          (doc) => ({ treeID: doc.id, ...doc.data() } as Tree)
        );
        setTrees(liveTrees);
        setError(null);
        setIsLoading(false);
      },
      (err) => {
        console.error('Realtime tree listener error:', err);
        setError(err.message);
        setIsLoading(false);
      }
    );

    // Cleanup function to unsubscribe from the listener when the component unmounts
    return () => unsubscribe();

  }, [JSON.stringify(fetchConfig)]); // Re-run the effect if the query changes

  return { trees, isLoading, error };
};