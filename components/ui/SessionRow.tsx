import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS } from "../../constants/Colors";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

interface SessionRowProps {
  iconName: IoniconName;
  title: string;
  badge?: string;
  subtitle?: string | null;
  active?: boolean;
  onPress: () => void;
  onRename?: () => void;
  onDelete?: () => void;
}

export function SessionRow({
  iconName,
  title,
  badge,
  subtitle,
  active = false,
  onPress,
  onRename,
  onDelete,
}: SessionRowProps) {
  return (
    <View style={[styles.row, active && styles.rowActive]}>
      <TouchableOpacity
        style={styles.main}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Ionicons
          name={iconName}
          size={14}
          color={active ? COLORS.primary : COLORS.textSecondary}
        />
        <View style={{ flex: 1 }}>
          <Text
            style={[styles.title, active && { color: COLORS.primary }]}
            numberOfLines={1}
          >
            {title}
            {badge ? `  ${badge}` : ""}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
      {onRename ? (
        <TouchableOpacity
          onPress={onRename}
          style={styles.action}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
        >
          <Ionicons
            name="create-outline"
            size={16}
            color={COLORS.textMuted}
          />
        </TouchableOpacity>
      ) : null}
      {onDelete ? (
        <TouchableOpacity
          onPress={onDelete}
          style={styles.action}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
        >
          <Ionicons name="trash-outline" size={16} color={COLORS.textMuted} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderRadius: 10,
  },
  rowActive: {
    backgroundColor: "rgba(139, 92, 246, 0.10)",
  },
  main: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  action: { padding: 6 },
  title: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "700",
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
});
