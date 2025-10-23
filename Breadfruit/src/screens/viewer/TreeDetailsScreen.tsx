import React from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from 'react-native-paper'; // ✅ Added theme hook
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTreeData } from '@/hooks/useTreeData';

// ✅ Themed TreeDetails
function TreeDetails({ treeID }) {
  const navigation = useNavigation();
  const theme = useTheme();
  const { trees, isLoading } = useTreeData({ mode: 'single', treeID: treeID.toString() });
  const tree = trees[0];

  const handleSendNotification = () => {
    navigation.navigate('FruitScanner', { treeID: treeID, skipImagePrompt: true });
  };

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!tree) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorText, { color: theme.colors.error || '#c0392b' }]}>
          Tree not found.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={[styles.scrollContainer, { backgroundColor: theme.colors.background }]}
    >
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {tree.image ? (
          <Image source={{ uri: tree.image }} style={styles.treeImage} resizeMode="cover" />
        ) : (
          <View
            style={[
              styles.treeImage,
              styles.imagePlaceholder,
              { backgroundColor: theme.dark ? '#333' : '#eee' },
            ]}
          >
            <MaterialIcons
              name="no-photography"
              size={40}
              color={theme.dark ? '#bbb' : '#666'}
            />
          </View>
        )}

        <View
          style={[
            styles.detailsCard,
            { backgroundColor: theme.colors.card, shadowColor: theme.dark ? '#000' : '#ccc' },
          ]}
        >
          <Text style={[styles.title, { color: theme.colors.primary }]}>
            Breadfruit Tree #{tree.treeID}
          </Text>

          <View style={styles.detailRow}>
            <MaterialIcons name="location-on" size={20} color={theme.colors.primary} />
            <Text style={[styles.detailText, { color: theme.colors.text }]}>{tree.city}</Text>
          </View>

          <View style={styles.statsContainer}>
            <View
              style={[
                styles.statItem,
                { backgroundColor: theme.dark ? '#2a2a2a' : '#f0f0f0' },
              ]}
            >
              <Text style={[styles.statLabel, { color: theme.dark ? '#aaa' : '#666' }]}>
                Diameter
              </Text>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {tree.diameter.toFixed(2)}m
              </Text>
            </View>
            <View
              style={[
                styles.statItem,
                { backgroundColor: theme.dark ? '#2a2a2a' : '#f0f0f0' },
              ]}
            >
              <Text style={[styles.statLabel, { color: theme.dark ? '#aaa' : '#666' }]}>
                Tracked Date
              </Text>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {new Date(tree.dateTracked).toLocaleDateString()}
              </Text>
            </View>
            <View
              style={[
                styles.statItem,
                { backgroundColor: theme.dark ? '#2a2a2a' : '#f0f0f0' },
              ]}
            >
              <Text style={[styles.statLabel, { color: theme.dark ? '#aaa' : '#666' }]}>
                Fruit Status
              </Text>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {tree.fruitStatus}
              </Text>
            </View>
          </View>

          <View style={styles.coordinateContainer}>
            <MaterialIcons name="map" size={20} color={theme.colors.primary} />
            <Text
              style={[
                styles.coordinateText,
                { color: theme.dark ? '#bbb' : '#666' },
              ]}
            >
              {tree.coordinates.latitude.toFixed(6)}, {tree.coordinates.longitude.toFixed(6)}
            </Text>
          </View>
        </View>

        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.colors.primary }]}
            onPress={handleSendNotification}
          >
            <Text style={styles.buttonText}>Send Notification</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: theme.dark ? '#555' : '#333' },
            ]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.buttonText}>Close Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

export default function TreeDetailsScreen() {
  const route = useRoute();
  const theme = useTheme();

  const treeID = route.params?.treeID;

  if (!treeID) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorText, { color: theme.colors.error || '#c0392b' }]}>
          Error: Tree ID is missing.
        </Text>
        <Text style={{ color: theme.colors.text }}>Please go back and try again.</Text>
      </View>
    );
  }

  return <TreeDetails treeID={treeID} />;
}

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1 },
  container: { flex: 1, padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  treeImage: { height: 300, borderRadius: 12, marginBottom: 16 },
  imagePlaceholder: { justifyContent: 'center', alignItems: 'center' },
  detailsCard: { borderRadius: 12, marginBottom: 16, elevation: 2, padding: 16 },
  title: { marginBottom: 20, fontWeight: 'bold', fontSize: 18 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  detailText: { fontSize: 16 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 16, gap: 12 },
  statItem: { flex: 1, alignItems: 'center', padding: 12, borderRadius: 8 },
  statLabel: { fontSize: 14, marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: '600' },
  coordinateContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8 },
  coordinateText: { fontSize: 14, fontFamily: 'monospace' },
  buttonGroup: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  button: {
    flex: 1,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    marginHorizontal: 5,
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
