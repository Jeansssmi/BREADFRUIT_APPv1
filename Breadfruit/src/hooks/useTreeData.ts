import { Tree } from '@/types';
import { useEffect, useState } from 'react';

// ✅ Correct import for react-native-firebase
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
    // ✅ Correct syntax for react-native-firebase
    const treesRef = firestore().collection('trees');
    setIsLoading(true);

    const getTrees = async () => {
      try {
        let treeData: Tree[] = [];
        let query: FirebaseFirestoreTypes.Query = treesRef; // Start with the base reference

        if (fetchConfig.mode === 'all') {
          query = query.where('status', '==', 'verified');
        } else if (fetchConfig.mode === 'criteria') {
          // Add status filter unless querying by status
          if (fetchConfig.field !== 'status') {
            query = query.where('status', '==', 'verified');
          }
          // Add the specified criteria filter
          query = query.where(fetchConfig.field, fetchConfig.operator, fetchConfig.value);
        } else if (fetchConfig.mode === 'single') {
          const docSnap = await treesRef.doc(fetchConfig.treeID).get();
          if (docSnap.exists) {
            treeData = [{ treeID: docSnap.id, ...docSnap.data() } as Tree];
          } else {
            throw new Error("Tree not found");
          }
          // Set state and exit early for single doc fetch
          setTrees(treeData);
          setIsLoading(false);
          return;
        }

        // Execute the built query
        const snapshot = await query.get();
        treeData = snapshot.docs.map(doc => ({ treeID: doc.id, ...doc.data() } as Tree));

        setTrees(treeData);
        setError(null);
      } catch (err: any)      {
        console.error('Error fetching trees:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    getTrees();
  }, [JSON.stringify(fetchConfig)]);

  return { trees, isLoading, error };
};