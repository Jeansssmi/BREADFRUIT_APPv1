import { useAuth } from '@/context/AuthContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import React, { useState, useCallback, useEffect } from 'react';
import {
  Alert,
  StyleSheet,
  View,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Text, Button, Appbar, useTheme } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import firestore from '@react-native-firebase/firestore';

const SettingsItem = ({ icon, name, onPress, isLogout = false, theme }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.settingsItem, { backgroundColor: theme.colors.card }]}
  >
    <MaterialIcons
      name={icon}
      size={24}
      color={isLogout ? '#D32F2F' : theme.colors.text}
    />
    <Text
      style={[
        styles.settingsItemText,
        { color: isLogout ? '#D32F2F' : theme.colors.text },
      ]}
    >
      {name}
    </Text>
    {!isLogout && (
      <MaterialIcons name="chevron-right" size={24} color={theme.colors.text} />
    )}
  </TouchableOpacity>
);

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { user, logout, fetchUserData } = useAuth();
  const theme = useTheme();

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unseenCount, setUnseenCount] = useState(0);

  useEffect(() => {
    const loadInitialData = async () => {
      if (!user) return;
      await fetchUserData(user);
      setUserData(user);
      setLoading(false);
    };
    loadInitialData();
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      if (!user?.uid) return;

      const unsubscribe = firestore()
        .collection('users')
        .doc(user.uid)
        .onSnapshot((doc) => {
          if (doc.exists) {
            setUserData({ uid: user.uid, ...doc.data() });
          }
        });

      return () => unsubscribe();
    }, [user?.uid])
  );

 useEffect(() => {
   if (!user?.uid) return;
   if (!userData?.role) return;

   let unsub: any;

   unsub = firestore()
     .collection("notification")
     .where("recipientID", "==", user.uid)
     .where("seen", "==", false)
     .onSnapshot(
       snap => setUnseenCount(snap?.size ?? 0),
       () => setUnseenCount(0)
     );

   return () => unsub && unsub();
 }, [user?.uid, userData?.role]);


  const getInitials = () => {
    if (!userData?.name) return '?';
    return userData.name.split(' ')[0][0].toUpperCase();
  };

  const handleLogout = () => {
    Alert.alert('Confirm Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => logout() },
    ]);
  };

  if (loading || !userData) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header
        style={[
          styles.appbarHeader,
          { backgroundColor: theme.colors.card, borderBottomColor: theme.dark ? '#333' : '#eee' },
        ]}
      >
        <Appbar.Content title="Profile" titleStyle={[styles.appbarTitle, { color: theme.colors.text }]} />
        <Appbar.Action
          icon="bell-outline"
          color={theme.colors.text}
          onPress={() => navigation.navigate('NotificationsScreen')}
        />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileSection}>
          <View style={styles.avatarCircle}>
            {userData.image ? (
              <Image source={{ uri: userData.image }} style={styles.profileImage} />
            ) : (
              <Text style={styles.initialsText}>{getInitials()}</Text>
            )}
          </View>

          <Text style={[styles.name, { color: theme.colors.text }]}>
            {userData.name}
          </Text>

          <Text style={[styles.email, { color: theme.dark ? '#bbb' : '#666' }]}>
            {userData.email}
          </Text>

          <Button
            mode="contained"
            onPress={() => navigation.navigate('EditProfile')}
            style={[styles.editButton, { backgroundColor: theme.colors.primary }]}
            labelStyle={styles.editButtonLabel}
            icon={() => <MaterialIcons name="edit" size={16} color="white" />}
          >
            Edit Profile
          </Button>
        </View>

        <View style={styles.settingsSection}>
          <Text style={[styles.settingsTitle, { color: theme.colors.primary }]}>
            Settings
          </Text>

          <SettingsItem
            icon="help-outline"
            name="About App"
            onPress={() => navigation.navigate('AboutHelp')}
            theme={theme}
          />

          <SettingsItem
            icon="palette"
            name="Appearance"
            onPress={() => navigation.navigate('Appearance')}
            theme={theme}
          />

          <SettingsItem
            icon="bookmark"
            name="Tracked Trees"
            onPress={() => navigation.navigate('TrackedTrees', { trackedBy: userData.uid })}
            theme={theme}
          />

          <SettingsItem
            icon="logout"
            name="Logout"
            isLogout
            onPress={handleLogout}
            theme={theme}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1 },
  appbarHeader: {
    borderBottomWidth: 1,
    elevation: 0,
  },
  appbarTitle: { fontSize: 20, fontWeight: 'bold' },
  scrollContent: { paddingBottom: 40 },
  profileSection: { paddingVertical: 30, alignItems: 'center' },
  avatarCircle: {
    width: 100,
    height: 100,
    backgroundColor: '#2ecc71',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  profileImage: { width: '100%', height: '100%', borderRadius: 50 },
  initialsText: { fontSize: 40, fontWeight: 'bold', color: 'white' },
  name: { fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  email: { fontSize: 14, marginBottom: 20 },
  editButton: { borderRadius: 30, paddingHorizontal: 18 },
  editButtonLabel: { fontSize: 14, fontWeight: 'bold' },
  settingsSection: { paddingHorizontal: 20, marginTop: 20 },
  settingsTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10, marginLeft: 10 },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 1,
  },
  settingsItemText: { flex: 1, marginLeft: 15, fontSize: 16 },
});
