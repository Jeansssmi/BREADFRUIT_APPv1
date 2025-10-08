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
  }

  // Helper component for the statistic tiles
  const StatTile = ({ count, label }) => (
    <View style={styles.statTile}>
      <Text style={styles.statCount}>{count}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

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
  }

  return (
    <View style={styles.container}>

      {/* --- Header Content (Profile Info) --- */}
      <View style={styles.header}>
        {renderProfilePicture()}
        <Text variant="titleLarge" style={styles.name}>{user?.name || 'Guest User'}</Text>
        <Text variant="bodyMedium" style={styles.email}>{user?.email || 'No email provided'}</Text>
      </View>

      {/* --- User Stats Container (Only Trees Tracked & Scans Logged) --- */}
      <View style={styles.statsContainer}>
        <StatTile count="12" label="Trees Tracked" />
        <View style={styles.statDivider} />
        <StatTile count="24" label="Scans Logged" />
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
            textColor="#D32F2F" // Use destructive color for logout
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
  // Main container fills the whole screen
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    backgroundColor: '#f7f7f7', // Light background for the header area
    // Ensure the header gives room for the stats container below
    paddingBottom: 70,
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

  // --- STATS STYLES FIX ---
  statsContainer: {
    flexDirection: 'row',
    // Align items to center while allowing space between them
    justifyContent: 'space-around',
    width: '90%',
    alignSelf: 'center',
    backgroundColor: '#ffffff', // White background for the floating card
    paddingVertical: 15,
    paddingHorizontal: 5,
    borderRadius: 12,
    // Use negative margin to pull the container up and overlap the header
    marginTop: -50,
    zIndex: 10,
    elevation: 3, // Shadow for Android
    shadowColor: '#000', // Shadow for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  statTile: {
    alignItems: 'center',
    flex: 1,
    // Add horizontal padding/margin to prevent tiles from touching edge
    marginHorizontal: 5,
  },
  statCount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2ecc71',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 5,
  },

  // --- SCROLL VIEW FIX ---
  scrollContent: {
    flexGrow: 1,
    width: '100%',
    paddingHorizontal: 20,
    // Add extra padding at the top to clear the stats container
    paddingTop: 30,
    paddingBottom: 40,
  },

  // --- SETTINGS STYLES ---
  section: {
    width: '100%',
    alignItems: 'flex-start',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
    marginBottom: 20
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
  }
});