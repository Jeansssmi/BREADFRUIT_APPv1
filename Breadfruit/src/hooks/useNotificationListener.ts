import { useEffect, useState } from 'react';
import firestore from '@react-native-firebase/firestore';
import { useAuth } from '@/context/AuthContext';

export function useNotificationListener() {
  const { user } = useAuth();
  const [latestNotification, setLatestNotification] = useState<any>(null);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = firestore()
      .collection('notification')
      .where('userId', '==', user.uid)
      .where('read', '==', false)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .onSnapshot((snapshot) => {
        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          const data = { id: doc.id, ...doc.data() };
          setLatestNotification(data);

          // Mark as read immediately to prevent duplicate alerts
          doc.ref.update({ read: true });
        }
      });

    return () => unsubscribe();
  }, [user]);

  return latestNotification;
}
