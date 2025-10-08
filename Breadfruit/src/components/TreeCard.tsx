import { Tree } from '@/types';
import { Pressable, StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

type TreeCardProps = {
  tree: Tree;
  onPress: () => void; // Changed from stringPath to onPress
}

export default function TreeCard({ tree, onPress }: TreeCardProps) {
  return (
    <Pressable onPress={onPress}>
      <Card style={styles.treeCard}>
        <Card.Content>
          <Text style={styles.treeID}>
            <MaterialCommunityIcons name="tree" size={16} color="#2ecc71" />
            {'  '}{tree.treeID}
          </Text>
          <Text style={styles.treeDetail}>
            <MaterialCommunityIcons name="map-marker" size={14} color="#666" />
            {'  '}{tree.city}
          </Text>
        </Card.Content>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  treeCard: {
    backgroundColor: '#ffffff',
    marginBottom: 12,
    borderRadius: 12,
    // padding: 5,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#2ecc71',
    // marginHorizontal: 16,
    // width: '100%',
    // alignSelf: 'center',
  },
  treeID: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  treeDetail: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    // marginBottom: 4,
  },
});