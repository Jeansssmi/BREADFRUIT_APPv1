import { Tree } from '@/types';
import { useEffect, useState , cachedTrees} from 'react';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

type FetchType =
  | { mode: 'all' }
  | { mode: 'criteria'; field: string; operator: FirebaseFirestoreTypes.WhereFilterOp; value: any }
  | { mode: 'single'; treeID: string };

export const useTreeData = (fetchConfig: FetchType = { mode: 'all' }) => {
  const [trees, setTrees] = useState<Tree[]>(cachedTrees || []);
  const [isLoading, setIsLoading] = useState(!cachedTrees);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const treesRef = firestore().collection('trees');
    setIsLoading(true);

      // ✅ Handle single fetch separately (no live listener needed)
        if (fetchConfig.mode === 'single') {
          const fetchSingle = async () => {
            try {
              const docSnap = await treesRef.doc(fetchConfig.treeID).get();
              if (docSnap.exists) {
                const tree = { treeID: docSnap.id, ...docSnap.data() } as Tree;
                setTrees([tree]);
                cachedTrees = [tree];
              } else {
                throw new Error('Tree not found');
              }
              setError(null);
            } catch (err: any) {
              console.error('Error fetching tree:', err);
              setError(err.message);
            } finally {
              setIsLoading(false);
            }
          };
          fetchSingle();
          return;
        }

    let query: FirebaseFirestoreTypes.Query = treesRef;

    if (fetchConfig.mode === 'all') {
      query = query.where('status', '==', 'verified');
    } else if (fetchConfig.mode === 'criteria') {
      if (fetchConfig.field !== 'status') {
        query = query.where('status', '==', 'verified');
      }
      query = query.where(fetchConfig.field, fetchConfig.operator, fetchConfig.value);
    }

  // onSnapshot returns an unsubscribe function.
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

    // ✅ Cleanup listener on unmount
    return () => unsubscribe();

  }, [JSON.stringify(fetchConfig)]); // Dependency array ensures the listener is reset if the query changes

  return { trees, isLoading, error };
};