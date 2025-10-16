import { User } from '@/types';
import { Pressable, StyleSheet, View, Animated } from 'react-native';
import { Card, Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useRef } from 'react';

type UserCardProps = {
  user: User;
  onPress: () => void;
};

export default function UserCard({ user, onPress }: UserCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
  };

  const formattedJoined =
    user.joined instanceof Date && !isNaN(user.joined.getTime())
      ? user.joined.toLocaleDateString()
      : 'N/A';

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <View style={styles.userHeader}>
              <MaterialCommunityIcons name={'account'} size={24} color="#2ecc71" />
              <Text variant="titleMedium" style={styles.userName}>{user.name}</Text>
            </View>
            <Text style={styles.userDetail}>
              <MaterialCommunityIcons name="email" size={14} color="#666" />{'  '}{user.email}
            </Text>
            <View style={styles.userMeta}>
              <Text style={styles.userRole}>{user.role}</Text>
              <Text style={styles.userJoined}>
                {user.status === 'pending' ? 'Requested:' : 'Joined:'} {formattedJoined}
              </Text>
            </View>
          </Card.Content>
        </Card>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    elevation: 2,
  },
  cardContent: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  userName: {
    color: '#333',
    fontWeight: '600',
    fontSize: 16,
  },
  userDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  userMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userRole: {
    color: '#2ecc71',
    fontWeight: '500',
    fontSize: 14,
    backgroundColor: '#f0faf3',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  userJoined: {
    color: '#888',
    fontSize: 12,
  },
});
