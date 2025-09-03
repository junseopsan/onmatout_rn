import React from "react";
import { StyleSheet, View } from "react-native";
import { Asana } from "../../lib/api/asanas";
import { AsanaCard } from "../AsanaCard";

interface FavoriteAsanaCardProps {
  asana: Asana;
  onPress: (asana: Asana) => void;
}

export default function FavoriteAsanaCard({
  asana,
  onPress,
}: FavoriteAsanaCardProps) {
  return (
    <View style={styles.container}>
      <AsanaCard
        asana={asana}
        onPress={onPress}
        isFavorite={true}
        showFavoriteIndicator={true}
        compact={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 140,
  },
});
