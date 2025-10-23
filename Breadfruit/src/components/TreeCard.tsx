import { Tree } from '@/types';
import { Pressable, StyleSheet } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper'; // ✅ useTheme added
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

type TreeCardProps = {
  tree: Tree;
  onPress: () => void;
};

export default function TreeCard({ tree, onPress }: TreeCardProps) {
  const theme = useTheme(); // ✅ access theme

  return (
    <Pressable onPress={onPress}>
      <Card
        style={[
          styles.treeCard,
          {
            backgroundColor: theme.colors.card,
            borderLeftColor: theme.colors.primary, // 🌿 green accent adapts to theme
            shadowColor: theme.dark ? '#000' : '#000',
          },
        ]}
      >
        <Card.Content>
          <Text style={[styles.treeID, { color: theme.colors.text }]}>
            <MaterialCommunityIcons
              name="tree"
              size={16}
              color={theme.colors.primary}
            />
            {'  '}
            {tree.treeID}
          </Text>
          <Text style={[styles.treeDetail, { color: theme.dark ? '#bbb' : '#666' }]}>
            <MaterialCommunityIcons
              name="map-marker"
              size={14}
              color={theme.dark ? '#bbb' : '#666'}
            />
            {'  '}
            {tree.city}
          </Text>
        </Card.Content>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  treeCard: {
    backgroundColor: '#ffffff', // overridden by theme
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#2ecc71', // overridden by theme
  },
  treeID: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333', // overridden by theme
    marginBottom: 8,
  },
  treeDetail: {
    fontSize: 14,
    color: '#666', // overridden by theme
    lineHeight: 20,
  },
});
