import { User } from '@/types';
import { useNavigation } from '@react-navigation/native';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function PendingUserDetails({ user }: { user: User }) {
  const navigation = useNavigation();

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <View style={styles.avatarContainer}>
          {user?.image ? (
            <Image source={{ uri: user.image }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <MaterialCommunityIcons name="account" size={40} color="#666" />
            </View>
          )}
          <Text variant="titleLarge" style={styles.title}>{user?.name}</Text>
          <Text style={styles.roleBadge}>{user?.role?.toUpperCase()}</Text>
        </View>
        <Card style={styles.detailsCard}>
          <Card.Content>
            <View style={styles.detailItem}>
              <MaterialCommunityIcons name="email" size={20} color="#2ecc71" />
              <Text style={styles.detailText}>{user?.email}</Text>
            </View>
            <View style={styles.detailItem}>
              <MaterialCommunityIcons name="account-cog" size={20} color="#2ecc71" />
              <Text style={styles.detailText}>{user?.role}</Text>
            </View>
            {user?.joined && (
              <View style={styles.detailItem}>
                <MaterialCommunityIcons name="calendar" size={20} color="#2ecc71" />
                <Text style={styles.detailText}>Requested: {new Date(user.joined).toLocaleDateString()}</Text>
              </View>
            )}
          </Card.Content>
        </Card>
        <View style={styles.buttonGroup}>
          <Button 
            mode="contained" style={styles.button}
            onPress={() => navigation.navigate('EditUser', { userID: user.uid })}
          >
            Approve
          </Button>
          <Button mode="contained" style={[styles.button, styles.adminButton]} onPress={() => console.log('Reject logic here')}>
            Reject
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#ffffff',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  avatarPlaceholder: {
    backgroundColor: '#f0faf3',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2ecc71',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: '#2ecc71',
    color: 'white',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    fontSize: 12,
    fontWeight: 'bold',
  },
  detailsCard: {
    borderRadius: 12,
    marginBottom: 24,
    elevation: 2,
    backgroundColor: '#fff',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  detailText: {
    fontSize: 16,
    color: '#333',
    flexShrink: 1,
  },
  buttonGroup: {
    gap: 12,
    marginTop: 16,
  },
  button: {
    borderRadius: 25,
    backgroundColor: '#2ecc71',
  },
  adminButton: {
    backgroundColor: '#333',
  },
  buttonLabel: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});