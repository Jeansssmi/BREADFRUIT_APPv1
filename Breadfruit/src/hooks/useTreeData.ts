import { Tree } from '@/types';
import { useEffect, useState } from 'react';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

type FetchType =
  | { mode: 'all' }
  | { mode: 'criteria'; field: string; operator: FirebaseFirestoreTypes.WhereFilterOp; value: any }
  | { mode: 'single'; treeID: string };

export const useTreeData = (fetchConfig: FetchType = { mode: 'all' }) => {
  const [trees, setTrees] = useState<Tree[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const treesRef = firestore().collection('trees');
    setIsLoading(true);

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
      return;
    }

    // ✅ FIXED QUERY LOGIC
    let query: FirebaseFirestoreTypes.Query = treesRef;

    if (fetchConfig.mode === 'all') {
      query = query.where('status', '==', 'verified');
    } else if (fetchConfig.mode === 'criteria') {
      query = query.where(fetchConfig.field, fetchConfig.operator, fetchConfig.value);
    }

     const unsubscribe = query.onSnapshot(
          (snapshot) => {
            const liveTrees = snapshot.docs.map(
              (doc) => ({
                // ✅ FIX: Use 'id' for the document ID and keep 'treeID' for the BFT field.
                id: doc.id,
                ...doc.data(),
              } as Tree)
            );
            setTrees(liveTrees);
            setError(null);
            setIsLoading(false);
          },
          (err) => {
            // ... (error handling)
          }
        );

    return () => unsubscribe();
  }, [JSON.stringify(fetchConfig)]);

  return { trees, isLoading, error };
};
