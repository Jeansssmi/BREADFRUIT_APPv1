import { useAuth } from '@/context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { Alert, StyleSheet, View, Image, ScrollView } from 'react-native';
import { Text, Button } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { user, logout } = useAuth();

  const getInitials = () => {
    if (!user?.name) return 'G';
    return user.name.split(' ')[0][0].toUpperCase();
  };

  const handleLogout = () => {
    Alert.alert('Confirm Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => logout() },
    ]);
  };

  const renderProfilePicture = () => {
    if (user?.photoURL) {
      return (
        <Image
          source={{ uri: user.photoURL }}
          style={styles.profileImage}
        />
      );
    }
    // Fallback to text initials
    return (
      <View style={[styles.profileImage, styles.initialsContainer]}>
        <Text style={styles.initialsText}>{getInitials()}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>

      {/* --- Header Content (Profile Info) --- */}
      <View style={styles.header}>
        {renderProfilePicture()}
        <Text variant="titleLarge" style={styles.name}>{user?.name || 'Guest User'}</Text>
        <Text variant="bodyMedium" style={styles.email}>{user?.email || 'No email provided'}</Text>
      </View>

      {/* ScrollView for the settings menu */}
      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* --- Account Section --- */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Account</Text>

          <Button
            mode="text"
            onPress={() => navigation.navigate('EditProfile')}
            style={styles.settingButton}
            contentStyle={styles.settingContent}
            labelStyle={styles.settingLabel}
            icon={() => <MaterialIcons name="account-circle" size={24} color="#333" />}
          >
            Edit Profile
          </Button>

          <Button
            mode="text"
            onPress={() => navigation.navigate('NotificationPreferences')}
            style={styles.settingButton}
            contentStyle={styles.settingContent}
            labelStyle={styles.settingLabel}
            icon={() => <MaterialIcons name="notifications" size={24} color="#333" />}
            textColor="#333"
          >
            Notification Preferences
          </Button>
        </View>

        {/* --- General Settings Section --- */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>General</Text>

          <Button
            mode="text"
            onPress={() => navigation.navigate('AboutHelp')}
            style={styles.settingButton}
            contentStyle={styles.settingContent}
            labelStyle={styles.settingLabel}
            icon={() => <MaterialIcons name="info" size={24} color="#333" />}
            textColor="#333"
          >
            About & Help
          </Button>

          <Button
            mode="text"
            style={styles.settingButton}
            contentStyle={styles.settingContent}
            labelStyle={styles.settingLabel}
            icon={() => <MaterialIcons name="logout" size={24} color="#D32F2F" />}
            textColor="#D32F2F"
            onPress={handleLogout}
          >
            Logout
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    backgroundColor: '#f7f7f7',
    paddingBottom: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 15,
  },
  initialsContainer: {
    backgroundColor: '#2ecc71',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  name: { marginBottom: 5, fontWeight: '700', color: '#333' },
  email: { marginBottom: 20, color: '#666' },

  scrollContent: {
    flexGrow: 1,
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },

  section: {
    width: '100%',
    alignItems: 'flex-start',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
    marginBottom: 20,
  },
  sectionTitle: { color: '#333', fontWeight: 'bold', marginBottom: 10 },
  settingButton: {
    width: '100%',
    justifyContent: 'flex-start',
    paddingVertical: 0,
    height: 50,
  },
  settingContent: {
    justifyContent: 'flex-start',
  },
  settingLabel: {
    fontSize: 14,
    color: '#333',
    marginLeft: 10,
    fontWeight: 'normal',
  },
});
