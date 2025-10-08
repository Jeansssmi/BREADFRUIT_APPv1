import { Tree } from '@/types';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Modal, View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { Button, Card } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

// Note: Ensure the Tree interface from '@/types' is available.

interface TreeDetailsModalProps {
  visible: boolean;
  tree?: Tree; // Accept the Tree object
  onClose: () => void;
}

const TreeDetailsModal = ({ visible, tree, onClose }: TreeDetailsModalProps) => {
  // @ts-ignore
  const navigation = useNavigation();

  if (!tree) return null;

  // Handler to navigate to the full details screen
  const handleViewDetails = () => {
    onClose(); // Close the modal
    // Assuming the TreeDetailsScreen is nested under a 'Trees' stack/tab.
    navigation.navigate('Trees', {
        screen: 'TreeDetails',
        params: { treeID: tree.treeID }
    });
  };

  const handleUpdate = () => {
    onClose(); // Close the modal first
    navigation.navigate('EditTree', { treeID: tree.treeID });
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            {/* --- Tree Image / Placeholder --- */}
            {tree.image ? (
                <Image
                source={{ uri: tree.image }}
                style={styles.treeImage}
                resizeMode="cover"
                />
            ) : (
                <View style={[styles.treeImage, styles.imagePlaceholder]}>
                <MaterialIcons name="no-photography" size={40} color="#666" />
                </View>
            )}

            <Card style={styles.detailsCard}>
                <Card.Content>
                <Text style={styles.title}>{tree.treeID}</Text>

                {/* Location Detail */}
                <View style={styles.detailRow}>
                    <MaterialIcons name="location-on" size={20} color="#2ecc71" />
                    <Text style={styles.detailText}>{tree.city}</Text>
                </View>

                {/* Stats Container (Diameter, Date, Status) */}
                <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Diameter</Text>
                        <Text style={styles.statValue}>{tree.diameter.toFixed(2)}m</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Fruit Status</Text>
                        <Text style={styles.statValue}>{tree.fruitStatus}</Text>
                    </View>
                </View>

                {/* Coordinate/Mark Location - Clickable to navigate to full details */}
                <TouchableOpacity onPress={handleViewDetails} style={styles.coordinateTouchable}>
                    <View style={styles.coordinateContainer}>
                        <MaterialIcons name="map" size={20} color="#2ecc71" />
                        <Text style={styles.coordinateText}>
                            {tree.coordinates.latitude.toFixed(6)},
                            {tree.coordinates.longitude.toFixed(6)}
                        </Text>
                        <MaterialIcons name="chevron-right" size={24} color="#666" style={{ marginLeft: 'auto' }} />
                    </View>
                </TouchableOpacity>
                </Card.Content>
            </Card>

            {/* --- Button Group --- */}
            <View style={styles.buttonGroup}>
                <Button
                mode="contained"
                style={styles.button}
                onPress={handleUpdate}
                >
                Update Details
                </Button>
                <Button
                mode="contained"
                onPress={onClose}
                style={[styles.button, styles.closeButton]}
                >
                Close
                </Button>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '90%',
    maxHeight: '85%',
    backgroundColor: 'white',
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'hidden',
  },
  scrollContainer: {
    flexGrow: 1,
    width: '100%',
    padding: 16,
  },
  treeImage: { height: 200, borderRadius: 12, marginBottom: 16, width: '100%' },
  imagePlaceholder: { backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' },
  detailsCard: { borderRadius: 12, marginBottom: 16, elevation: 0, backgroundColor: '#fff', width: '100%' },
  title: { marginBottom: 15, color: '#2ecc71', fontWeight: 'bold', fontSize: 20 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  detailText: { fontSize: 16, color: '#333' },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 16, gap: 12 },
  statItem: { flex: 1, alignItems: 'center', padding: 12, backgroundColor: '#f5f5f5', borderRadius: 8 },
  statLabel: { fontSize: 12, color: '#666', marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: '600', color: '#333' },

  coordinateTouchable: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  coordinateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  coordinateText: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'monospace',
    fontWeight: '500',
  },

  buttonGroup: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    width: '100%',
    paddingBottom: 10,
  },
  button: { flex: 1, borderRadius: 25, backgroundColor: '#2ecc71' },
  closeButton: { backgroundColor: '#333' },
});

export default TreeDetailsModal;