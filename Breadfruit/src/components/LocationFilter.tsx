// components/LocationFilter.tsx
import { View, StyleSheet } from 'react-native';
import { Chip } from 'react-native-paper';

type LocationFilterProps = {
    selected: string;
    onSelect: (location: string) => void;
    locations: string[];
  };

export const LocationFilter = ({selected, onSelect, locations} : LocationFilterProps) => {
  return (
    <View style={styles.container}>
      {locations.map(location => (
        <Chip
          key={location}
          mode="outlined"
          selected={location === selected}
          onPress={() => onSelect(location)}
          style={[
            styles.chip,
            location === selected && styles.selectedChip
          ]}
          textStyle={[
            styles.chipText,
            location === selected && styles.selectedChipText
          ]}
        >
          {location}
        </Chip>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#2ecc71',
    borderRadius: 20,
  },
  selectedChip: {
    backgroundColor: '#2ecc71',
  },
  chipText: {
    color: '#2ecc71',
    fontSize: 14,
  },
  selectedChipText: {
    color: '#ffffff',
  },
});