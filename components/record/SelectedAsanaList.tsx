import React, { useMemo } from "react";
import {
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AsanaCard } from "../AsanaCard";
import { Asana } from "../../lib/api/asanas";
import { COLORS } from "../../constants/Colors";

interface SelectedAsanaListProps {
  asanas: Asana[];
  onRemove?: (asanaId: string) => void;
}

const { width: screenWidth } = Dimensions.get("window");
// 섹션 좌우 패딩(20*2)과 카드 간격(12) 고려한 카드 폭
const cardWidth = (screenWidth - 80 - 12) / 2;

export function SelectedAsanaList({ asanas, onRemove }: SelectedAsanaListProps) {
  const data = useMemo(() => asanas || [], [asanas]);

  const renderItem = ({ item }: { item: Asana }) => (
    <View style={styles.cardWrapper}>
      <AsanaCard asana={item} onPress={() => {}} showFavoriteIndicator={false} />
      {onRemove && (
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => onRemove(item.id)}
        >
          <Text style={styles.removeButtonText}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      numColumns={2}
      scrollEnabled={false}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.listContainer}
    />
  );
}

const styles = StyleSheet.create({
  listContainer: {
    paddingBottom: 8,
    paddingHorizontal: 0,
  },
  row: {
    justifyContent: "flex-start",
    marginBottom: 10,
    gap: 12,
  },
  cardWrapper: {
    width: cardWidth,
    marginBottom: 10,
  },
  removeButton: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.error,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  removeButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "700",
  },
});


