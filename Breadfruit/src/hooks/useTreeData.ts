import { Tree } from '@/types';
import { collection, doc, getDoc, getDocs, getFirestore, query, where } from "firebase/firestore";
import { useEffect, useState } from 'react';

type FetchType =
  | { mode: 'all' }
  | { mode: 'criteria'; field: string; operator: FirebaseFirestore.WhereFilterOp; value: any }
  | { mode: 'single'; treeID: string };

export const useTreeData = (fetchConfig: FetchType = { mode: 'all' }) => {
  const [trees, setTrees] = useState<Tree[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const db = getFirestore();
    const treesRef = collection(db, 'trees');

    // Reset loading state whenever the config changes
    setIsLoading(true);

    const getTrees = async () => {
      try {
        let treeData: Tree[] = [];
        let q;

        if (fetchConfig.mode === 'all') {
          q = query(treesRef, where('status', '==', 'verified'));

        } else if (fetchConfig.mode === 'criteria') {
          // Base query array
          const queryConstraints = [];

          // Add the status filter unless fetching based on status itself
          if (fetchConfig.field !== 'status') {
            queryConstraints.push(where('status', '==', 'verified'));
          }

          // Add the specified criteria filter
          queryConstraints.push(
            where(fetchConfig.field, fetchConfig.operator, fetchConfig.value)
          );

          // Create the query
          q = query(treesRef, ...queryConstraints);

        } else if (fetchConfig.mode === 'single') {
          const docRef = doc(db, 'trees', fetchConfig.treeID);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            treeData = [{ treeID: docSnap.id, ...docSnap.data() } as Tree];
          } else {
            throw new Error("Tree not found");
          }
        }

        // Execute the query only if it was built (not in 'single' mode)
        if (q) {
            const snapshot = await getDocs(q);
            treeData = snapshot.docs.map(doc => ({ treeID: doc.id, ...doc.data() } as Tree));
        }

        setTrees(treeData);
        setError(null);

        } catch (error: any) {
          console.error('Error fetching trees:', error);
          setError(error.message);
        } finally {
          setIsLoading(false);
        }
      };

    getTrees();
    // ✅ FIX: Add stringified fetchConfig to the dependency array
  }, [JSON.stringify(fetchConfig)]);

  return { trees, isLoading, error };
};