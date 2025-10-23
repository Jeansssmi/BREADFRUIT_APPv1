import { User } from '@/types';
import { Pressable, StyleSheet, View, Animated } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useRef } from 'react';

type UserCardProps = {
  user: User;
  onPress: () => void;
};

export default function UserCard({ user, onPress }: UserCardProps) {
  const theme = useTheme(); // ✅ Access current theme
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
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Card
          style={[
            styles.card,
            { backgroundColor: theme.colors.card, shadowColor: theme.dark ? '#000' : '#000' },
          ]}
        >
          <Card.Content style={styles.cardContent}>
            <View style={styles.userHeader}>
              <MaterialCommunityIcons name="account" size={24} color={theme.colors.primary} />
              <Text
                variant="titleMedium"
                style={[styles.userName, { color: theme.colors.text }]}
              >
                {user.name}
              </Text>
            </View>

            <Text
              style={[
                styles.userDetail,
                { color: theme.dark ? '#aaa' : '#666' },
              ]}
            >
              <MaterialCommunityIcons
                name="email"
                size={14}
                color={theme.dark ? '#bbb' : '#666'}
              />{'  '}
              {user.email}
            </Text>

            <View style={styles.userMeta}>
              <Text
                style={[
                  styles.userRole,
                  {
                    color: theme.colors.primary,
                    backgroundColor: theme.dark ? '#1f1f1f' : '#f0faf3',
                  },
                ]}
              >
                {user.role}
              </Text>

              <Text
                style={[
                  styles.userJoined,
                  { color: theme.dark ? '#aaa' : '#888' },
                ]}
              >
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
    fontWeight: '600',
    fontSize: 16,
  },
  userDetail: {
    fontSize: 14,
    marginBottom: 8,
  },
  userMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userRole: {
    fontWeight: '500',
    fontSize: 14,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  userJoined: {
    fontSize: 12,
  },
});
