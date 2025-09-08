import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS } from "../../constants/Colors";
import { Asana } from "../../lib/api/asanas";
import FavoriteAsanaCard from "./FavoriteAsanaCard";

interface FavoriteAsanasModalProps {
  visible: boolean;
  onClose: () => void;
  favoriteAsanas: Asana[];
  onAsanaPress: (asana: Asana) => void;
}

export default function FavoriteAsanasModal({
  visible,
  onClose,
  favoriteAsanas,
  onAsanaPress,
}: FavoriteAsanasModalProps) {
  const handleAsanaPress = (asana: Asana) => {
    onAsanaPress(asana);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>좋아하는 아사나</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {favoriteAsanas.length > 0 ? (
          <FlatList
            data={favoriteAsanas}
            renderItem={({ item }) => (
              <FavoriteAsanaCard asana={item} onPress={handleAsanaPress} />
            )}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.listContainer}
            columnWrapperStyle={
              favoriteAsanas.length % 2 === 1 ? styles.rowLeft : styles.row
            }
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="heart-outline"
              size={64}
              color={COLORS.textSecondary}
            />
            <Text style={styles.emptyText}>즐겨찾기한 아사나가 없습니다</Text>
            <Text style={styles.emptySubText}>
              아사나 탭에서 하트를 눌러 즐겨찾기에 추가해보세요
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceDark,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.text,
  },
  closeButton: {
    padding: 8,
  },
  listContainer: {
    padding: 24,
  },
  row: {
    justifyContent: "center",
    marginBottom: 16,
    gap: 12,
  },
  rowLeft: {
    justifyContent: "flex-start",
    marginBottom: 16,
    gap: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
    textAlign: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
});
